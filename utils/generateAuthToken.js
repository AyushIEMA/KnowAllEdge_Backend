const jwt = require("jsonwebtoken")
const maxAge = 60 * 10 * 12000
exports.generateAuthToken = async (id, role, email, name) => {
  return jwt.sign({ id, role, email, name }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  })
}
 