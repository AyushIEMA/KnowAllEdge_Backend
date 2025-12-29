const SuperAdminModel = require("../models/superAdmin.model");
const User=require('../models/user.model')
const Topic=require('../models/topic.model')
const News=require('../models/news.model')
const Trivia=require('../models/trivia.model')
const Event=require('../models/event.model')
const {constants}=require("../constant")
const {generateAuthToken}=require("../utils/generateAuthToken")
const bcryptjs = require("bcryptjs");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const { uploadFile } = require('../utils/s3');
const {
  sendSuccess,
  sendError,
  sendServerError,
} = require("../utils/response");
const { eventSchema, quizSchema } =require('../vallidation/eventValidation');
const Score=require('../models/score.model')
// ✅ Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // from .env
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});



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

//get all user List in CSV to be chnaged when s3 created
exports.exportUsersToExcel = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find().populate("schoolId", "name");

    // Create a new workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define columns
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Mobile Number", key: "mobileNumber", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Date of Birth", key: "dateOfBirth", width: 15 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Password", key: "password", width: 30 },
      { header: "Country", key: "country", width: 15 },
      { header: "State", key: "state", width: 15 },
      { header: "City", key: "city", width: 15 },
      { header: "School ID", key: "schoolId", width: 25 },
      { header: "School Name", key: "schoolName", width: 25 },
      { header: "Topics", key: "topics", width: 30 },
      { header: "Is School Student", key: "is_schoolStudent", width: 15 },
    ];

    // Add rows
    users.forEach((user) => {
      worksheet.addRow({
        name: user.name,
        mobileNumber: user.mobileNumber || "",
        email: user.email,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().split("T")[0]
          : "",
        gender: user.gender,
        password: user.password,
        country: user.country,
        state: user.state,
        city: user.city,
        schoolId: user.schoolId?._id ? user.schoolId._id.toString() : "",
        schoolName: user.schoolName || user.schoolId?.name || "",
        topics: user.topics && user.topics.length ? user.topics.join(", ") : "",
        is_schoolStudent: user.is_schoolStudent ? "Yes" : "No",
      });
    });

    // Bold headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload buffer to S3
    const fileName = `users_${Date.now()}.xlsx`;
    const publicUrl = await uploadFile(buffer, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'exports');

    // Send response with S3 URL
    res.status(200).json({
      success: true,
      message: "Users exported successfully",
      fileUrl: publicUrl,
    });

  } catch (error) {
    console.error("Error exporting users to Excel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export users",
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
    const file = req.file;

    if (!name) {
      return res.status(400).json({ success: false, message: "Topic name is required" });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const imageUrl = await uploadFile(file.buffer, file.originalname, file.mimetype, "topics");

    let doc = await Topic.findOne();
    if (!doc) {
      doc = await Topic.create({ topics: [] });
    }

    // check duplicate for both string and object format
    if (
      doc.topics.some(t => {
        const topicName = typeof t === "string" ? t : t.name;
        return topicName && topicName.toLowerCase() === name.toLowerCase();
      })
    ) {
      return res.status(400).json({ success: false, message: "Topic already exists" });
    }

    doc.topics.push({ name: name.trim(), image: imageUrl });

    // safe sort for both old & new formats
    doc.topics.sort((a, b) => {
      const nameA = typeof a === "string" ? a : a.name || "";
      const nameB = typeof b === "string" ? b : b.name || "";
      return nameA.localeCompare(nameB);
    });

    await doc.save();

    res.status(201).json({
      success: true,
      message: "Topic added successfully",
      topics: doc.topics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//get topics
exports.getAllTopics = async (req, res) => {
  try {
    let doc = await Topic.findOne();

    // if no doc exists, create an empty one
    if (!doc) {
      doc = await Topic.create({ topics: [] });
    }

    // normalize old topics (handle both string and object)
    const formattedTopics = doc.topics.map(t => {
      if (typeof t === "string") {
        return { name: t, image: "" }; // default empty image
      }
      return {
        name: t.name || "",
        image: t.image || "",
      };
    });

    // sort alphabetically by name
    formattedTopics.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      count: formattedTopics.length,
      topics: formattedTopics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//update topic
exports.updateTopic = async (req, res) => {
  try {
    const { index } = req.params; // topic index
    const { name } = req.body;
    const file = req.file; // optional new image

    const doc = await Topic.findOne();
    if (!doc || !doc.topics[index]) {
      return res.status(404).json({ success: false, message: "Topic not found" });
    }

    // Get existing topic
    const oldTopic = doc.topics[index];
    let updatedTopic = {
      name: typeof oldTopic === "string" ? oldTopic : oldTopic.name || "",
      image: typeof oldTopic === "string" ? "" : oldTopic.image || "",
    };

    // Update name if provided
    if (name && name.trim()) {
      updatedTopic.name = name.trim();
    }

    // Update image if a new file is uploaded
    if (file) {
      const imageUrl = await uploadFile(file.buffer, file.originalname, file.mimetype, "topics");
      updatedTopic.image = imageUrl;
    }

    // Save updated topic
    doc.topics[index] = updatedTopic;

    // Safe sort alphabetically
    doc.topics.sort((a, b) => {
      const nameA = typeof a === "string" ? a : a.name || "";
      const nameB = typeof b === "string" ? b : b.name || "";
      return nameA.localeCompare(nameB);
    });

    await doc.save();

    res.status(200).json({
      success: true,
      message: "Topic updated successfully",
      topics: doc.topics,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
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



//Add news 
exports.createNews = async (req, res) => {
  try {
    const {
      heading,
      subHeading,
      smallContent,
      largeContent,
      contentType,
      contentFor,
      date,
    } = req.body;

    // ✅ Normalize topics
    let topics = req.body.topics || [];
    if (typeof topics === "string") {
      try {
        // If it's a JSON string like '["AI","Tech"]'
        const parsed = JSON.parse(topics);
        topics = Array.isArray(parsed) ? parsed : [topics];
      } catch {
        // If it's a single string like "Education"
        topics = [topics];
      }
    }

    if (!Array.isArray(topics)) {
      topics = [topics];
    }

    // ✅ Word limit check
    const wordCount = smallContent ? smallContent.trim().split(/\s+/).length : 0;
    if (wordCount > 80) {
      return res.status(400).json({
        success: false,
        message: "Sorry in First Content Box you can add only 80 words!!",
      });
    }

    // ✅ Upload multiple images to S3
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) =>
          uploadFile(file.buffer, file.originalname, file.mimetype, "news")
        )
      );
    }

    // ✅ Create News
    const news = await News.create({
      heading,
      subHeading,
      smallContent,
      largeContent,
      images: imageUrls,
      contentType,
      topics,
      contentFor,
      date,
    });

    res.status(201).json({ success: true, data: news });
  } catch (error) {
    console.error("createNews error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All News
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single News by ID
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: "News not found" });
    }
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update News
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      heading,
      subHeading,
      smallContent,
      largeContent,
      contentType,
      contentFor,
      date,
      topics: rawTopics,
      removeImages = [], // array of image URLs to remove
    } = req.body;

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ success: false, message: "News not found" });

    // ✅ Word limit check
    if (smallContent) {
      const wordCount = smallContent.trim().split(/\s+/).length;
      if (wordCount > 80)
        return res.status(400).json({ success: false, message: "Small content max 80 words" });
    }

    // ✅ Normalize topics
    let topics = rawTopics || news.topics;
    if (typeof topics === "string") {
      try {
        const parsed = JSON.parse(topics);
        topics = Array.isArray(parsed) ? parsed : [topics];
      } catch {
        topics = [topics];
      }
    }
    if (!Array.isArray(topics)) topics = [topics];

    // ✅ Upload new images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = await Promise.all(
        req.files.map((file) => uploadFile(file.buffer, file.originalname, file.mimetype, "news"))
      );
    }

    // ✅ Remove selected images
    let updatedImages = news.images.filter((img) => !removeImages.includes(img));

    // ✅ Merge new images
    updatedImages = [...updatedImages, ...newImages];

    // ✅ Update fields
    news.heading = heading || news.heading;
    news.subHeading = subHeading || news.subHeading;
    news.smallContent = smallContent || news.smallContent;
    news.largeContent = largeContent || news.largeContent;
    news.contentType = contentType || news.contentType;
    news.contentFor = contentFor || news.contentFor;
    news.date = date || news.date;
    news.topics = topics;
    news.images = updatedImages;

    await news.save();

    res.status(200).json({ success: true, message: "News updated successfully", data: news });
  } catch (error) {
    console.error("updateNews error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Delete News
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: "News not found" });
    }
    res.status(200).json({ success: true, message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Trivia Section ------------------------

// ✅ Create Trivia
exports.createTrivia = async (req, res) => {
  try {
    const { triviaName, subCards } = req.body;

    let parsedSubCards = subCards;
if (typeof subCards === 'string') {
  parsedSubCards = JSON.parse(subCards);
}
    if (!subCards || subCards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one subcard is required.',
      });
    }

    // req.files comes from multer
    // assume order of files corresponds to subCards
   if (req.files && req.files.length > 0) {
  for (let i = 0; i < parsedSubCards.length; i++) {
    const file = req.files[i];
    if (file) {
      const publicUrl = await uploadFile(file.buffer, file.originalname, file.mimetype, 'trivia');
      parsedSubCards[i].image = publicUrl;
    }
  }
}

   const trivia = await Trivia.create({ triviaName, subCards: parsedSubCards });
res.status(201).json({ success: true, data: trivia });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get All Trivias
exports.getAllTrivias = async (req, res) => {
  try {
    const trivias = await Trivia.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: trivias });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Trivia
exports.getTriviaById = async (req, res) => {
  try {
    const trivia = await Trivia.findById(req.params.id);
    if (!trivia) {
      return res.status(404).json({ success: false, message: "Trivia not found" });
    }
    res.status(200).json({ success: true, data: trivia });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Trivia (name or whole subCards array)
exports.updateTrivia = async (req, res) => {
  try {
    let { subCards } = req.body;

    // Parse subCards if it's a string (from form-data)
    if (typeof subCards === 'string') {
      subCards = JSON.parse(subCards);
    }

    // Handle uploaded images
    // Assuming req.files is an array, order matches subCards
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < subCards.length; i++) {
        const file = req.files[i];
        if (file) {
          const publicUrl = await uploadFile(file.buffer, file.originalname, file.mimetype, 'trivia');
          subCards[i].image = publicUrl; // replace image URL with S3 public URL
        }
      }
    }

    // Update Trivia
    const updated = await Trivia.findByIdAndUpdate(
      req.params.id,
      { ...req.body, subCards }, // ensure subCards is replaced
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Trivia not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete Trivia
exports.deleteTrivia = async (req, res) => {
  try {
    const deleted = await Trivia.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Trivia not found" });
    }
    res.status(200).json({ success: true, message: "Trivia deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// 🔹 SUBCARDS OPERATIONS
//

// ✅ Add a new subcard
exports.addSubCard = async (req, res) => {
  try {
    const { id } = req.params; // Trivia ID
    const { heading, subHeading, content } = req.body;

    const trivia = await Trivia.findById(id);
    if (!trivia) {
      return res.status(404).json({ success: false, message: "Trivia not found" });
    }

    let imageUrl = "";
    if (req.file) {
      // Upload single image to S3
      imageUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'trivia');
    }

    // Push new subCard
    trivia.subCards.push({
      heading,
      subHeading,
      content,
      image: imageUrl, // S3 public URL
    });

    await trivia.save();

    res.status(200).json({ success: true, data: trivia });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Update a subcard
exports.updateSubCard = async (req, res) => {
  try {
    const { id, subCardId } = req.params;
    const { heading, subHeading, content } = req.body;

    const trivia = await Trivia.findById(id);
    if (!trivia) {
      return res.status(404).json({ success: false, message: "Trivia not found" });
    }

    const subCard = trivia.subCards.id(subCardId);
    if (!subCard) {
      return res.status(404).json({ success: false, message: "SubCard not found" });
    }

    // Update text fields if provided
    if (heading !== undefined) subCard.heading = heading;
    if (subHeading !== undefined) subCard.subHeading = subHeading;
    if (content !== undefined) subCard.content = content;

    // Handle new image upload
    if (req.file) {
      const publicUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, 'trivia');
      subCard.image = publicUrl;
    }

    await trivia.save();

    res.status(200).json({ success: true, data: trivia });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Delete a subcard
exports.deleteSubCard = async (req, res) => {
  try {
    const { id, subCardId } = req.params;

    const trivia = await Trivia.findById(id);
    if (!trivia) {
      return res.status(404).json({ success: false, message: "Trivia not found" });
    }

    if (trivia.subCards.length <= 1) {
      return res.status(400).json({ success: false, message: "A trivia must have at least one subcard." });
    }

    // ✅ Remove subCard by ID
    const subCard = trivia.subCards.id(subCardId);
    if (!subCard) {
      return res.status(404).json({ success: false, message: "SubCard not found" });
    }

    trivia.subCards.pull({ _id: subCardId }); // ✅ Works in Mongoose v7+
    await trivia.save();

    res.status(200).json({
      success: true,
      message: "SubCard deleted successfully",
      data: trivia,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//quiz and event part 

// Helper: quiz status
const getQuizStatus = (quiz) => {
  const now = new Date();
  if (now >= quiz.startTime && now <= quiz.endTime) return "LIVE";
  if (now > quiz.endTime) return "PAST";
  return "FUTURE";
};

// Add Event
exports.addEvent = async (req, res) => {
  try {
    // Joi validation
    const { error } = eventSchema.validate(req.body);
    if (error)
      return res.status(400).json({ error: error.details[0].message });

    const { eventStartTime, eventEndTime } = req.body;

    const now = new Date();
    const start = new Date(eventStartTime);
    const end = new Date(eventEndTime);

    // 🕒 Event lifecycle
    let status = "future";
    if (now >= start && now <= end) status = "live";
    if (now > end) status = "past";

    // Create event with status
    const event = new Event({
      ...req.body,
      status
    });

    await event.save();

    res.status(201).json({
      message: "Event created successfully",
      event
    });

  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Events
exports.getAllEvents = async (req, res) => {
  try {
    const { type } = req.query;
    const events = await Event.find();

    const categorized = events.map((event) => {
      const quizzes = event.quizzes.map((quiz) => ({
        ...quiz.toObject(),
        status: getQuizStatus(quiz),
      }));
      return { ...event.toObject(), quizzes };
    });

    const filtered =
      type && ["LIVE", "PAST", "FUTURE"].includes(type.toUpperCase())
        ? categorized.map((event) => ({
            ...event,
            quizzes: event.quizzes.filter((q) => q.status === type.toUpperCase()),
          }))
        : categorized;

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//get event by ID
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find event by ID
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Map quizzes with status
    const quizzes = event.quizzes.map((quiz) => ({
      ...quiz.toObject(),
      status: getQuizStatus(quiz),
    }));

    // Combine data
    const formattedEvent = {
      ...event.toObject(),
      quizzes,
    };

    res.json(formattedEvent);
  } catch (err) {
    console.error("Error fetching event by ID:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { error } = eventSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event updated", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Quiz
exports.addQuizToEvent = async (req, res) => {
  try {
    let {
      quizName,
      onTopics,
      quizMaster,
      startTime,
      endTime,
      questionSwapTime,
      questions
    } = req.body;

    // JSON parse for form-data
    if (typeof onTopics === "string") onTopics = JSON.parse(onTopics);
    if (typeof questions === "string") questions = JSON.parse(questions);

    // Validate
    if (!quizName || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Find event
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const quizStart = new Date(startTime);
    const quizEnd = new Date(endTime);

    if (quizStart < event.eventStartTime || quizEnd > event.eventEndTime) {
      return res.status(400).json({
        message: "Quiz time must be within event duration"
      });
    }

    // 🖼️ Attach images to questions
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const match = file.fieldname.match(/images\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          const url = await uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            "quiz-images"
          );
          if (questions[index]) questions[index].imageUrl = url;
        }
      }
    }

    // 🕒 Status logic
    const now = new Date();
    let status = "future";
    if (now >= quizStart && now <= quizEnd) status = "live";
    if (now > quizEnd) status = "past";

    const quiz = {
      quizName,
      onTopics,
      quizMaster,
      startTime,
      endTime,
      questionSwapTime,
      questions,
      status
    };

    event.quizzes.push(quiz);
    await event.save();

    res.status(201).json({
      message: "Quiz added successfully",
      quiz
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
// Update Quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { error } = quizSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const quiz = event.quizzes.id(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    Object.assign(quiz, req.body);
    await event.save();
    res.json({ message: "Quiz updated", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { eventId, quizId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check quiz exists
    const quiz = event.quizzes.id(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // ✅ Proper way to delete subdocument in Mongoose v7
    event.quizzes.pull({ _id: quizId });

    await event.save();

    res.json({
      success: true,
      message: "Quiz deleted successfully",
      remainingQuizzes: event.quizzes
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//get quiz result all (leaderboard)
// ✅ Get all scores (admin)
exports.getAllScores = async (req, res) => {
  try {
    const scores = await Score.find()
      .populate("user", "name email") // ✅ match your ref
      .populate("event", "eventName eventStartTime eventEndTime")
      .sort({ score: -1, percentage: -1 }); // 👈 sort by score (and percentage if same score)

    res.status(200).json({ total: scores.length, scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//quiz result export list just pass eventid and quizid in params
exports.exportQuizScoresToExcel = async (req, res) => {
  try {
    const { eventId, quizId } = req.params;

    // 1️⃣ Get Event + Quiz name
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const quiz = event.quizzes.id(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const eventName = event.eventName;
    const quizName = quiz.quizName;

    // 2️⃣ Fetch scores
    const scores = await Score.find({ event: eventId, quizId })
      .populate("user", "name email mobileNumber")
      .lean();

    if (!scores.length) {
      return res.status(404).json({ message: "No scores found" });
    }

    // 3️⃣ Create Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quiz Results");

    worksheet.columns = [
      { header: "User Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile", key: "mobile", width: 18 },
      { header: "Event Name", key: "eventName", width: 30 },
      { header: "Quiz Name", key: "quizName", width: 30 },
      { header: "Score", key: "score", width: 10 },
      { header: "Total Questions", key: "total", width: 15 },
      { header: "Percentage", key: "percentage", width: 15 },
      { header: "Played At", key: "playedAt", width: 25 },
    ];

    // 4️⃣ Add rows
    scores.forEach(s => {
      worksheet.addRow({
        name: s.user?.name || "N/A",
        email: s.user?.email || "",
        mobile: s.user?.mobileNumber || "",
        eventName,
        quizName,
        score: s.score,
        total: s.totalQuestions,
        percentage: `${s.percentage}%`,
        playedAt: new Date(s.playedAt).toLocaleString()
      });
    });

    // Bold headers
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
    });

    // 5️⃣ Convert to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 6️⃣ Upload to S3
    const fileName = `${eventName}_${quizName}_Results_${Date.now()}.xlsx`.replace(/[^a-zA-Z0-9]/g, "_");

    const publicUrl = await uploadFile(
      buffer,
      fileName,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "quiz-exports"
    );

    // 7️⃣ Response
    res.json({
      success: true,
      message: "Quiz results exported successfully",
      eventName,
      quizName,
      fileUrl: publicUrl
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};