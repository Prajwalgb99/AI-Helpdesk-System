// Tiny presentational component — just maps a status/priority string
// to a CSS class so colors stay consistent everywhere they appear.
export function StatusBadge({ status }) {
  return <span className={`badge badge-status-${status}`}>{status.replace("-", " ")}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge-priority-${priority}`}>{priority}</span>;
}
