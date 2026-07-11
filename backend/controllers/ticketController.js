const Ticket = require("../models/Ticket");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../middleware/asyncHandler");
const { classifyTicket } = require("../services/groqService");

// POST /api/tickets — any logged-in user.
// No manual category/priority from the client anymore — Groq decides
// both from the title + description. If Groq is down, rate-limited, or
// returns something we can't parse, we deliberately swallow that error
// here (not asyncHandler's job) and fall back to safe defaults, because
// a ticket failing to save due to an AI outage would be a much worse
// bug than a ticket briefly sitting under the wrong category.
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

  res.status(201).json({ success: true, ticket });
});

// GET /api/tickets — role-aware.
// This single function replaces three separate endpoints by branching
// on req.user.role, which is the cleanest place to put that logic:
// the route stays one line, and the "who can see what" rule lives here.
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

  res.status(200).json({ success: true, count: tickets.length, tickets });
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

  res.status(200).json({ success: true, ticket });
});

// PATCH /api/tickets/:id — agent/admin only (enforced by route middleware).
// Handles status changes and agent self-assignment in one place.
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

module.exports = { createTicket, getTickets, getTicketById, updateTicket };
