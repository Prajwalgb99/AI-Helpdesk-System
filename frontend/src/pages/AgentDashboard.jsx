import { useEffect, useState } from "react";
import api from "../utils/api";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadTickets = async () => {
    setLoading(true);
    const res = await api.get("/tickets");
    setTickets(res.data.tickets);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/tickets/${id}`, { status });
    setTickets((prev) =>
      prev.map((t) => (t._id === id ? { ...t, status } : t))
    );
  };

  const visible =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Team queue</h1>
          <p className="page-subtitle">
            Tickets routed to your team. Update status as you work through them.
          </p>
        </div>
        <div className="filter-tabs">
          {["all", "open", "in-progress", "resolved"].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loader">Loading tickets…</div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p>Nothing here.</p>
          <span>No tickets match this filter right now.</span>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Requester</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t._id}>
                <td>
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
                </td>
                <td>{t.createdBy?.name}</td>
                <td>
                  <PriorityBadge priority={t.priority} />
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t._id, e.target.value)}
                    className="table-select"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
