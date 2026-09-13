// Run with: node seed.js
// Add --fresh to wipe existing users/teams/tickets before seeding
// (useful when you've been testing and want a clean slate):
//   node seed.js --fresh
//
// This is idempotent by default — running it twice without --fresh
// just skips anything that already exists (matched by email/title),
// so it's safe to re-run after adding new sample data below.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Team = require("./models/Team");
const Ticket = require("./models/Ticket");

const TEAMS = [
  "Network Team",
  "Hardware Team",
  "Software Team",
  "Access Team",
  "Billing Team",
  "General Support"
];

const AGENTS = [
  { name: "Ravi Kumar", email: "ravi.agent@deskline.com", team: "Network Team" },
  { name: "Ananya Rao", email: "ananya.agent@deskline.com", team: "Hardware Team" },
  { name: "Farhan Sheikh", email: "farhan.agent@deskline.com", team: "Access Team" },
  { name: "Sneha Patel", email: "sneha.agent@deskline.com", team: "Software Team" },
  { name: "Vikram Malhotra", email: "vikram.agent@deskline.com", team: "Billing Team" },
  { name: "Pooja Sharma", email: "pooja.agent@deskline.com", team: "General Support" },
];

const USERS = [
  { name: "Meera Iyer", email: "meera@deskline.com" },
  { name: "Kabir Singh", email: "kabir@deskline.com" },
  { name: "Priya Nair", email: "priya@deskline.com" },
];

