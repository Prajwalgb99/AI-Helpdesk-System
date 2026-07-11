import { useEffect, useState } from "react";
import api from "../utils/api";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tickets").then((res) => {
      setTickets(res.data.tickets);
      setLoading(false);
    });
  }, []);

  const counts = tickets.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }),
    {}
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>All tickets</h1>
          <p className="page-subtitle">
            Every ticket across every team, organization-wide.
          </p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-number">{tickets.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{counts.open || 0}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{counts["in-progress"] || 0}</span>
          <span className="stat-label">In progress</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{counts.resolved || 0}</span>
          <span className="stat-label">Resolved</span>
        </div>
      </div>

      {loading ? (
        <div className="page-loader">Loading tickets…</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Requester</th>
              <th>Team</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t._id}>
                <td>
                  <div className="table-title">{t.title}</div>
                  <div className="table-id">
                    #{t._id.slice(-6).toUpperCase()} · {t.category}
                  </div>
                </td>
                <td>{t.createdBy?.name}</td>
                <td>{t.assignedTeam?.name || "Unassigned"}</td>
                <td>
                  <PriorityBadge priority={t.priority} />
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
