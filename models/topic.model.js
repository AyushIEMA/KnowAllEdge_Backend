const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    topics: [
      {
        name: { type: String, trim: true, required: true },
        image: { type: String, trim: true }, // S3 image URL
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Topic", topicSchema);

