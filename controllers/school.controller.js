const School = require('../models/school.model');

//add school
exports.addSchool = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "School name is required",
      });
    }

    // Normalize just for duplicate check
    const normalizedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

    // Check if already exists
    const existing = await School.findOne({ name: normalizedName });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "School already exists",
      });
    }

    // Save (pre-save hook will format it)
    const school = await School.create({ name });

    res.status(201).json({
      success: true,
      message: "School added successfully",
      school,
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



// ✅ Controller: Get all schools alphabetically
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ name: 1 }).lean();

    const transformedSchools = schools.map((school) => ({
      ...school,
      name: school.name ? school.name.toUpperCase() : "",
    }));

    res.json({
      success: true,
      schools: transformedSchools,
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



//testing will delete it soon
const xlsx = require("xlsx");

exports.uploadSchools = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Convert buffer → workbook
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0]; // First sheet
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData.length) {
      return res.status(400).json({ success: false, message: "Excel file is empty" });
    }

    let inserted = [];
    let skipped = [];

    for (let row of sheetData) {
      const schoolName = row["School Name"]?.trim();
      if (schoolName) {
        try {
          const newSchool = new School({
            name: schoolName,
            isNewAdded: false,
          });
          await newSchool.save();
          inserted.push(schoolName);
        } catch (err) {
          // Duplicate or validation error → skip
          skipped.push(schoolName);
        }
      }
    }

    res.json({
      success: true,
      message: "File processed successfully",
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};