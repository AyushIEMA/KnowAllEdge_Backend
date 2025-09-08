const SuperAdminModel = require("../models/superAdmin.model");
const User=require('../models/user.model')
const Topic=require('../models/topic.model')
const {constants}=require("../constant")
const {generateAuthToken}=require("../utils/generateAuthToken")
const bcryptjs = require("bcryptjs");
const {
  sendSuccess,
  sendError,
  sendServerError,
} = require("../utils/response");

//signup
exports.superAdminPostSignup = async (req, res) => {
  try {
    const {name ,email, password } = req.body;
    if (!name ||!email || !password ) {
      throw new Error("All the fields are required !!!!");
    }
    let superAdmin = await SuperAdminModel.findOne({
      $or: [{ email: email }],
    });
    if (superAdmin) {
      return sendError(
        res,
        constants.CONFLICT,
        "Oops!! Super Admin already exists with this email.."
      );
    }
    superAdmin = new SuperAdminModel({
      name,
      email,
      password,
     
    });
    await superAdmin.save();
    const token = await generateAuthToken(
      superAdmin._id,
      "superadmin",
      superAdmin.email
    );
    return sendSuccess(
      res,
      constants.CREATED,
      "Super Admin created successfully",
      {
        token,
        superAdmin,
      }
    );
  } catch (err) {
    console.error(err.message);
    return sendError(res, err.message);
  }
};

//signin
exports.superAdminpostLogin = async (req, res) => {
  try {
    const {email, password } = req.body;

    if (!email || !password) {
      return sendError(
        res,
        constants.VALIDATION_ERROR,
        "All the fields are required !!!!"
      );
    }

    const superAdmin = await SuperAdminModel.findOne({ email });
    if (
      !superAdmin ||
      !(await bcryptjs.compare(password, superAdmin.password))
    ) {
      return sendError(
        res,
        constants.UNAUTHORIZED,
        "Oops!! Invalid Credentials..Please try again !!"
      );
    }

    const token = await generateAuthToken(
      superAdmin._id,
      "superadmin",
      superAdmin.email
    );
    return sendSuccess(
      res,
      constants.OK,
      " Welcome !! You logged in as a Super Admin",
      {
        token,
        ...superAdmin.toObject(),
      }
    );
  } catch (err) {
    console.error(err);
    return sendServerError(res, err.message);
  }
};

//view users details  GET /api/superadmin/users?name=John or GET /api/superadmin/users?email=gmail.com or GET /api/superadmin/users?schoolId=66e1a11122cde67890ab1111 or GET /api/superadmin/users?country=India&state=Delhi or GET /api/superadmin/users?name=John&city=Noida&startDate=2025-08-01&endDate=2025-08-31&page=1&limit=5
exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit, name, email, mobileNumber, schoolName, country, state, city, startDate, endDate } = req.query;

    // defaults
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    // 🔍 Individual filters with regex
    if (name) filter.name = new RegExp(name, "i");
    if (email) filter.email = new RegExp(email, "i");
    if (mobileNumber) filter.mobileNumber = new RegExp(mobileNumber, "i");

    // 🏫 School filter
    if (schoolName) filter.schoolName = new RegExp(schoolName,"i");

    // 🌍 Location filters
    if (country) filter.country = new RegExp(country, "i");
    if (state) filter.state = new RegExp(state, "i");
    if (city) filter.city = new RegExp(city, "i");

    // 📅 Date range filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch users
    const users = await User.find(filter)
      .populate("schoolId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// Get user details by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate("schoolId", "name");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update user details by ID
exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // as per model {"name":"Ayush kumar Ghosal","city":"Bally"}

    let user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Dynamically update fields
    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    await user.save();

    // repopulate schoolId after update
    user = await User.findById(id).populate("schoolId", "name");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//delete User
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//topic add
exports.addTopic = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Topic name is required" });
    }

    let doc = await Topic.findOne();
    if (!doc) {
      doc = await Topic.create({ topics: [] });
    }

    // check duplicate (case-insensitive)
    if (doc.topics.some(t => t.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Topic already exists" });
    }

    doc.topics.push(name.trim());
    doc.topics.sort((a, b) => a.localeCompare(b)); // keep alphabetically sorted
    await doc.save();

    res.status(201).json({ success: true, message: "Topic added successfully", topics: doc.topics });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//get topics
exports.getAllTopics = async (req, res) => {
  try {
    let doc = await Topic.findOne();
    if (!doc) {
      doc = await Topic.create({ topics: [] });
    }

    res.status(200).json({ success: true, topics: doc.topics });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//update topic
exports.updateTopic = async (req, res) => {
  try {
    const { index } = req.params; // topic index
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "New topic name is required" });
    }

    const doc = await Topic.findOne();
    if (!doc || !doc.topics[index]) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    doc.topics[index] = name.trim();
    doc.topics.sort((a, b) => a.localeCompare(b));
    await doc.save();

    res.status(200).json({ success: true, message: "Topic updated successfully", topics: doc.topics });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//delete topic
exports.deleteTopic = async (req, res) => {
  try {
    const { index } = req.params;

    const doc = await Topic.findOne();
    if (!doc || !doc.topics[index]) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    doc.topics.splice(index, 1);
    await doc.save();

    res.status(200).json({ success: true, message: "Topic deleted successfully", topics: doc.topics });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};