// Pre-set category/priority/aiSummary here rather than calling Groq
// during seeding — keeps the seed script fast, offline-friendly, and
// independent of whether GROQ_API_KEY is set. Tickets created through
// the actual app still go through real classification as normal.
const TICKETS = [
  {
    title: "VPN keeps disconnecting every few minutes",
    description:
      "Since this morning my VPN connection drops every 5-10 minutes and I have to manually reconnect. Happens on both wifi and ethernet.",
    category: "network",
    priority: "high",
    status: "open",
    aiSummary: "VPN connection repeatedly drops on all networks since this morning.",
    requester: "meera@deskline.com",
    team: "Network Team",
  },
  {
    title: "Request access to shared Finance drive",
    description:
      "I just joined the finance team and need read/write access to the shared Finance drive on the network share.",
    category: "access",
    priority: "medium",
    status: "in-progress",
    aiSummary: "New finance team member requesting access to shared Finance drive.",
    requester: "kabir@deskline.com",
    team: "Access Team",
  },
  {
    title: "Laptop won't turn on after Windows update",
    description:
      "Installed the latest Windows update last night and now the laptop won't boot past the manufacturer logo. Tried holding power button for 10 seconds, no change.",
    category: "hardware",
    priority: "high",
    status: "open",
    aiSummary: "Laptop stuck at boot logo after a Windows update; power-cycling didn't help.",
    requester: "priya@deskline.com",
    team: "Hardware Team",
  },
  {
    title: "Second monitor not detected",
    description:
      "My second monitor worked fine last week but today it's not being detected at all, even after replugging the HDMI cable.",
    category: "hardware",
    priority: "low",
    status: "resolved",
    aiSummary: "External monitor not detected despite reconnecting the HDMI cable.",
    requester: "meera@deskline.com",
    team: "Hardware Team",
  },
  {
    title: "Can't connect to office wifi from new phone",
    description:
      "Got a new phone this week and it won't connect to the office wifi network — keeps saying authentication failed.",
    category: "network",
    priority: "medium",
    status: "open",
    aiSummary: "New phone fails wifi authentication when joining the office network.",
    requester: "kabir@deskline.com",
    team: "Network Team",
  },
  {
    title: "Locked out of email account",
    description:
      "Entered my password wrong too many times and now my email account is locked. Need it unlocked or reset.",
    category: "access",
    priority: "high",
    status: "in-progress",
    aiSummary: "Email account locked after repeated failed login attempts.",
    requester: "priya@deskline.com",
    team: "Access Team",
  },
  {
    title: "Invoice software showing wrong tax calculation",
    description:
      "The billing tool is calculating GST incorrectly on invoices generated after the last update — off by about 2%.",
    category: "billing",
    priority: "medium",
    status: "open",
    aiSummary: "Billing software miscalculating GST on invoices since the recent update.",
    requester: "kabir@deskline.com",
    team: "Billing Team",
  },
  {
    title: "How do I set up email on my personal phone?",
    description:
      "Just want step-by-step instructions for adding my work email to the mail app on my personal Android phone.",
    category: "software",
    priority: "low",
    status: "resolved",
    aiSummary: "Requesting setup instructions for work email on a personal Android phone.",
    requester: "meera@deskline.com",
    team: "Software Team",
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  if (process.argv.includes("--fresh")) {
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Ticket.deleteMany({}),
    ]);
    console.log("--fresh: cleared existing users, teams, and tickets");
  }

  // 1. Admin — the only account not created through the signup form
  let admin = await User.findOne({ email: "admin@deskline.com" });
  if (!admin) {
    admin = await User.create({
      name: "Admin",
      email: "admin@deskline.com",
      password: "admin123",
      role: "admin",
    });
    console.log("Created admin: admin@deskline.com / admin123");
  }

  // 2. Teams
  const teamsByName = {};
  for (const name of TEAMS) {
    let team = await Team.findOne({ name });
    if (!team) {
      team = await Team.create({ name, members: [] });
      console.log(`Created team: ${name}`);
    }
    teamsByName[name] = team;
  }

  // 3. Agents — created with role "agent" directly and linked to their
  // team (normally this happens via the admin promoting a user + adding
  // them to a team through the UI, but for seed data we can do it in one step)
  for (const a of AGENTS) {
    let agent = await User.findOne({ email: a.email });
    if (!agent) {
      agent = await User.create({
        name: a.name,
        email: a.email,
        password: "agent123",
        role: "agent",
        team: teamsByName[a.team]._id,
      });
      console.log(`Created agent: ${a.email} / agent123 (${a.team})`);
    }
    const team = teamsByName[a.team];
    if (!team.members.some((m) => m.toString() === agent._id.toString())) {
      team.members.push(agent._id);
      await team.save();
    }
  }

  // 4. Regular users
  const usersByEmail = {};
  for (const u of USERS) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({
        name: u.name,
        email: u.email,
        password: "user123",
        role: "user",
      });
      console.log(`Created user: ${u.email} / user123`);
    }
    usersByEmail[u.email] = user;
  }

  // 5. Sample tickets, spread across statuses/categories/priorities/teams
  for (const t of TICKETS) {
    const exists = await Ticket.findOne({ title: t.title });
    if (exists) continue;

    await Ticket.create({
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      aiSummary: t.aiSummary,
      createdBy: usersByEmail[t.requester]._id,
      assignedTeam: teamsByName[t.team]._id,
    });
  }
  console.log(`Seeded ${TICKETS.length} sample tickets (skipping any that already existed)`);

  console.log("\nSeed complete. Login with any of:");
  console.log("  admin@deskline.com         / admin123   (admin)");
  console.log("  ravi.agent@deskline.com     / agent123  (agent — Network Team)");
  console.log("  ananya.agent@deskline.com   / agent123  (agent — Hardware Team)");
  console.log("  farhan.agent@deskline.com   / agent123  (agent — Access Team)");
  console.log("  sneha.agent@deskline.com    / agent123  (agent — Software Team)");
  console.log("  vikram.agent@deskline.com   / agent123  (agent — Billing Team)");
  console.log("  pooja.agent@deskline.com    / agent123  (agent — General Support)");
  console.log("  meera@deskline.com         / user123    (user)");
  console.log("  kabir@deskline.com         / user123    (user)");
  console.log("  priya@deskline.com         / user123    (user)");

  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
