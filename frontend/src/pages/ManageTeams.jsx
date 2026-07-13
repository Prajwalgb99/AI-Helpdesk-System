import { useEffect, useState } from "react";
import api from "../utils/api";
import { useConfirm } from "../context/ConfirmContext";

export default function ManageTeams() {
  const confirm = useConfirm();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [teamsRes, usersRes] = await Promise.all([
      api.get("/teams"),
      api.get("/users"),
    ]);
    setTeams(teamsRes.data.teams);
    setUsers(usersRes.data.users);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await api.post("/teams", { name: newTeamName });
    setNewTeamName("");
    loadAll();
  };

  const addMemberConfirm = async (team, userId) => {
    if (!userId) return;
    const agent = agents.find((u) => u._id === userId);
    if (!agent) return;

    const message = agent.team
      ? `Are you sure you want to transfer "${agent.name}" from "${agent.team.name}" to the "${team.name}" team?`
      : `Are you sure you want to add "${agent.name}" to the "${team.name}" team?`;

    const ok = await confirm(message, {
      confirmText: "Confirm",
      confirmClass: "btn-primary",
    });
    if (!ok) return;

    const memberIds = team.members.map((m) => m._id);
    await api.patch(`/teams/${team._id}`, { members: [...memberIds, userId] });
    loadAll();
  };

  const removeMemberConfirm = async (team, member) => {
    const ok = await confirm(
      `Are you sure you want to remove "${member.name}" from the "${team.name}" team?`,
      {
        confirmText: "Remove",
        confirmClass: "btn-danger",
      }
    );
    if (!ok) return;

    const memberIds = team.members.map((m) => m._id);
    const nextMembers = memberIds.filter((id) => id !== member._id);
    await api.patch(`/teams/${team._id}`, { members: nextMembers });
    loadAll();
  };

  const deleteTeam = async (id, name) => {
    const ok = await confirm(
      `This will delete "${name}" and unassign any agents from it. This can't be undone.`
    );
    if (!ok) return;
    await api.delete(`/teams/${id}`);
    loadAll();
  };

  const agents = users.filter((u) => u.role === "agent");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Teams</h1>
          <p className="page-subtitle">
            Create teams and assign agents to route tickets correctly.
          </p>
        </div>
      </div>

      <form onSubmit={createTeam} className="panel inline-form">
        <input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="New team name, e.g. Networking"
        />
        <button className="btn btn-primary">Create team</button>
      </form>

      {loading ? (
        <div className="page-loader">Loading teams…</div>
      ) : (
        <div className="team-grid">
          {teams.map((team) => (
            <div key={team._id} className="panel team-card">
              <div className="team-card-header">
                <h3>{team.name}</h3>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => deleteTeam(team._id, team.name)}
                >
                  Delete
                </button>
              </div>
              <p className="team-card-sub">
                {team.members.length} agent{team.members.length !== 1 && "s"}
              </p>
              <div className="agent-chip-list">
                {team.members.length === 0 && (
                  <span className="empty-hint">No agents in this team yet.</span>
                )}
                {team.members.map((member) => (
                  <button
                    key={member._id}
                    className="chip chip-active"
                    onClick={() => removeMemberConfirm(team, member)}
                    title="Click to remove agent"
                  >
                    {member.name} &times;
                  </button>
                ))}
              </div>
              {(() => {
                const availableAgents = agents.filter(
                  (agent) => !team.members.some((m) => m._id === agent._id)
                );
                return (
                  availableAgents.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <select
                        value=""
                        onChange={(e) => addMemberConfirm(team, e.target.value)}
                        className="table-select"
                        style={{ width: "100%", padding: "8px 10px" }}
                      >
                        <option value="" disabled>+ Add Agent to Team...</option>
                        {availableAgents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name}
                            {agent.team ? ` (in ${agent.team.name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
