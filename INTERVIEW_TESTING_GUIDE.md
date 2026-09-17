# 🎙️ Master Interview Testing Guide — Deskline Helpdesk System

This document contains everything you need to speak about **testing, security, resilience, and performance** in software engineering interviews.

---

## 1. Executive Summary & Talking Points

When an interviewer asks:  
> *"Can you tell me about the testing strategy you implemented for this project?"*

### 💬 Recommended Answer:
> *"For Deskline, I implemented a full **Testing Pyramid** covering Unit, Integration, Resilience, and Concurrency Load testing:*
> 1. *At the **Unit level**, I isolated business-critical algorithms like dynamic SLA breach calculations across priority tiers (`urgent: 2h`, `high: 4h`, etc.) and defensive parsing of non-deterministic LLM JSON outputs.*
> 2. *At the **Integration level**, I used **Jest & Supertest** to validate end-to-end REST routes against a clean test database. Crucially, I wrote automated tests to verify **Role-Based Access Control (RBAC)** — ensuring regular users cannot inspect or modify tickets outside their ownership, agents are locked into their assigned teams, and admins retain full system visibility.*
> 3. *For our **Groq LLM and n8n Webhook integrations**, I built resilience tests. We verified that if third-party AI APIs timeout or return HTTP 429/500 errors, our ticket ingestion pipeline gracefully degrades using fallback categories rather than crashing or dropping customer tickets.*
> 4. *Finally, I created a **Load & Concurrency Benchmark** measuring request throughput and latency distribution (P50, P90, P99) under simulated traffic spikes."*

---

## 2. Test Architecture Breakdown

```
                  ▲
                 / \
                /   \     Load & Concurrency Tests
               /  ⚡  \    (Throughput & P99 Latency Benchmarks)
              /-------\
             /         \   Resilience & Mock Tests
            /    🛡️     \  (Groq API 500/429 Fallback, n8n Webhook Auth)
           /-------------\
          /               \ Integration Tests (Jest + Supertest)
         /       🔗        \ (Auth, RBAC Data Isolation, Route Protection)
        /-------------------\
       /                     \ Unit Tests (Pure Logic)
      /          🧩           \ (SLA Calculations, JSON Schema Validation)
     /-------------------------\
```

---

## 3. High-Frequency Interview Questions & How to Answer

### Q1: *"How do you test features that depend on non-deterministic LLMs (like Groq) without incurring API costs or flakiness in CI/CD?"*
**Key Concepts**: Test isolation, mocking network boundaries, deterministic contract testing.  
**Answer**:
> *"We never hit live LLM endpoints in automated CI/CD pipelines because external APIs introduce latency, non-deterministic completions, and potential rate-limit costs. Instead:*
> - *We mock the HTTP boundary (`fetch` / Groq client) to simulate various LLM responses: valid JSON schemas, malformed text responses, and unexpected categories/priorities.*
> - *We specifically test our **graceful degradation logic**: verifying that when the LLM returns invalid JSON or an unmapped category, the parser defaults safely to `other` and `medium` rather than throwing uncaught exceptions.*
> - *We also simulate HTTP 429 (rate limits) and 500 (API outages) to verify that user ticket creation still succeeds with default triage parameters even when the AI provider is offline."*

---

### Q2: *"How did you test Role-Based Access Control (RBAC) and prevent privilege escalation?"*
**Key Concepts**: BOLA/IDOR vulnerability prevention, multi-tenancy, middleware guards.  
**Answer**:
> *"In multi-tenant or role-based systems, broken object level authorization (IDOR) is a major risk. In `tests/integration/rbac_tickets.test.js`, we specifically test negative authorization test cases:*
> - ***Cross-User Isolation**: We create User 1 and User 2. User 2 explicitly attempts to fetch `GET /api/tickets/:user1TicketId`. We assert that the response is HTTP `403 Forbidden`.*
> - ***Team Boundary Enforcement**: Agents assigned to the 'Network Team' attempt to update ticket status on a ticket routed to the 'Hardware Team'. The test asserts HTTP `403 Forbidden`.*
> - ***Privilege Escalation**: We assert that regular users and agents attempting to call `DELETE /api/tickets/:id` are rejected with HTTP `403`.*
> - *Admins are verified to have full system visibility across all teams and users."*

---

### Q3: *"How do you secure and test webhooks between your backend and automation engines (like n8n)?"*
**Key Concepts**: Service-to-service authentication, secret validation, contract testing.  
**Answer**:
> *"Webhooks are public-facing endpoints and need strict machine-to-machine authentication. We implemented an `x-api-key` header verification middleware.*
> - *In `tests/integration/webhooks.test.js`, we test that missing or incorrect API keys result in immediate HTTP `401 Unauthorized` responses.*
> - *We test idempotency and schema validation: if `ticketId` or `teamName` is missing, the endpoint returns `400 Bad Request`.*
> - *We verify that upon receiving a legitimate signed payload from n8n, the ticket's `assignedTeam` field is atomically updated in MongoDB."*

---

### Q4: *"How did you test dynamic SLA breaches?"*
**Key Concepts**: Time-dependent logic testing, deterministic clock injection.  
**Answer**:
> *"Testing time-dependent SLA breaches without flaky `setTimeout` delays requires passing a reference clock into pure calculation functions. In `backend/utils/sla.js`, `isTicketSlaBreached(ticket, currentTime)` accepts an optional reference date.*
> *This allowed our unit tests (`tests/unit/sla.test.js`) to test exact boundary conditions deterministically:*
> - *An `urgent` ticket created 1.9 hours ago evaluates to `false`.*
> - *An `urgent` ticket created 2.1 hours ago evaluates to `true`.*
> - *Resolved tickets are tested to ensure they never breach the SLA regardless of how many days have elapsed."*

---

## 4. How to Run the Tests Live in an Interview or Demo

### Run Full Automated Test Suite:
```bash
cd backend
npm test
```

### Run Specific Test Suites:
```bash
# Run only SLA unit tests
npx jest tests/unit/sla.test.js

# Run only AI fallback unit tests
npx jest tests/unit/aiFallback.test.js

# Run only RBAC integration tests
npx jest tests/integration/rbac_tickets.test.js

# Run only webhook integration tests
npx jest tests/integration/webhooks.test.js
```

### Run Concurrency / Load Benchmark:
```bash
cd backend
# Starts a benchmark dispatching 150 requests at 15 concurrency
node scripts/loadTest.js
```
