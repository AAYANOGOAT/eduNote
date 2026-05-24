require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");

const app = express();
const PORT = process.env.PORT || 3002;

// ─── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[user-service] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────
app.use("/users", userRoutes);

// Health check
app.get("/health", (_req, res) =>
  res.json({ service: "user-service", status: "UP" })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found." })
);

// ─── Start ────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`[user-service] Running on port ${PORT}`)
  );
});
