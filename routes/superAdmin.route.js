const express = require("express");
const {
  exportUsersToExcel,
  superAdminPostSignup,
  superAdminpostLogin,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  addTopic,
  getAllTopics,
  updateTopic,
  deleteTopic,
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
  deleteSubCard,
  updateSubCard,
  addSubCard,
  deleteTrivia,
  updateTrivia,
  getTriviaById,
  getAllTrivias,
  createTrivia,
  addEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addQuizToEvent,
  updateQuiz,
  deleteQuiz,
  getAllScores,exportQuizScoresToExcel,
} = require("../controllers/superAdmin.controller");
const { superadminChecker } = require("../middlewares/authentication");
const upload = require("../middlewares/upload");

const router = express.Router();

// Authentication
router.post("/signup", superAdminPostSignup);
router.post("/signin", superAdminpostLogin);
router.get("/getAllUsers", superadminChecker, getAllUsers);
router.get("/exportUserList", exportUsersToExcel);
router.get("/getUserById/:id", superadminChecker, getUserById);
router.put("/userEdit/:id", superadminChecker, updateUserById);
router.delete("/userDelete/:id", superadminChecker, deleteUserById);

// Add new topic
router.post("/topics", upload.single("image"), addTopic);
// Get all topics
router.get("/topics", getAllTopics);
// Update topic
router.put("/topics/:index",upload.single("image"), updateTopic);
// Delete topic
router.delete("/topics/:index", deleteTopic);

//News ADD Edit Delete View
router.post("/news", upload.array("images", 5), createNews);
router.get("/news", getAllNews);
router.get("/news/:id", getNewsById);
router.delete("/news/:id", deleteNews);
router.put("/news/:id", upload.array("images", 5), updateNews);

//Trivia Section ----------------------------------
// Trivia CRUD
router.post("/trivia", upload.array('images'),createTrivia);
router.get("/trivia", getAllTrivias);
router.get("/trivia/:id", getTriviaById);
router.put("/trivia/:id", upload.array('images'), updateTrivia);
router.delete("/trivia/:id", deleteTrivia);

// SubCard CRUD
router.post("/trivia/subcards/:id",upload.single('image'), addSubCard);
router.put("/trivia/:id/subcards/:subCardId", upload.single('image'),updateSubCard);
router.delete("/trivia/:id/subcards/:subCardId", deleteSubCard);

//event and quiz
router.post("/event", addEvent);
router.get("/event", getAllEvents);
router.get("/event/:id", getEventById);
router.put("/event/:id", updateEvent);
router.delete("/event/:id", deleteEvent);

// Quiz CRUD with optional image upload
router.post("/event/:id/quiz", upload.any(), addQuizToEvent);
router.put("/event/:eventId/quiz/:quizId", upload.any(), updateQuiz);
router.delete("/event/:eventId/quiz/:quizId", deleteQuiz);


//get All score of user participate in event
router.get("/getAllUserScore", getAllScores);
//get quiz result export sheet
router.get("/events/:eventId/quiz/:quizId/export",exportQuizScoresToExcel)
module.exports = router;
