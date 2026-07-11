const express = require("express");
const router = express.Router();
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.route("/").post(createTeam).get(getTeams);
router.route("/:id").get(getTeamById).patch(updateTeam).delete(deleteTeam);

module.exports = router;
