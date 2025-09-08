const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")

const superadminSchema = new mongoose.Schema(
{
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
  email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: { type: String, default: "superadmin" },
  },
  { timestamps: true }
)
superadminSchema.pre("save", async function (next) {
  try {
    if (this.password && this.isModified("password")) {
      const salt = await bcryptjs.genSalt(10)
      this.password = await bcryptjs.hash(this.password, salt)
      next()
    }
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model("SuperAdmin", superadminSchema)
