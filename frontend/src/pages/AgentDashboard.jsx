import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import SearchFilterBar from "../components/SearchFilterBar";

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);

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

  const visible = tickets.filter((t) => {
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = t.title.toLowerCase().includes(query);
    const descMatch = t.description ? t.description.toLowerCase().includes(query) : false;
    const requesterMatch = t.createdBy?.name ? t.createdBy.name.toLowerCase().includes(query) : false;
    const idMatch = t._id.slice(-6).toLowerCase().includes(query);
    const searchMatch = !query || titleMatch || descMatch || requesterMatch || idMatch;

    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(t.status);
    const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(t.priority);

    return searchMatch && statusMatch && priorityMatch;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Team queue</h1>
          <p className="page-subtitle">
            Tickets routed to your team. Update status as you work through them.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="page-loader">Loading tickets…</div>
      ) : (
        <>
          <SearchFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            selectedPriorities={selectedPriorities}
            setSelectedPriorities={setSelectedPriorities}
          />
          {visible.length === 0 ? (
            <div className="empty-state" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "48px 24px" }}>
              <p>No matches found</p>
              <span>Try adjusting your search query or filter tags.</span>
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
      </>
      )}
    </div>
  );
}
