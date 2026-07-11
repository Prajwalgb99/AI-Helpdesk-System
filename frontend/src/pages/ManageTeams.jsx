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

  const toggleMember = async (team, userId) => {
    const memberIds = team.members.map((m) => m._id);
    const nextMembers = memberIds.includes(userId)
      ? memberIds.filter((id) => id !== userId)
      : [...memberIds, userId];
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
                {agents.length === 0 && (
                  <span className="empty-hint">No agents yet — promote a user first.</span>
                )}
                {agents.map((agent) => {
                  const active = team.members.some((m) => m._id === agent._id);
                  return (
                    <button
                      key={agent._id}
                      className={`chip ${active ? "chip-active" : ""}`}
                      onClick={() => toggleMember(team, agent._id)}
                    >
                      {agent.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
