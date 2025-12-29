const User = require("../models/user.model");
const School = require("../models/school.model");
const Otp=require('../models/otp.model')
const emailModel = require("../models/email.model");
const bcryptjs = require("bcryptjs");
const {sendEmail,sendForgetPasswordOTP} = require("../utils/sendEmail");
const nodemailer = require("nodemailer");
const { generateAuthToken } = require("../utils/generateAuthToken");
const {
  sendSuccess,
  sendError,
  sendServerError,
} = require("../utils/response");
const {constants}=require("../constant")
const { uploadFile } = require('../utils/s3');
const News = require('../models/news.model');
const Trivia = require('../models/trivia.model');
const Event=require("../models/event.model")
const Score=require("../models/score.model")

//user signup
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      email,
      dateOfBirth,
      gender,
      password,
      country,
      state,
      city,
      schoolName,
      newSchoolName,
      topics,
    } = req.body;

    let finalSchoolName = null;
    let schoolId = null;
    let isSchoolStudent = false; // default false

    // ✅ Case: User selected "Others" & provided a new school
    if (schoolName && schoolName.trim().toLowerCase() === "others" && newSchoolName) {
      let school = await School.findOne({
        name: { $regex: `^${newSchoolName.trim()}$`, $options: "i" }, // case-insensitive match
      });

      if (!school) {
        // ✅ Create a new school with isNewAdded = true
        school = await School.create({
          name: newSchoolName.trim(),
          isNewAdded: true,
        });
      }

      finalSchoolName = school.name;
      schoolId = school._id;
      isSchoolStudent = true;
    }
    // ✅ Case: User selected an existing school
    else if (schoolName && schoolName.trim().toLowerCase() !== "others") {
      const school = await School.findOne({
        name: { $regex: `^${schoolName.trim()}$`, $options: "i" }, // case-insensitive match
      });

      if (!school) {
        return res.status(400).json({
          success: false,
          message: "Invalid school selected",
        });
      }

      finalSchoolName = school.name;
      schoolId = school._id;
      isSchoolStudent = true;
    }
    // else → no schoolName → keep isSchoolStudent = false

    // ✅ Save user
    const user = await User.create({
      name,
      mobileNumber,
      email,
      dateOfBirth,
      gender,
      password,
      country,
      state,
      city,
      schoolId,
      schoolName: finalSchoolName,
      topics,
      is_schoolStudent: isSchoolStudent,
    });

    // ✅ Response
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        country: user.country,
        state: user.state,
        city: user.city,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        topics: user.topics,
        is_schoolStudent: user.is_schoolStudent,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



//user signin
exports.UserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(
        res,
        constants.VALIDATION_ERROR,
        "All the fields are required!"
      );
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcryptjs.compare(password, user.password))) {
      return sendError(
        res,
        constants.VALIDATION_ERROR,
        "Oops!! Invalid Credentials..Please try again !!"
      );
    }

    const token = await generateAuthToken(user._id, "user", user.email);
    return sendSuccess(
      res,
      constants.OK,
      "Welcome !! You have successfully logged in to the system..",
      { token, ...user.toObject() }
    );
  } catch (err) {
    console.error(err);
    return sendServerError(res, err.message);
  }
};

//user email verification
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.query;

  if (!email)
    return sendError(res, constants.VALIDATION_ERROR, "Email is required");

  // Check if email exists in validemaillist
  const validEmailEntry = await emailModel.findOne({ email });

  // Validate email domain only if it does not exist in validemaillist
 const validEmailRegex =
  /^[a-zA-Z0-9._%+-]+@(iemlabs\.com|gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;

  if (!validEmailEntry && !validEmailRegex.test(email)) {
    return sendError(
      res,
      constants.VALIDATION_ERROR,
      "Sorry !! Unauthorized Email domain.Please check it properly before verification"
    );
  }

  if (!otp) {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: generatedOtp });

    const emailSent = await sendEmail(email, generatedOtp);
    if (!emailSent) {
      return sendError(
        res,
        constants.INTERNAL_SERVER_ERROR,
        "Failed to send OTP to your email. Please try again."
      );
    }

    return sendSuccess(
      res,
      constants.OK,
      "Your Email Verification OTP has been sent to your email."
    );
  }

  const existingOtp = await Otp.findOne({ email, otp });
  if (!existingOtp) {
    return sendError(
      res,
      constants.VALIDATION_ERROR,
      "Oops!! Your OTP is either Invalid or expired."
    );
  }

  await Otp.deleteMany({ email });
  return sendSuccess(
    res,
    constants.OK,
    "Congrats!! Your Email verification is successful."
  );
};

