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
    const schools = await School.find().sort({ name: 1 }); // ASC order
    res.json({
      success: true,
      schools,
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
