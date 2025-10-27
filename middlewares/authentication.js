const jwt = require("jsonwebtoken");
const User = require('../models/user.model'); 
const Superadmin=require('../models/superAdmin.model')
 const {sendSuccess,
  sendError,
  sendServerError,
  sendUnauthorized,}=require('../utils/response')

//user checker
module.exports.userChecker = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return sendUnauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "user") {
      return sendUnauthorized(res, "Access denied. User only.");
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return sendUnauthorized(res);

    req.user = user;
    req.role = decoded.role;
    next();
  } catch (error) {
    console.error(error);
    return sendUnauthorized(res);
  }
};

//superAdmin Checker
module.exports.superadminChecker = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return sendUnauthorized(res);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "superadmin") {
      return sendUnauthorized(res, "Access denied. Superadmin only.");
    }

    const superadmin = await Superadmin.findById(decoded.id).select("-password");
    if (!superadmin) return sendUnauthorized(res);

    req.user = superadmin;
    req.role = decoded.role;
    next();
  } catch (err) {
    console.error(err);
    return sendUnauthorized(res);
  }
};