const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  getBreachedTickets,
  deleteTicket,
} = require("../controllers/ticketController");
const { protect, authorize, protectOrApiKey } = require("../middleware/auth");

// Public/API-Key endpoint for cron jobs (or fallback to authenticated users)
router.get("/breached", protectOrApiKey, getBreachedTickets);

router.use(protect);

router.post("/", createTicket);

router.get("/", getTickets);

router.get("/:id", getTicketById);

router.patch("/:id", authorize("agent", "admin"), updateTicket);

router.delete("/:id", authorize("admin"), deleteTicket);

module.exports = router;
