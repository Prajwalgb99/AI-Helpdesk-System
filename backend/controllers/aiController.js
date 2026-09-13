const Ticket = require("../models/Ticket");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../middleware/asyncHandler");
const { generateSuggestedReply } = require("../services/groqService");

// POST /api/ai/tickets/:id/suggest-reply — agent/admin only.
// Unlike ticket creation, this call is explicitly triggered by an agent
// clicking a button — so if Groq fails here, we surface a real error
// instead of silently returning something. There's nothing to "fall
// back" to for a reply draft; the agent just tries again.
const suggestReply = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(
    "createdBy",
    "name"
  );
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  let draft;
  try {
    draft = await generateSuggestedReply(ticket);
  } catch (err) {
    console.error("Groq suggestReply error:", err.message);
    throw new ApiError(
      502,
      `AI suggestion error: ${err.message}`
    );
  }

  // Always returned as a draft for the agent to review/edit — this
  // endpoint never sends anything anywhere on its own.
  res.status(200).json({ success: true, draft });
});

module.exports = { suggestReply };
