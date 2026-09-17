const { classifyTicket, generateSuggestedReply } = require("../../services/groqService");

describe("Unit & Resilience Tests: AI Groq Service (classifyTicket & generateSuggestedReply)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe("classifyTicket", () => {
    test("should correctly parse valid LLM classification JSON", async () => {
      const mockLlmResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "network",
                priority: "high",
                summary: "User cannot connect to company VPN server.",
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLlmResponse,
      });

      const result = await classifyTicket("VPN issue", "Cannot connect to VPN from home");

      expect(result).toEqual({
        category: "network",
        priority: "high",
        summary: "User cannot connect to company VPN server.",
      });
    });

    test("should fallback unknown category to 'other'", async () => {
      const mockLlmResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "cryptocurrency",
                priority: "low",
                summary: "Unknown category issue",
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLlmResponse,
      });

      const result = await classifyTicket("Crypto", "Some crypto question");

      expect(result.category).toBe("other");
      expect(result.priority).toBe("low");
    });

    test("should fallback unknown priority to 'medium'", async () => {
      const mockLlmResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "hardware",
                priority: "super-critical",
                summary: "Monitor display is flickering.",
              }),
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLlmResponse,
      });

      const result = await classifyTicket("Monitor issue", "Screen flickering");

      expect(result.category).toBe("hardware");
      expect(result.priority).toBe("medium");
    });

    test("should throw an error if Groq API responds with non-200 status", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Rate limit reached",
      });

      await expect(
        classifyTicket("Title", "Description")
      ).rejects.toThrow("Groq API responded 429: Rate limit reached");
    });

    test("should throw JSON parsing error if LLM returns malformed text", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Sorry, I cannot answer that as JSON." } }],
        }),
      });

      await expect(
        classifyTicket("Title", "Description")
      ).rejects.toThrow();
    });
  });

  describe("generateSuggestedReply", () => {
    test("should return trimmed suggested reply string from LLM", async () => {
      const mockDraft = "  Hello, we have received your request and are reviewing your VPN configuration.  ";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockDraft } }],
        }),
      });

      const mockTicket = {
        title: "VPN connection failed",
        description: "Timeout when connecting",
        category: "network",
        priority: "high",
        status: "open",
      };

      const reply = await generateSuggestedReply(mockTicket);
      expect(reply).toBe("Hello, we have received your request and are reviewing your VPN configuration.");
    });
  });
});
