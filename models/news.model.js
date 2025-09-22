const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
    },
    subHeading: {
      type: String,
    },
    smallContent: {
      type: String,
      required: true,
    },
     largeContent: {
      type: String,
      required: true,
    },
     images: [
      {
        type: String, // S3 URL
      },
    ],
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    topics: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "You can select a maximum of 5 topics.",
      },
    },
    contentFor: {
      type: String,
      enum: ["For School", "For Others"],
      required: true,
    },
    date: {
      type:String,
      require:true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);


