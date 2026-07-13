const Ticket = require("../models/Ticket");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../middleware/asyncHandler");
const { classifyTicket } = require("../services/groqService");

// Helper to calculate SLA breach status dynamically based on priority.
// Urgent = 2 hours, High = 4 hours, Medium = 24 hours, Low/Default = 72 hours.
const isTicketSlaBreached = (ticket) => {
  if (ticket.status === "resolved") return false;

  const hoursElapsed =
    (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60);

  switch (ticket.priority) {
    case "urgent":
      return hoursElapsed > 2;
    case "high":
      return hoursElapsed > 4;
    case "medium":
      return hoursElapsed > 24;
    case "low":
    default:
      return hoursElapsed > 72;
  }
};

// POST /api/tickets — any logged-in user.
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, assignedTeam } = req.body;

  let category = "other";
  let priority = "medium";
  let aiSummary = "";

  try {
    const classification = await classifyTicket(title, description);
    category = classification.category;
    priority = classification.priority;
    aiSummary = classification.summary;
  } catch (err) {
    console.error("Groq classification failed, using defaults:", err.message);
  }

  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority,
    aiSummary,
    assignedTeam: assignedTeam || null,
    createdBy: req.user._id,
  });

  // Asynchronously fire webhook to n8n if configured
  if (process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: ticket._id,
        category: ticket.category,
        priority: ticket.priority,
        title: ticket.title,
      }),
    }).catch((err) => {
      console.error("Failed to send webhook to n8n:", err.message);
    });
  }

  res.status(201).json({ success: true, ticket });
});

// GET /api/tickets — role-aware.
const getTickets = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === "user") {
    filter = { createdBy: req.user._id };
  } else if (req.user.role === "agent") {
    filter = { assignedTeam: req.user.team };
  }
  // admin: no filter — sees everything

  const tickets = await Ticket.find(filter)
    .populate("createdBy", "name email")
    .populate("assignedAgent", "name email")
    .populate("assignedTeam", "name")
    .sort({ createdAt: -1 });

  // Map and attach dynamic SLA status
  const ticketsWithSla = tickets.map((t) => {
    const tObj = t.toObject();
    tObj.isSlaBreached = isTicketSlaBreached(t);
    return tObj;
  });

  res
    .status(200)
    .json({ success: true, count: tickets.length, tickets: ticketsWithSla });
});

// GET /api/tickets/breached — API-Key or role protected
const getBreachedTickets = asyncHandler(async (req, res) => {
  // Query all tickets that are not resolved
  const tickets = await Ticket.find({ status: { $ne: "resolved" } })
    .populate("createdBy", "name email")
    .populate("assignedAgent", "name email")
    .populate("assignedTeam", "name")
    .sort({ createdAt: -1 });

  // Filter for SLA breaches and format output
  const breached = tickets
    .filter(isTicketSlaBreached)
    .map((t) => {
      const tObj = t.toObject();
      tObj.isSlaBreached = true;
      return tObj;
    });

  res.status(200).json(breached);
});

// GET /api/tickets/:id
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("assignedAgent", "name email")
    .populate("assignedTeam", "name");

  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  // A regular user may only view their own ticket, not anyone else's.
  const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
  if (req.user.role === "user" && !isOwner) {
    throw new ApiError(403, "You do not have access to this ticket");
  }

  const tObj = ticket.toObject();
  tObj.isSlaBreached = isTicketSlaBreached(ticket);

  res.status(200).json({ success: true, ticket: tObj });
});

// PATCH /api/tickets/:id — agent/admin only (enforced by route middleware).
const updateTicket = asyncHandler(async (req, res) => {
  const { status, assignedAgent, priority } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  // An agent can only touch tickets routed to their own team.
  if (
    req.user.role === "agent" &&
    ticket.assignedTeam?.toString() !== req.user.team?.toString()
  ) {
    throw new ApiError(403, "This ticket is not assigned to your team");
  }

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (assignedAgent) ticket.assignedAgent = assignedAgent;

  await ticket.save();

  res.status(200).json({ success: true, ticket });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  getBreachedTickets,
};
