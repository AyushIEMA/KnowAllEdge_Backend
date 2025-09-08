const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")

const userdetailSchema = new mongoose.Schema(
   {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true, 
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },
    schoolName: {
      type: String,
      trim: true,
    },
    topics: {
      type: [String], 
      default: [],
    },
     profilePic: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/9131/9131529.png",
      },
      is_schoolStudent:{type:Boolean,
        default:false
      }
  },
  { timestamps: true }
  )
  userdetailSchema.pre("save", async function (next) {
  try {
    if (this.password && this.isModified("password")) {
      const salt = await bcryptjs.genSalt(10)
      this.password = await bcryptjs.hash(this.password, salt)
    }next()
  } catch (error) {
    next(error)
  }
})

  module.exports = mongoose.model("userDetail", userdetailSchema)
