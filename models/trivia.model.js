const mongoose = require("mongoose");

const subCardSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  subHeading: { type: String },
  content: { type: String, required: true },
  image: { type: String }
});

const triviaSchema = new mongoose.Schema(
  {
    triviaName: { type: String, required: true },
    subCards: {
      type: [subCardSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one subcard is required."
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trivia", triviaSchema);
