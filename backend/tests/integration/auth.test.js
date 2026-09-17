const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const { connectTestDB, clearTestDB, closeTestDB } = require("../setup");

describe("Integration Tests: Auth & Session Management (/api/auth)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("POST /api/auth/signup", () => {
    test("should register a new user successfully and return JWT", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Alice Developer",
          email: "alice@example.com",
          password: "SecurePassword123!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        name: "Alice Developer",
        email: "alice@example.com",
        role: "user",
      });

      // Verify user was stored in MongoDB with hashed password
      const savedUser = await User.findOne({ email: "alice@example.com" }).select("+password");
      expect(savedUser).toBeDefined();
      expect(savedUser.password).not.toBe("SecurePassword123!");
    });

    test("should reject registration with duplicate email", async () => {
      await User.create({
        name: "Bob Existing",
        email: "bob@example.com",
        password: "Password123!",
      });

      const res = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Bob Duplicate",
          email: "bob@example.com",
          password: "AnotherPassword123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        name: "Charlie Tester",
        email: "charlie@example.com",
        password: "MySecretPassword123",
      });
    });

    test("should log in with valid credentials and return JWT", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "charlie@example.com",
          password: "MySecretPassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("charlie@example.com");
    });

    test("should reject login with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "charlie@example.com",
          password: "WrongPassword999",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    test("should reject login with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "SomePassword123",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    test("should reject login when fields are missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "charlie@example.com" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    test("should return user profile when authenticated with valid token", async () => {
      const user = await User.create({
        name: "Dana Admin",
        email: "dana@example.com",
        password: "AdminPassword123",
        role: "admin",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "dana@example.com", password: "AdminPassword123" });

      const token = loginRes.body.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("dana@example.com");
      expect(res.body.user.role).toBe("admin");
    });

    test("should reject request when token is missing", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/no token provided/i);
    });
  });
});
