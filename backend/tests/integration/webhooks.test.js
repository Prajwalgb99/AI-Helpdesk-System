const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const Team = require("../../models/Team");
const Ticket = require("../../models/Ticket");
const { connectTestDB, clearTestDB, closeTestDB } = require("../setup");

describe("Integration Tests: n8n Webhook & Service-to-Service Security (/api/webhooks)", () => {
  let user, networkTeam, ticket;
  const VALID_API_KEY = process.env.N8N_API_KEY || "n8n_sec_3fb2a912";

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    user = await User.create({
      name: "Dave User",
      email: "dave@example.com",
      password: "Password123!",
    });

    networkTeam = await Team.create({
      name: "Network Team",
      description: "Handles networking and connectivity",
    });

    ticket = await Ticket.create({
      title: "VPN connection dropping continuously",
      description: "Keeps disconnecting every 5 minutes",
      createdBy: user._id,
      category: "network",
      priority: "high",
    });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("API Key Authentication", () => {
    test("should reject request when x-api-key header is missing", async () => {
      const res = await request(app)
        .post("/api/webhooks/n8n/assign-team")
        .send({
          ticketId: ticket._id,
          teamName: "Network Team",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid or missing api key/i);
    });

    test("should reject request when x-api-key is invalid", async () => {
      const res = await request(app)
        .post("/api/webhooks/n8n/assign-team")
        .set("x-api-key", "wrong-secret-key")
        .send({
          ticketId: ticket._id,
          teamName: "Network Team",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid or missing api key/i);
    });
  });

  describe("Payload Validation & Team Assignment", () => {
    test("should successfully assign team to ticket with valid API key", async () => {
      const res = await request(app)
        .post("/api/webhooks/n8n/assign-team")
        .set("x-api-key", VALID_API_KEY)
        .send({
          ticketId: ticket._id,
          teamName: "Network Team",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Network Team");

      const updated = await Ticket.findById(ticket._id);
      expect(updated.assignedTeam.toString()).toBe(networkTeam._id.toString());
    });

    test("should return 400 if ticketId or teamName is missing in request body", async () => {
      const res = await request(app)
        .post("/api/webhooks/n8n/assign-team")
        .set("x-api-key", VALID_API_KEY)
        .send({ ticketId: ticket._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/provide ticketId and teamName/i);
    });

    test("should return 404 if ticketId does not exist", async () => {
      const nonExistentId = new User()._id;
      const res = await request(app)
        .post("/api/webhooks/n8n/assign-team")
        .set("x-api-key", VALID_API_KEY)
        .send({
          ticketId: nonExistentId,
          teamName: "Network Team",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/ticket not found/i);
    });

    test("should return 404 if teamName does not exist in database", async () => {
      const res = await request(app)
        .post("/api/webhooks/n8n/assign-team")
        .set("x-api-key", VALID_API_KEY)
        .send({
          ticketId: ticket._id,
          teamName: "NonExistent Ghost Team",
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/team not found/i);
    });
  });
});
