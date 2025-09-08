const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobileNo:{type:String},
  email: { type: String,},
  otp: { type: String, },
  isVerified: {
    type:Boolean,
    default:false,
  },
  createdAt: { type: Date, default: Date.now, expires: 300 } 
});

module.exports = mongoose.model('Otp', otpSchema);
