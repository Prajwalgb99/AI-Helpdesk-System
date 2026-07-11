# Deskline — IT Helpdesk (MERN)

A minimal, interview-ready core of a helpdesk ticketing system: three roles
(user / agent / admin) on one User model, JWT auth, role-aware ticket
routing, and a clean custom-CSS React frontend.

## Run it

### Backend
```
cd backend
npm install
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET
npm run dev                # nodemon on http://localhost:5000
node seed.js                # creates admin@deskline.com / admin123
```

### Frontend
```
cd frontend
npm install
npm run dev                # http://localhost:5173
```

## How the roles actually work

- Everyone signs up as `role: "user"`. Nobody can self-register as agent/admin.
- Log in as `admin@deskline.com` (from seed.js), go to **Users**, promote
  someone to `agent`, then go to **Teams** and add them to a team.
- A ticket gets an `assignedTeam` when it's created. Agents only see (and can
  only update) tickets whose `assignedTeam` matches their own `team` field.
- `GET /api/tickets` has one handler with an if/else on `req.user.role` —
  that's the single place the "who sees what" rule lives, instead of three
  separate endpoints.

## Where things live

- **middleware/auth.js** — `protect` (verifies JWT, loads `req.user`) and
  `authorize(...roles)` (checks `req.user.role`). Routes compose both:
  `router.patch("/:id", protect, authorize("agent","admin"), updateTicket)`.
- **middleware/asyncHandler.js** + **middleware/errorHandler.js** — this is
  the "no try/catch, no repeated res.status().json()" setup you asked for.
  Controllers just `throw new ApiError(404, "...")` and it's caught and
  formatted in one place (`errorHandler.js`), which is also where Mongoose
  cast/validation/duplicate-key errors get translated into clean JSON.
- **models/User.js** — single collection, `role` enum, `team` ref (only
  meaningful for agents), password hashing in a pre-save hook.

## Notes for the interview

This is intentionally the *core* — no file uploads, no AI classification, no
notifications. Natural next additions if asked "what would you add?":
comments/audit log on a ticket, email notifications on status change, SLA
timers by priority, ticket search/filtering, agent workload balancing.
