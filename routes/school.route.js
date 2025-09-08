const express = require("express");
const router = express.Router();
const schoolController = require('../controllers/school.controller');

// ✅ Route for getting all schools
router.get("/getSchool", schoolController.getAllSchools);
router.post("/addSchool",schoolController.addSchool);

module.exports = router;
