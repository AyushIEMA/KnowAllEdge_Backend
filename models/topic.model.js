const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Topic", topicSchema);
