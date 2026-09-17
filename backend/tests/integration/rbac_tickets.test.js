const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const Team = require("../../models/Team");
const Ticket = require("../../models/Ticket");
const jwt = require("jsonwebtoken");
const { connectTestDB, clearTestDB, closeTestDB } = require("../setup");

describe("Integration Tests: RBAC & Ticket Security (/api/tickets)", () => {
  let user1, user2, agentTeam1, agentTeam2, adminUser;
  let tokenUser1, tokenUser2, tokenAgentTeam1, tokenAgentTeam2, tokenAdmin;
  let team1, team2;

  const createToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  };

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create Teams
    team1 = await Team.create({ name: "Network Team", description: "Handles network issues" });
    team2 = await Team.create({ name: "Hardware Team", description: "Handles hardware issues" });

    // Create Users with distinct roles
    user1 = await User.create({
      name: "Normal User 1",
      email: "user1@example.com",
      password: "Password123!",
      role: "user",
    });
    tokenUser1 = createToken(user1);

    user2 = await User.create({
      name: "Normal User 2",
      email: "user2@example.com",
      password: "Password123!",
      role: "user",
    });
    tokenUser2 = createToken(user2);

    agentTeam1 = await User.create({
      name: "Agent Network",
      email: "agent1@example.com",
      password: "Password123!",
      role: "agent",
      team: team1._id,
    });
    tokenAgentTeam1 = createToken(agentTeam1);

    agentTeam2 = await User.create({
      name: "Agent Hardware",
      email: "agent2@example.com",
      password: "Password123!",
      role: "agent",
      team: team2._id,
    });
    tokenAgentTeam2 = createToken(agentTeam2);

    adminUser = await User.create({
      name: "System Admin",
      email: "admin@example.com",
      password: "Password123!",
      role: "admin",
    });
    tokenAdmin = createToken(adminUser);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("Authentication Guard", () => {
    test("should reject ticket creation without authorization header", async () => {
      const res = await request(app).post("/api/tickets").send({
        title: "Unauthenticated ticket",
        description: "Should be blocked",
      });
      expect(res.status).toBe(401);
    });

    test("should reject ticket list request without authorization header", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
    });
  });

  describe("Ticket Creation & AI Fallback", () => {
    test("user can create ticket and it sets default fallback when external AI is bypassed", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          title: "Cannot access internal wiki",
          description: "Internal wiki times out every time I load the homepage",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.title).toBe("Cannot access internal wiki");
      expect(res.body.ticket.createdBy).toBe(user1._id.toString());
      expect(res.body.ticket.status).toBe("open");
    });
  });

  describe("Data Isolation & Cross-User Privacy", () => {
    let ticketUser1;

    beforeEach(async () => {
      ticketUser1 = await Ticket.create({
        title: "Confidential Payroll Query",
        description: "My salary slip seems incorrect for August",
        createdBy: user1._id,
        category: "billing",
        priority: "medium",
      });
    });

    test("User 1 can fetch their own ticket by ID", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketUser1._id}`)
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.ticket._id.toString()).toBe(ticketUser1._id.toString());
      expect(res.body.ticket.title).toBe("Confidential Payroll Query");
    });

    test("User 2 CANNOT access User 1's ticket (403 Forbidden)", async () => {
      const res = await request(app)
        .get(`/api/tickets/${ticketUser1._id}`)
        .set("Authorization", `Bearer ${tokenUser2}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have access to this ticket/i);
    });

    test("User 2 ticket list only shows User 2's tickets", async () => {
      await Ticket.create({
        title: "User 2 Printer Issue",
        description: "Printer 3F out of paper",
        createdBy: user2._id,
      });

      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${tokenUser2}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets.length).toBe(1);
      expect(res.body.tickets[0].title).toBe("User 2 Printer Issue");
    });
  });

  describe("Agent Team Boundaries & RBAC Permissions", () => {
    let team1Ticket;

    beforeEach(async () => {
      team1Ticket = await Ticket.create({
        title: "Router Switch Flapping",
        description: "Main switch in server room is rebooting",
        createdBy: user1._id,
        assignedTeam: team1._id,
        status: "open",
        priority: "urgent",
      });
    });

    test("Agent from Team 1 CAN update ticket status for Team 1", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${team1Ticket._id}`)
        .set("Authorization", `Bearer ${tokenAgentTeam1}`)
        .send({ status: "in-progress" });

      expect(res.status).toBe(200);
      expect(res.body.ticket.status).toBe("in-progress");
    });

    test("Agent from Team 2 CANNOT update ticket assigned to Team 1 (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${team1Ticket._id}`)
        .set("Authorization", `Bearer ${tokenAgentTeam2}`)
        .send({ status: "resolved" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not assigned to your team/i);
    });

    test("Regular user CANNOT update any ticket status (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/tickets/${team1Ticket._id}`)
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ status: "resolved" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not permitted to perform this action/i);
    });

    test("Agent CANNOT delete a ticket (403 Forbidden)", async () => {
      const res = await request(app)
        .delete(`/api/tickets/${team1Ticket._id}`)
        .set("Authorization", `Bearer ${tokenAgentTeam1}`);

      expect(res.status).toBe(403);
    });
  });

  describe("Admin Full Privileges", () => {
    test("Admin can view all tickets across all users and teams", async () => {
      await Ticket.create([
        { title: "Ticket A", description: "Desc A", createdBy: user1._id, assignedTeam: team1._id },
        { title: "Ticket B", description: "Desc B", createdBy: user2._id, assignedTeam: team2._id },
      ]);

      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets.length).toBe(2);
    });

    test("Admin can delete any ticket", async () => {
      const ticket = await Ticket.create({
        title: "Obsolete ticket",
        description: "To be removed",
        createdBy: user1._id,
      });

      const res = await request(app)
        .delete(`/api/tickets/${ticket._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);

      const check = await Ticket.findById(ticket._id);
      expect(check).toBeNull();
    });
  });
});
