const express = require("express");
const {UserLogin,registerUser,verifyEmail,forgetPassword,resetPassword,updatePassword,setUserTopics,addUserTopics,removeUserTopics,getAllTopicsForUser}=require("../controllers/user.controller")
const { userChecker } = require('../middlewares/authentication');
const router = express.Router();

router.post("/signup", registerUser)
router.post("/signin", UserLogin)
router.post('/verifyemail', verifyEmail)
router.post('/forgetPassword',forgetPassword)
router.post('/verifyForgetPasswordOTP',resetPassword)
router.put('/changePassword',userChecker,updatePassword)
router.post("/setTopicsFirst/:id",setUserTopics)
router.post("/addMoreTopicsLater/:id",addUserTopics)
router.delete("/deleteTopics/:id",removeUserTopics)

module.exports = router;