//forget password and /verifyotp for forget password
exports.forgetPassword = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // STEP 1: Send OTP (only email provided)
    if (email && !otp) {
      const user = await User.findOne({ email });
      if (!user) {
        return sendError(res, constants.NOT_FOUND, "Oops! The provided email is not registered.");
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP to email
      const emailSent = await sendForgetPasswordOTP(email, generatedOtp);
      if (!emailSent) {
        return sendError(res, constants.INTERNAL_SERVER_ERROR, "Failed to send OTP email. Please try again later.");
      }

      // Save OTP in DB
      await Otp.deleteMany({ email });
      await Otp.create({ email, otp: generatedOtp });

      return sendSuccess(res, constants.OK, "Your reset password OTP has been sent to your email.");
    }

    // STEP 2: Verify OTP (email + otp provided)
    if (email && otp) {
      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return sendError(res, constants.UNAUTHORIZED, "Invalid OTP. Please try again.");
      }

      // Mark OTP as verified
      otpRecord.isVerified = true;
      await otpRecord.save();

      return sendSuccess(res, constants.OK, "OTP verified successfully. You can now reset your password.");
    }

    return sendError(res, constants.BAD_REQUEST, "Please provide email or email + otp.");
  } catch (err) {
    console.error(err);
    return sendServerError(res, err.message);
  }
};

//reset password for forget password 
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Check if OTP was verified
    const otpRecord = await Otp.findOne({ email, isVerified: true });
    if (!otpRecord) {
      return sendError(res, constants.UNAUTHORIZED, "OTP not verified. Please verify your OTP first.");
    }

    // Hash new password
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.updateOne({ email }, { password: hashedPassword });

    // Clean up OTP record after successful reset
    await Otp.deleteMany({ email });

    return sendSuccess(res, constants.OK, "Password reset successfully.");
  } catch (err) {
    console.error(err);
    return sendServerError(res, err.message);
  }
};


//change or update password only loggedin User
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ coming from auth middleware
    const { oldPassword, newPassword } = req.body;

    // Step 1: Find user
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, constants.NOT_FOUND, "User not found.");
    }

    const isMatch = await bcryptjs.compare(oldPassword, user.password);
    if (!isMatch) {
      return sendError(res, constants.UNAUTHORIZED, "Old password is incorrect.");
    }
    user.password = newPassword;

    
    await user.save();

    return sendSuccess(res, constants.OK, "Password updated successfully.");
  } catch (err) {
    console.error(err);
    return sendServerError(res, err.message);
  }
};

