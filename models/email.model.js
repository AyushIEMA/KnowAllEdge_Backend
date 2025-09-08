const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    email: 
      {
        type: String,
        required: true,
        lowercase: true,
        match : [/.+@.+\..+/, 'Please enter a valid email address'],
        trim: true,
      },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Email', emailSchema);