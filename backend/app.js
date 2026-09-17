require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const teamRoutes = require("./routes/teams");
const userRoutes = require("./routes/users");
const aiRoutes = require("./routes/ai");
const webhookRoutes = require("./routes/webhooks");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/webhooks", webhookRoutes);

// Catch 404s and pass to errorHandler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
