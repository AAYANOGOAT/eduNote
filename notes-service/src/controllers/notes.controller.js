const Note = require("../models/note.model");
const { publishNoteAdded } = require("../rabbitmq/publisher");

/**
 * POST /notes
 * Formateur only – add a grade for a stagiaire
 */
const addNote = async (req, res) => {
  try {
    const { stagiaireId, stagiaireName, module, note, commentaire } = req.body;

    if (!stagiaireId || !module || note === undefined) {
      return res.status(400).json({
        success: false,
        message: "stagiaireId, module, and note are required.",
      });
    }

    const newNote = await Note.create({
      stagiaireId,
      stagiaireName: stagiaireName || "",
      formateurId: req.user.id,
      formateurName: req.user.name || "",
      module,
      note,
      commentaire: commentaire || "",
    });

    // Publish RabbitMQ event asynchronously (non-blocking)
    publishNoteAdded({
      noteId: newNote._id,
      stagiaireId: newNote.stagiaireId,
      stagiaireName: newNote.stagiaireName,
      module: newNote.module,
      note: newNote.note,
      formateurId: newNote.formateurId,
      formateurName: newNote.formateurName,
    }).catch((err) =>
      console.error("[addNote] RabbitMQ publish error:", err.message)
    );

    return res.status(201).json({
      success: true,
      message: "Note added successfully.",
      data: newNote,
    });
  } catch (err) {
    console.error("[addNote]", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /notes/stagiaire/:id
 * Authenticated – stagiaire can only read own; formateur/admin can read any
 */
const getNotesByStagiaire = async (req, res) => {
  try {
    const { id } = req.params;

    // A stagiaire can only view their own notes
    if (req.user.role === "stagiaire" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own notes.",
      });
    }

    const { module: moduleFilter } = req.query;
    const filter = { stagiaireId: id };
    if (moduleFilter) filter.module = moduleFilter;

    const notes = await Note.find(filter).sort({ module: 1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });
  } catch (err) {
    console.error("[getNotesByStagiaire]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * GET /notes/bulletin/:id
 * Authenticated – full transcript with module averages and overall average.
 * Stagiaire can only view own bulletin.
 */
const getBulletin = async (req, res) => {
  try {
    const { id } = req.params;

    // Stagiaire can only view their own bulletin
    if (req.user.role === "stagiaire" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own bulletin.",
      });
    }

    const notes = await Note.find({ stagiaireId: id }).sort({ module: 1 });

    if (notes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No grades found for this stagiaire.",
        data: { stagiaireId: id, modules: [], overallAverage: null },
      });
    }

    // Group notes by module and compute averages
    const moduleMap = {};
    for (const n of notes) {
      if (!moduleMap[n.module]) {
        moduleMap[n.module] = { module: n.module, notes: [], average: 0 };
      }
      moduleMap[n.module].notes.push({
        id: n._id,
        note: n.note,
        commentaire: n.commentaire,
        formateurName: n.formateurName,
        date: n.createdAt,
      });
    }

    const modules = Object.values(moduleMap).map((m) => {
      const sum = m.notes.reduce((acc, n) => acc + n.note, 0);
      m.average = parseFloat((sum / m.notes.length).toFixed(2));
      return m;
    });

    // Overall average (mean of module averages)
    const overallSum = modules.reduce((acc, m) => acc + m.average, 0);
    const overallAverage = parseFloat((overallSum / modules.length).toFixed(2));

    // Mention
    let mention = "";
    if (overallAverage >= 16) mention = "Très Bien";
    else if (overallAverage >= 14) mention = "Bien";
    else if (overallAverage >= 12) mention = "Assez Bien";
    else if (overallAverage >= 10) mention = "Passable";
    else mention = "Insuffisant";

    return res.status(200).json({
      success: true,
      data: {
        stagiaireId: id,
        stagiaireName: notes[0].stagiaireName || "",
        modules,
        overallAverage,
        mention,
        totalNotes: notes.length,
      },
    });
  } catch (err) {
    console.error("[getBulletin]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * PUT /notes/:id
 * Formateur only – update a grade
 */
const updateNote = async (req, res) => {
  try {
    const { note, commentaire } = req.body;
    const existing = await Note.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    // Formateur can only update notes they created
    if (
      req.user.role === "formateur" &&
      existing.formateurId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update grades you entered.",
      });
    }

    if (note !== undefined) existing.note = note;
    if (commentaire !== undefined) existing.commentaire = commentaire;

    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Note updated.",
      data: existing,
    });
  } catch (err) {
    console.error("[updateNote]", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * DELETE /notes/:id
 * Admin only – delete a grade
 */
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }
    return res.status(200).json({
      success: true,
      message: "Note deleted successfully.",
    });
  } catch (err) {
    console.error("[deleteNote]", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { addNote, getNotesByStagiaire, getBulletin, updateNote, deleteNote };
