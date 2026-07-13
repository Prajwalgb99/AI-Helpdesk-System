import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const exportToCSV = () => {
    if (tickets.length === 0) return;
    const headers = [
      "ID",
      "Title",
      "Requester",
      "Team",
      "Priority",
      "Status",
      "Category",
      "SLA Breached",
      "Created At",
    ];
    const rows = tickets.map((t) => [
      t._id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.createdBy?.name || "Unknown",
      t.assignedTeam?.name || "Unassigned",
      t.priority,
      t.status,
      t.category,
      t.isSlaBreached ? "Yes" : "No",
      new Date(t.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tickets_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>All tickets</h1>
          <p className="page-subtitle">
            Every ticket across every team, organization-wide.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={exportToCSV}>
          Export to CSV
        </button>
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
                  <Link to={`/tickets/${t._id}`} className="table-link">
                    <div className="table-title">
                      {t.title}
                      {t.isSlaBreached && (
                        <span className="sla-badge" style={{ marginLeft: "8px", backgroundColor: "#ffebeb", color: "#d93838", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", border: "1px solid #fad2d2" }}>
                          SLA Breached
                        </span>
                      )}
                    </div>
                    <div className="table-id">
                      #{t._id.slice(-6).toUpperCase()} · {t.category}
                    </div>
                  </Link>
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
