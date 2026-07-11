const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
} = require("../controllers/ticketController");
const { protect, authorize } = require("../middleware/auth");

// Every ticket route requires a logged-in user, so protect() applies to all.
router.use(protect);

router.route("/").post(createTicket).get(getTickets);

router
  .route("/:id")
  .get(getTicketById)
  .patch(authorize("agent", "admin"), updateTicket);

module.exports = router;
