const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["hardware", "software", "network", "access", "billing", "other"],
      default: "other",
    },
    // One-line summary written by Groq at creation time — shown in the
    // ticket list/detail so an agent can triage without opening every
    // ticket to read the full description.
    aiSummary: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Which team the ticket is routed to (set at creation, based on category
    // or chosen by the user — kept simple here).
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    // A specific agent can pick it up / be assigned within the team.
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true } // gives createdAt / updatedAt automatically
);

// Speeds up the two most common queries: "my tickets" and "my team's tickets"
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTeam: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);
