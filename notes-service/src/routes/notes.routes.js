const express = require("express");
const router = express.Router();
const {
  addNote,
  getNotesByStagiaire,
  getBulletin,
  updateNote,
  deleteNote,
} = require("../controllers/notes.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// POST – Formateur adds a grade
router.post("/", verifyToken("formateur"), addNote);

// GET – Notes for a specific stagiaire (stagiaire sees own; formateur/admin see all)
router.get("/stagiaire/:id", verifyToken("admin", "formateur", "stagiaire"), getNotesByStagiaire);

// GET – Full bulletin (transcript) for a stagiaire
router.get("/bulletin/:id", verifyToken("admin", "formateur", "stagiaire"), getBulletin);

// PUT – Formateur updates a grade (only their own)
router.put("/:id", verifyToken("formateur"), updateNote);

// DELETE – Admin only
router.delete("/:id", verifyToken("admin"), deleteNote);

module.exports = router;
