const express = require("express");
const {getUserScores,getQuizForPlay,submitQuizAnswers,getNewsByTopic,updateProfilePic,editProfile,UserLogin,registerUser,verifyEmail,forgetPassword,resetPassword,updatePassword,setUserTopics,addUserTopics,removeUserTopics,getAllTopicsForUser,getUserFeedCursor}=require("../controllers/user.controller")
const { userChecker } = require('../middlewares/authentication');
const router = express.Router();
const upload = require('../middlewares/upload');


router.post("/signup", registerUser)
router.post("/signin", UserLogin)
router.post('/verifyemail', verifyEmail)
router.post('/forgetPassword',forgetPassword)
router.post('/verifyForgetPasswordOTP',resetPassword)
router.put('/changePassword',userChecker,updatePassword)
router.post("/setTopicsFirst/:id",setUserTopics)
router.post("/addMoreTopicsLater/:id",addUserTopics)
router.delete("/deleteTopics/:id",removeUserTopics)
router.put("/edit/profilePic/:id", upload.single("profilePic"), updateProfilePic);
router.put("/editProfile/:id", editProfile);
//initial  http://localhost:8080/api/v1/user/feed?limit=20 then GEThttp://localhost:8080/api/v1/user/feed?cursor=2025-09-09T10:37:37.570Z cursor value you will get from "nextCursor" from prev response
router.get('/feed', userChecker,getUserFeedCursor);
//in discover page news filtered topic wise
router.get("/topic/:topic", userChecker,getNewsByTopic);
//get quiz questions without answer 
router.get('/events/:eventId/quizzes/:quizId/play',userChecker,getQuizForPlay)
//anser quiz question
router.post("/events/:eventId/quizzes/:quizId/submit",userChecker,submitQuizAnswers)
router.get("/topic/:topic", userChecker,getNewsByTopic);
//user score to see personal
router.get("/getScore", userChecker, getUserScores);
module.exports = router;