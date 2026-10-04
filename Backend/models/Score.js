const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    playerName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    playTime: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      default: "Classical Snake",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Score", scoreSchema);
