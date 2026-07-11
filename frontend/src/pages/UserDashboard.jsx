import { useEffect, useState } from "react";
import api from "../utils/api";
import TicketCard from "../components/TicketCard";

const emptyForm = { title: "", description: "" };

export default function UserDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    const res = await api.get("/tickets");
    setTickets(res.data.tickets);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await api.post("/tickets", form);
    setForm(emptyForm);
    setShowForm(false);
    await loadTickets();
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My tickets</h1>
          <p className="page-subtitle">
            Track requests you've raised and their current status.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="panel ticket-form">
          <label className="field">
            <span>Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Laptop won't connect to VPN"
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What's happening, and what have you already tried?"
            />
          </label>
          <p className="form-hint">
            No need to pick a category or priority — our AI reads your
            description and sets both automatically.
          </p>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit ticket"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="page-loader">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <p>You haven't raised any tickets yet.</p>
          <span>Click "New ticket" to report an issue.</span>
        </div>
      ) : (
        <div className="ticket-grid">
          {tickets.map((t) => (
            <TicketCard key={t._id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
