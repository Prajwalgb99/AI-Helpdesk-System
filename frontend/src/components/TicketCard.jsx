import { Link } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "./StatusBadge";

export default function TicketCard({ ticket }) {
  return (
    <Link to={`/tickets/${ticket._id}`} className="ticket-card">
      <div className="ticket-card-top">
        <span className="ticket-card-id">
          #{ticket._id.slice(-6).toUpperCase()}
        </span>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <h3 className="ticket-card-title">{ticket.title}</h3>
      <p className="ticket-card-desc">
        {ticket.description}
      </p>
      <div className="ticket-card-bottom">
        <StatusBadge status={ticket.status} />
        <span className="ticket-card-category">{ticket.category}</span>
      </div>
    </Link>
  );
}
