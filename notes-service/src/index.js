require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const notesRoutes = require("./routes/notes.routes");
const { initRabbitMQ } = require("./rabbitmq/publisher");

const app = express();
const PORT = process.env.PORT || 3003;

// ─── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[notes-service] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────
app.use("/notes", notesRoutes);

// Health check
app.get("/health", (_req, res) =>
  res.json({ service: "notes-service", status: "UP" })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found." })
);

// ─── Start ────────────────────────────────────────────
connectDB().then(async () => {
  // Connect to RabbitMQ after DB is ready
  await initRabbitMQ();
  app.listen(PORT, () =>
    console.log(`[notes-service] Running on port ${PORT}`)
  );
});
