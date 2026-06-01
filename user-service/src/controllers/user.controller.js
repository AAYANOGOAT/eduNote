const User = require("../models/user.model");

/**
 * GET /users
 * Admin, Formateur – list all users (passwords excluded)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, filiere } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (filiere) filter.filiere = filiere;

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error("[getAllUsers]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /users/:id
 * Admin, Formateur – get single user
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("[getUserById]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * POST /users
 * Admin – create a new user account
 */
const createUser = async (req, res) => {
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

    const userPayload = { name, email, password, role, filiere };
    if (req.body._id) userPayload._id = req.body._id;
    
    const user = await User.create(userPayload);

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        filiere: user.filiere,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("[createUser]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * PUT /users/:id
 * Admin – update user (name, role, filiere, isActive)
 */
const updateUser = async (req, res) => {
  try {
    const { name, role, filiere, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (filiere !== undefined) user.filiere = filiere;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated.",
      data: user,
    });
  } catch (err) {
    console.error("[updateUser]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * DELETE /users/:id
 * Admin – delete user
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error("[deleteUser]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
