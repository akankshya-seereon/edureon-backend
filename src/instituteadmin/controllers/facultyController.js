const FacultyModel = require('../models/facultyModel');
const bcrypt = require('bcryptjs');

// Fetch existing faculty
exports.getAllFaculty = async (req, res) => {
  try {
    const instituteCode = req.user.code; 
    const faculty = await FacultyModel.getFacultyByInstitute(instituteCode);

    res.status(200).json({
      success: true,
      faculty: faculty
    });
  } catch (err) {
    console.error("Fetch Faculty Error:", err);
    res.status(500).json({ success: false, message: 'Server error fetching faculty' });
  }
};

// Add new faculty
exports.addFaculty = async (req, res) => {
  try {
    const { empId, name, email, password, designation, dept } = req.body;
    const instituteCode = req.user.code;

    if (!empId || !name || !email || !password || !designation || !dept) {
      return res.status(400).json({ success: false, message: "All fields, including email and password, are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await FacultyModel.createFaculty({
      institute_code: instituteCode,
      empId,
      name,
      email,
      password: hashedPassword, 
      designation,
      dept
    });

    res.status(201).json({ success: true, message: "Faculty added successfully!" });
  } catch (err) {
    console.error("Add Faculty Error:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Employee ID or Email already exists in the system." });
    }
    res.status(500).json({ success: false, message: "Error adding faculty member" });
  }
};

// Update existing faculty
exports.updateFaculty = async (req, res) => {
  try {
    const facultyId = req.params.id;
    const instituteCode = req.user.code;
    const updateData = req.body;

    // Call your model to update the database
    // Example: await db.execute('UPDATE faculty SET name=?, dept=?, designation=? WHERE id=? AND institute_code=?', [...])
    await FacultyModel.updateFaculty(facultyId, instituteCode, updateData);

    res.status(200).json({ success: true, message: "Faculty updated successfully!" });
  } catch (err) {
    console.error("Update Faculty Error:", err);
    res.status(500).json({ success: false, message: "Error updating faculty member" });
  }
};

// Delete faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const facultyId = req.params.id;
    const instituteCode = req.user.code;

    // Call your model to delete from the database
    // Example: await db.execute('DELETE FROM faculty WHERE id=? AND institute_code=?', [facultyId, instituteCode])
    await FacultyModel.deleteFaculty(facultyId, instituteCode);

    res.status(200).json({ success: true, message: "Faculty deleted successfully!" });
  } catch (err) {
    console.error("Delete Faculty Error:", err);
    res.status(500).json({ success: false, message: "Error deleting faculty member" });
  }
};