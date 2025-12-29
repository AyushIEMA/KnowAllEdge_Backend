const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "userDetail", required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  quizId: { type: String, required: true },

  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },

  // 🔥 NEW
  isPlayed: { type: Boolean, default: true },

  playedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Score", scoreSchema);
