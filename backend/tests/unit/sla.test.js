const { isTicketSlaBreached, SLA_HOURS } = require("../../utils/sla");

describe("Unit Tests: SLA Breach Calculation (isTicketSlaBreached)", () => {
  const now = new Date("2026-09-13T12:00:00.000Z");

  const createTicket = (priority, hoursAgo, status = "open") => {
    const createdAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return {
      title: "Test Ticket",
      status,
      priority,
      createdAt,
    };
  };

  test("should have correct SLA thresholds defined in SLA_HOURS", () => {
    expect(SLA_HOURS.urgent).toBe(2);
    expect(SLA_HOURS.high).toBe(4);
    expect(SLA_HOURS.medium).toBe(24);
    expect(SLA_HOURS.low).toBe(72);
  });

  describe("Urgent Priority (2 Hour Threshold)", () => {
    test("should NOT breach when elapsed time is under 2 hours", () => {
      const ticket = createTicket("urgent", 1.5);
      expect(isTicketSlaBreached(ticket, now)).toBe(false);
    });

    test("should BREACH when elapsed time is over 2 hours", () => {
      const ticket = createTicket("urgent", 2.1);
      expect(isTicketSlaBreached(ticket, now)).toBe(true);
    });
  });

  describe("High Priority (4 Hour Threshold)", () => {
    test("should NOT breach when elapsed time is under 4 hours", () => {
      const ticket = createTicket("high", 3.5);
      expect(isTicketSlaBreached(ticket, now)).toBe(false);
    });

    test("should BREACH when elapsed time is over 4 hours", () => {
      const ticket = createTicket("high", 4.1);
      expect(isTicketSlaBreached(ticket, now)).toBe(true);
    });
  });

  describe("Medium Priority (24 Hour Threshold)", () => {
    test("should NOT breach when elapsed time is under 24 hours", () => {
      const ticket = createTicket("medium", 20);
      expect(isTicketSlaBreached(ticket, now)).toBe(false);
    });

    test("should BREACH when elapsed time is over 24 hours", () => {
      const ticket = createTicket("medium", 25);
      expect(isTicketSlaBreached(ticket, now)).toBe(true);
    });
  });

  describe("Low Priority (72 Hour Threshold)", () => {
    test("should NOT breach when elapsed time is under 72 hours", () => {
      const ticket = createTicket("low", 50);
      expect(isTicketSlaBreached(ticket, now)).toBe(false);
    });

    test("should BREACH when elapsed time is over 72 hours", () => {
      const ticket = createTicket("low", 75);
      expect(isTicketSlaBreached(ticket, now)).toBe(true);
    });
  });

  describe("Resolved Status Immunity", () => {
    test("should NEVER breach if status is 'resolved', even if elapsed time is 100 hours", () => {
      const urgentResolved = createTicket("urgent", 100, "resolved");
      const highResolved = createTicket("high", 100, "resolved");

      expect(isTicketSlaBreached(urgentResolved, now)).toBe(false);
      expect(isTicketSlaBreached(highResolved, now)).toBe(false);
    });
  });

  describe("Defensive Edge Cases", () => {
    test("should handle missing ticket gracefully", () => {
      expect(isTicketSlaBreached(null, now)).toBe(false);
      expect(isTicketSlaBreached(undefined, now)).toBe(false);
    });

    test("should handle invalid date string gracefully", () => {
      const ticket = { status: "open", priority: "urgent", createdAt: "invalid-date" };
      expect(isTicketSlaBreached(ticket, now)).toBe(false);
    });
  });
});
