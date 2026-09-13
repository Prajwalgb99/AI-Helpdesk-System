const User = require("../models/User");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../middleware/asyncHandler");

// GET /api/users — admin only
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate("team", "name");
  res.status(200).json({ success: true, count: users.length, users });
});

// PATCH /api/users/:id — admin promotes/demotes a user and assigns a team.
// This is the ONLY way a user becomes an agent or admin (never at signup).
const updateUserRole = asyncHandler(async (req, res) => {
  const { role, team } = req.body;

  // Prevent an admin from demoting or changing their own role
  if (req.params.id === req.user._id.toString() && role && role !== req.user.role) {
    throw new ApiError(400, "You cannot demote or change your own role");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (role) user.role = role;
  if (role !== "agent") user.team = null; // only agents keep a team
  else if (team) user.team = team;

  await user.save();
  res.status(200).json({ success: true, user });
});

// DELETE /api/users/:id — admin only
const deleteUser = asyncHandler(async (req, res) => {
  // An admin can delete any OTHER account, but not their own — otherwise
  // an admin could lock themselves (and everyone else) out of the system.
  // This check has to live here, not just in the frontend, since anyone
  // could call the API directly.
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  await user.deleteOne();
  res.status(200).json({ success: true, message: "User deleted" });
});

module.exports = { getUsers, updateUserRole, deleteUser };
