const express = require("express");
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.route("/").get(getUsers);
router.route("/:id").patch(updateUserRole).delete(deleteUser);

module.exports = router;
