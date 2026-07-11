import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await api.get(`/tickets/${id}`);
    setTicket(res.data.ticket);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (status) => {
    await api.patch(`/tickets/${id}`, { status });
    load();
  };

  const requestSuggestedReply = async () => {
    setGenerating(true);
    setAiError("");
    try {
      const res = await api.post(`/ai/tickets/${id}/suggest-reply`);
      setDraft(res.data.draft);
    } catch (err) {
      setAiError(
        err.response?.data?.message || "Couldn't generate a suggestion right now."
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="page-loader">Loading ticket…</div>;
  if (!ticket) return <div className="page">Ticket not found.</div>;

  const canManage = user.role === "agent" || user.role === "admin";

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back to tickets
      </Link>

      <div className="panel ticket-detail">
        <div className="ticket-detail-header">
          <div>
            <span className="table-id">
              #{ticket._id.slice(-6).toUpperCase()}
            </span>
            <h1>{ticket.title}</h1>
          </div>
          <div className="ticket-detail-badges">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <p className="ticket-detail-desc">{ticket.description}</p>

        {ticket.aiSummary && (
          <div className="ai-summary">
            <span className="ai-summary-label">AI summary</span>
            <span>{ticket.aiSummary}</span>
          </div>
        )}

        <div className="ticket-detail-meta">
          <div>
            <span className="meta-label">Requested by</span>
            <span>{ticket.createdBy?.name}</span>
          </div>
          <div>
            <span className="meta-label">Category</span>
            <span className="capitalize">{ticket.category}</span>
          </div>
          <div>
            <span className="meta-label">Team</span>
            <span>{ticket.assignedTeam?.name || "Unassigned"}</span>
          </div>
          <div>
            <span className="meta-label">Created</span>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {canManage && (
          <div className="ticket-detail-actions">
            <span className="meta-label">Update status</span>
            <div className="button-row">
              {["open", "in-progress", "resolved"].map((s) => (
                <button
                  key={s}
                  className={`btn ${ticket.status === s ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => updateStatus(s)}
                >
                  {s.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {canManage && (
          <div className="ticket-detail-actions">
            <div className="suggested-reply-header">
              <span className="meta-label">Suggested reply</span>
              <button
                className="btn btn-ghost btn-small"
                onClick={requestSuggestedReply}
                disabled={generating}
              >
                {generating
                  ? "Generating…"
                  : draft
                  ? "Regenerate"
                  : "Generate with AI"}
              </button>
            </div>

            {aiError && <div className="alert alert-error">{aiError}</div>}

            {draft && (
              <>
                <textarea
                  className="suggested-reply-box"
                  rows={5}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <p className="form-hint">
                  This is a draft only — edit it before sending it to the
                  user through your usual reply channel.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
