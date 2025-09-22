const express = require("express");
const {exportUsersToExcel,superAdminPostSignup,superAdminpostLogin,
    getAllUsers,getUserById,updateUserById,deleteUserById,
    addTopic,getAllTopics,updateTopic,deleteTopic,createNews,
    getAllNews,getNewsById,updateNews,deleteNews,
    deleteSubCard,updateSubCard,addSubCard,deleteTrivia,updateTrivia,getTriviaById,getAllTrivias,createTrivia}=require('../controllers/superAdmin.controller');
const { superadminChecker } = require('../middlewares/authentication');
const upload=require('../middlewares/upload')

const router = express.Router();

// Authentication
router.post("/signup", superAdminPostSignup);
router.post("/signin",superAdminpostLogin);
router.get("/getAllUsers",superadminChecker,getAllUsers)
router.get("/exportUserList",exportUsersToExcel)
router.get("/getUserById/:id",superadminChecker,getUserById)
router.put("/userEdit/:id",superadminChecker,updateUserById)
router.delete("/userDelete/:id",superadminChecker,deleteUserById)

// Add new topic
router.post("/topics", addTopic);
// Get all topics
router.get("/topics", getAllTopics);
// Update topic
router.put("/topics/:index", updateTopic);
// Delete topic
router.delete("/topics/:index", deleteTopic);

//News ADD Edit Delete View
router.post("/news", upload.array("images", 5), createNews);
router.get("/news",getAllNews);
router.get("/news/:id",getNewsById);
router.delete("/news/:id",deleteNews);
router.put("/news/:id", upload.array("images", 5), updateNews);

//Trivia Section ----------------------------------
// Trivia CRUD
router.post("/trivia", createTrivia);
router.get("/trivia", getAllTrivias);
router.get("/trivia/:id", getTriviaById);
router.put("/trivia/:id", updateTrivia);
router.delete("/trivia/:id", deleteTrivia);

// SubCard CRUD
router.post("/trivia/subcards/:id", addSubCard);
router.put("/trivia/:id/subcards/:subCardId", updateSubCard);
router.delete("/trivia/:id/subcards/:subCardId", deleteSubCard);


module.exports = router;