//edit profile
exports.editProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      mobileNumber,
      gender,
      country,
      state,
      city,
      topics,
      is_schoolStudent,
    } = req.body;

    // ✅ Find user
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Update allowed fields
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (gender) user.gender = gender;
    if (country) user.country = country;
    if (state) user.state = state;
    if (city) user.city = city;
    if (typeof is_schoolStudent !== "undefined") user.is_schoolStudent = is_schoolStudent;

    // ✅ Normalize topics
    if (topics) {
      let parsedTopics = topics;
      if (typeof topics === "string") {
        try {
          const parsed = JSON.parse(topics);
          parsedTopics = Array.isArray(parsed) ? parsed : [topics];
        } catch {
          parsedTopics = [topics];
        }
      }
      user.topics = parsedTopics;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("editProfile error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//edit profile photo
exports.updateProfilePic = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Find user
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Require file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No profile picture uploaded" });
    }

    // ✅ Upload to S3
    const imageUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "profilePics"
    );

    user.profilePic = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("updateProfilePic error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};




//choose topics for first time (minimum 5 to choose)
exports.setUserTopics = async (req, res) => {
  try {
    const { id } = req.params;
    const { topics } = req.body;

    if (!Array.isArray(topics) || topics.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please select at least 5 topics",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { topics },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Topics set successfully",
      topics: user.topics,
    });
  } catch (error) {
    console.error("Error setting topics:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//update topics if user want it later
exports.addUserTopics = async (req, res) => {
  try {
    const { id } = req.params;
    const { topics } = req.body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide topics to add" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // merge without duplicates
    user.topics = Array.from(new Set([...user.topics, ...topics]));
    await user.save();

    res.status(200).json({
      success: true,
      message: "Topics added successfully",
      topics: user.topics,
    });
  } catch (error) {
    console.error("Error adding topics:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//delete some topics but should have atleast 5 i mean if user have choose 5 first then want to delete 1 not possible min 5 to be there
exports.removeUserTopics = async (req, res) => {
  try {
    const { id } = req.params;
    let { topics } = req.body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide an array of topics to delete",
      });
    }

    // sanitize
    topics = topics
      .filter(v => typeof v === "string")
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid topics provided",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const current = Array.isArray(user.topics) ? user.topics : [];

    // case-insensitive removal
    const removeSet = new Set(topics.map(t => t.toLowerCase()));
    const remaining = current.filter(
      t => !removeSet.has(String(t).trim().toLowerCase())
    );

    // enforce minimum 5
    if (remaining.length < 5) {
      return res.status(400).json({
        success: false,
        message: `User must have at least 5 topics. Current: ${current.length}, trying to remove: ${topics.length}, would leave: ${remaining.length}.`,
      });
    }

    user.topics = remaining;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Topics removed successfully",
      topics: user.topics,
    });
  } catch (error) {
    console.error("Error removing topics:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//get topics for user
exports.getAllTopicsForUser = async (req, res) => {
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


//get the news feed 
exports.getUserFeedCursor = async (req, res) => {
  try {
    const user = req.user;
    const userTopics = user.topics || [];
    const isSchoolStudent = user.is_schoolStudent || false;

    const limit = parseInt(req.query.limit) || 20;
    let cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    // Validate cursor
    if (cursor && isNaN(cursor.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor value",
      });
    }

    // Build content filter based on user type
    const contentFilter = {
      $or: [
        { contentFor: "For Both" },
        isSchoolStudent
          ? { contentFor: "For School" }
          : { contentFor: "Others" },
      ],
    };

    // News query base
    let newsQuery = { ...contentFilter };
    if (cursor) newsQuery.updatedAt = { $lt: cursor };

    // Fetch topic-matched news first
    const matchedNews = await News.find({
      ...newsQuery,
      topics: { $in: userTopics },
    })
      .sort({ updatedAt: -1 })
      .limit(limit * 3) // fetch more for mixing
      .lean();

    // Fetch other news if needed
    let remaining = limit * 3 - matchedNews.length;
    let otherNews = [];
    if (remaining > 0) {
      otherNews = await News.find({
        ...newsQuery,
        topics: { $nin: userTopics },
      })
        .sort({ updatedAt: -1 })
        .limit(remaining)
        .lean();
    }

    const allNews = [...matchedNews, ...otherNews];

    // Fetch trivias (latest first)
    const trivias = await Trivia.find()
      .sort({ updatedAt: -1 })
      .lean();

    // Trivia appears at positions repeating every 20 items: 5, 13, 20
    const triviaPositions = [5, 13, 20];
    const feed = [];
    let newsIndex = 0;
    let triviaIndex = 0;
    let itemIndex = 1;

    // Keep looping until feed has 'limit' items or we run out of content
    while (
      feed.length < limit &&
      (newsIndex < allNews.length || triviaIndex < trivias.length)
    ) {
      const positionInBlock = ((itemIndex - 1) % 20) + 1; // cycles 1–20 repeatedly

      if (triviaPositions.includes(positionInBlock)) {
        // Insert trivia if available
        if (triviaIndex < trivias.length) {
          feed.push({ type: "trivia", data: trivias[triviaIndex] });
          triviaIndex++;
        } else if (newsIndex < allNews.length) {
          // fallback to news if trivia runs out
          feed.push(allNews[newsIndex]);
          newsIndex++;
        }
      } else {
        // Insert news
        if (newsIndex < allNews.length) {
          feed.push(allNews[newsIndex]);
          newsIndex++;
        }
      }

      itemIndex++;
    }

    // Determine nextCursor safely
    const lastItem = feed[feed.length - 1];
    const nextCursor = lastItem
      ? lastItem.updatedAt
        ? lastItem.updatedAt.toISOString()
        : lastItem.data?.updatedAt?.toISOString() || null
      : null;

    res.status(200).json({
      success: true,
      feed,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
      error: error.message,
    });
  }
};


//in discover page get news by category wise
exports.getNewsByTopic = async (req, res) => {
  try {
    const topicParam = req.params.topic;

    if (!topicParam) {
      return res.status(400).json({ success: false, message: "Topic parameter is required" });
    }

    // req.user is set by userChecker middleware
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Determine contentFor based on user's school status
    const contentType = user.is_schoolStudent ? "For School" : "For Others";

    // Find news that matches both topic and contentFor
    const newsList = await News.find({
      topics: { $in: [topicParam] },
      contentFor: contentType,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: newsList.length,
      news: newsList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

//play quiz
//get quiz without answer 
exports.getQuizForPlay = async (req, res) => {
  try {
    const { eventId, quizId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const quiz = event.quizzes.id(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // ⛔ Future quizzes blocked
    if (quiz.status === "future") {
      return res.status(403).json({
        status: quiz.status,
        message: "Quiz has not started yet"
      });
    }

    // 🔥 If quiz is LIVE → block re-play
    if (quiz.status === "live") {
      const alreadyPlayed = await Score.findOne({
        user: req.user._id,
        event: eventId,
        quizId,
        isPlayed: true
      });

      if (alreadyPlayed) {
        return res.status(403).json({
          message: "You have already played this quiz",
          score: alreadyPlayed
        });
      }
    }

    // 🕒 Time logic
    const now = new Date();
    const quizStart = new Date(quiz.startTime);

    const elapsedSeconds = Math.floor((now - quizStart) / 1000);
    const swapTime = quiz.questionSwapTime;

    let currentQuestionIndex = Math.floor(elapsedSeconds / swapTime);
    if (currentQuestionIndex < 0) currentQuestionIndex = 0;
    if (currentQuestionIndex >= quiz.questions.length)
      currentQuestionIndex = quiz.questions.length - 1;

    const safeQuestions = quiz.questions.map(q => ({
      _id: q._id,
      question: q.question,
      imageUrl: q.imageUrl,
      answers: q.answers
    }));

    res.json({
      quizName: quiz.quizName,
      onTopics: quiz.onTopics,
      quizMaster: quiz.quizMaster,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      questionSwapTime: quiz.questionSwapTime,
      status: quiz.status,
      currentQuestionIndex,
      questions: safeQuestions
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



//submit answer 
exports.submitQuizAnswers = async (req, res) => {
  try {
    const { eventId, quizId } = req.params;
    const { responses } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ message: "Responses must be an array" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const quiz = event.quizzes.id(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // ⛔ Prevent re-submit while LIVE
    if (quiz.status === "live") {
      const alreadyPlayed = await Score.findOne({
        user: req.user._id,
        event: eventId,
        quizId,
        isPlayed: true
      });

      if (alreadyPlayed) {
        return res.status(403).json({
          message: "You have already played this quiz"
        });
      }
    }

    // 🧮 Calculate score + build review
    let score = 0;
    const review = [];

    quiz.questions.forEach(q => {
      const userAnswerObj = responses.find(
        r => r.questionId === q._id.toString()
      );

      const userAnswer = userAnswerObj?.selectedAnswer || null;
      const correctAnswer = q.correctAnswer;

      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) score++;

      review.push({
        questionId: q._id,
        question: q.question,
        userAnswer,
        correctAnswer,
        isCorrect
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = (score / totalQuestions) * 100;

    // 🧾 Save score
    const newScore = await Score.create({
      user: req.user._id,
      event: eventId,
      quizId,
      score,
      totalQuestions,
      percentage,
      isPlayed: true
    });

    // 🎯 Send result with wrong answers
    res.json({
      message: "Quiz submitted successfully",
      score: {
        obtained: score,
        total: totalQuestions,
        percentage
      },
      resultBreakdown: review
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



//get score to see
// ✅ Get user-wise scores (logged-in user)
exports.getUserScores = async (req, res) => {
  try {
    const userId = req.user._id;

    const scores = await Score.find({ user: userId })
      .populate("event", "eventName eventStartTime eventEndTime")
      .sort({ playedAt: -1 });

    res.status(200).json({ total: scores.length, scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
