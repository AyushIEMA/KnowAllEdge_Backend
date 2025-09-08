const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // unique index
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Pre-save hook: Capitalize first letter, rest lowercase
schoolSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name.trim();
    this.name =
      this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

// ✅ Case-insensitive unique index
schoolSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

module.exports = mongoose.model("School", schoolSchema);
