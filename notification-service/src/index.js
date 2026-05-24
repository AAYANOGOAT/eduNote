require("dotenv").config();
const express = require("express");
const { startConsumer } = require("./rabbitmq/consumer");

const app = express();
const PORT = process.env.PORT || 3004;

// ─── Health check endpoint ─────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ service: "notification-service", status: "UP" })
);

// ─── Start ─────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[notification-service] Running on port ${PORT}`);
  await startConsumer();
});
