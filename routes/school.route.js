const express = require("express");
const router = express.Router();
const schoolController = require('../controllers/school.controller');
const upload = require("../middlewares/upload");
// ✅ Route for getting all schools
router.get("/getSchool", schoolController.getAllSchools);
router.post("/addSchool",schoolController.addSchool);
router.post("/uploadschools", upload.single("file"), schoolController.uploadSchools);
module.exports = router;
