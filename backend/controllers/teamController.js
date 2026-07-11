const Team = require("../models/Team");
const User = require("../models/User");
const { ApiError } = require("../middleware/errorHandler");
const asyncHandler = require("../middleware/asyncHandler");

// POST /api/teams
const createTeam = asyncHandler(async (req, res) => {
  const { name, members } = req.body;
  const team = await Team.create({ name, members: members || [] });
  res.status(201).json({ success: true, team });
});

// GET /api/teams
const getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find().populate("members", "name email");
  res.status(200).json({ success: true, teams });
});

// GET /api/teams/:id
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id).populate(
    "members",
    "name email"
  );
  if (!team) throw new ApiError(404, "Team not found");
  res.status(200).json({ success: true, team });
});

// PATCH /api/teams/:id — rename team or replace its member list
const updateTeam = asyncHandler(async (req, res) => {
  const { name, members } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  if (name) team.name = name;
  if (members) team.members = members;
  await team.save();

  // Keep each agent's User.team pointer in sync with the team roster,
  // so ticketController's "agent sees own team's tickets" filter stays correct.
  if (members) {
    await User.updateMany({ team: team._id }, { $set: { team: null } });
    await User.updateMany(
      { _id: { $in: members } },
      { $set: { team: team._id } }
    );
  }

  res.status(200).json({ success: true, team });
});

// DELETE /api/teams/:id
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  await team.deleteOne();
  await User.updateMany({ team: team._id }, { $set: { team: null } });

  res.status(200).json({ success: true, message: "Team deleted" });
});

module.exports = { createTeam, getTeams, getTeamById, updateTeam, deleteTeam };
