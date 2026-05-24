const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    stagiaireId: {
      type: String, // References user ID from user-service/auth-service
      required: [true, "stagiaireId is required"],
      index: true,
    },
    stagiaireName: {
      type: String,
      default: "",
    },
    formateurId: {
      type: String, // References user ID from JWT payload
      required: [true, "formateurId is required"],
    },
    formateurName: {
      type: String,
      default: "",
    },
    module: {
      type: String,
      required: [true, "module is required"],
      trim: true,
    },
    note: {
      type: Number,
      required: [true, "note is required"],
      min: [0, "Note cannot be less than 0"],
      max: [20, "Note cannot exceed 20"],
    },
    commentaire: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index for quick lookup by stagiaire + module
noteSchema.index({ stagiaireId: 1, module: 1 });

module.exports = mongoose.model("Note", noteSchema);
