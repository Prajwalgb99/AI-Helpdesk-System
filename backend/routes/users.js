const express = require("express");

const router = express.Router();

const {
  getUsers,
  updateUserRole,
  deleteUser
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/auth");

// Protected admin routes
router.use(protect, authorize("admin"));

router.get("/", getUsers);

router.patch("/:id", updateUserRole);

router.delete("/:id", deleteUser);

module.exports = router;