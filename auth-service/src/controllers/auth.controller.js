const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * POST /auth/register
 * Public – creates a new user account
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, filiere } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }

    const user = await User.create({ name, email, password, role, filiere });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        filiere: user.filiere,
      },
    });
  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * POST /auth/login
 * Public – validates credentials and returns JWT
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required.",
      });
    }

    // Explicitly select password (it's excluded by default via `select: false`)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        filiere: user.filiere,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /auth/me
 * Authenticated – returns own profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("[getMe]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, getMe };
