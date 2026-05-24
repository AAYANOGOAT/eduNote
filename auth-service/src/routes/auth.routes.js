const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route – any authenticated user
router.get("/me", verifyToken(), getMe);

module.exports = router;
