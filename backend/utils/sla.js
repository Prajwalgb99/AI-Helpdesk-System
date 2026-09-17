/**
 * SLA thresholds in hours by priority
 */
const SLA_HOURS = {
  urgent: 2,
  high: 4,
  medium: 24,
  low: 72,
};

/**
 * Calculates whether a ticket has breached its resolution SLA
 * @param {Object} ticket
 * @param {Date} [currentTime=new Date()] Optional reference date for deterministic testing
 * @returns {boolean}
 */
const isTicketSlaBreached = (ticket, currentTime = new Date()) => {
  if (!ticket || ticket.status === "resolved") {
    return false;
  }

  const createdAt = new Date(ticket.createdAt).getTime();
  if (isNaN(createdAt)) {
    return false;
  }

  const now = currentTime instanceof Date ? currentTime.getTime() : new Date(currentTime).getTime();
  const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

  const threshold = SLA_HOURS[ticket.priority] ?? SLA_HOURS.low;
  return hoursElapsed > threshold;
};

module.exports = {
  SLA_HOURS,
  isTicketSlaBreached,
};
