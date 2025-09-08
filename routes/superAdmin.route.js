const express = require("express");
const {superAdminPostSignup,superAdminpostLogin,getAllUsers,getUserById,updateUserById,deleteUserById,addTopic,getAllTopics,updateTopic,deleteTopic}=require('../controllers/superAdmin.controller');
const { superadminChecker } = require('../middlewares/authentication');


const router = express.Router();

// Authentication
router.post("/signup", superAdminPostSignup);
router.post("/signin",superAdminpostLogin);
router.get("/getAllUsers",superadminChecker,getAllUsers)
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
module.exports = router;