// All Groq API interaction lives in this one file, on purpose — no
// framework, no agent loop, just two plain fetch calls with prompts
// you can read top to bottom. Requires Node 18+ (global fetch).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const VALID_CATEGORIES = [
  "hardware",
  "software",
  "network",
  "access",
  "billing",
  "other",
];
const VALID_PRIORITIES = ["low", "medium", "high"];

/**
 * Thin wrapper around the Groq chat completions endpoint.
 * Throws on any non-2xx response or network failure — callers decide
 * how to handle that (see ticketController for the "fall back to
 * defaults" pattern, and aiController for the "surface an error" pattern).
 */
async function callGroq(messages, { temperature = 0.2, maxTokens = 300 } = {}) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq API responded ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* ==========================================================================
   1. CLASSIFICATION PROMPT
   Why structured this way:
   - System message pins down the exact output contract (valid category
     list, valid priority list, JSON-only) so we don't have to parse
     free-form text.
   - temperature is low (0.2) because this is a classification task,
     not a creative one — we want consistent, repeatable output for the
     same input.
   - The user message is just the raw ticket content, unmodified, so
     there's nothing hidden between what the user typed and what the
     model sees.
========================================================================== */
const CLASSIFY_SYSTEM_PROMPT = `You are a triage assistant for an internal IT helpdesk.
Given a ticket's title and description, classify it and respond with ONLY a JSON object — no markdown fences, no explanation, no extra text.

The JSON object must have exactly these keys:
{
  "category": one of "hardware", "software", "network", "access", "billing", "other",
  "priority": one of "low", "medium", "high",
  "summary": a single sentence under 20 words summarizing the issue
}

Guidance for priority:
- "high": the person cannot work at all (system down, no access, security issue)
- "medium": a real problem but there's a workaround or it's not blocking all work
- "low": a minor issue, question, or cosmetic request

Respond with the JSON object only.`;

async function classifyTicket(title, description) {
  const userPrompt = `Ticket title: ${title}\nTicket description: ${description}`;

  const raw = await callGroq([
    { role: "system", content: CLASSIFY_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const parsed = JSON.parse(raw); // if the model didn't return valid JSON, this throws and the caller falls back to defaults

  return {
    category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : "other",
    priority: VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority : "medium",
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : "",
  };
}

/* ==========================================================================
   2. SUGGESTED REPLY PROMPT
   Why structured this way:
   - Slightly higher temperature (0.4) than classification — this is
     writing assistance, so a bit of natural variation in phrasing is
     fine and even desirable.
   - System message explicitly tells the model this is a DRAFT for a
     human agent to edit, not an auto-send message — reinforced again
     in the calling code, which never sends this text anywhere on its
     own (see aiController.suggestReply).
   - We pass in ticket status/category/priority as context so the draft
     can reference where things stand (e.g. "we've marked this high
     priority and it's currently in progress").
========================================================================== */
const REPLY_SYSTEM_PROMPT = `You are helping an IT support agent draft a reply to a user's helpdesk ticket.
Write a short, professional, friendly draft reply (3-5 sentences) that:
- Acknowledges the specific issue described
- Reflects the ticket's current status and priority naturally
- Suggests a concrete next step or asks one clarifying question if needed
- Does NOT promise a specific resolution time unless the ticket priority is "high"

This is a DRAFT ONLY — a human agent will review and edit it before sending, so do not include a signature, greeting placeholder like "[Name]", or any closing that assumes it's final. Return plain text only, no markdown.`;

async function generateSuggestedReply(ticket) {
  const userPrompt = `Ticket title: ${ticket.title}
Description: ${ticket.description}
Category: ${ticket.category}
Priority: ${ticket.priority}
Current status: ${ticket.status}`;

  const draft = await callGroq(
    [
      { role: "system", content: REPLY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.4, maxTokens: 220 }
  );

  return draft.trim();
}

module.exports = { classifyTicket, generateSuggestedReply };
