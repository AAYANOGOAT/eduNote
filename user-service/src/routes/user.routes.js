const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// GET all users – Admin and Formateur
router.get("/", verifyToken("admin", "formateur"), getAllUsers);

// GET user by ID – Admin and Formateur
router.get("/:id", verifyToken("admin", "formateur"), getUserById);

// POST create user – Admin only
router.post("/", verifyToken("admin"), createUser);

// PUT update user – Admin only
router.put("/:id", verifyToken("admin"), updateUser);

// DELETE user – Admin only
router.delete("/:id", verifyToken("admin"), deleteUser);

module.exports = router;
