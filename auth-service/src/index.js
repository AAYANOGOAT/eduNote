require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[auth-service] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────
app.use("/auth", authRoutes);

// Health check
app.get("/health", (_req, res) =>
  res.json({ service: "auth-service", status: "UP" })
);

// 404 handler
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found." })
);

// ─── Start ────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`[auth-service] Running on port ${PORT}`)
  );
});
