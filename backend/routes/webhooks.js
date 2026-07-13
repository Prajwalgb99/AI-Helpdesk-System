const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const Team = require("../models/Team");
const { verifyApiKey } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { ApiError } = require("../middleware/errorHandler");

// POST /api/webhooks/n8n/assign-team
// Secure service-to-service endpoint called by n8n.
router.post(
  "/n8n/assign-team",
  verifyApiKey,
  asyncHandler(async (req, res) => {
    const { ticketId, teamName } = req.body;

    if (!ticketId || !teamName) {
      throw new ApiError(400, "Please provide ticketId and teamName");
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, `Ticket not found with ID: ${ticketId}`);
    }

    const team = await Team.findOne({ name: teamName });
    if (!team) {
      throw new ApiError(404, `Team not found with name: ${teamName}`);
    }

    ticket.assignedTeam = team._id;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: `Ticket successfully assigned to team: ${teamName}`,
      ticket,
    });
  })
);

module.exports = router;
