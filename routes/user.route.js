const express = require("express");
const {updateProfilePic,editProfile,UserLogin,registerUser,verifyEmail,forgetPassword,resetPassword,updatePassword,setUserTopics,addUserTopics,removeUserTopics,getAllTopicsForUser}=require("../controllers/user.controller")
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
module.exports = router;