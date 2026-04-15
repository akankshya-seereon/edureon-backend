const FacultyProfile = require('../model/profileModel');
const bcrypt = require('bcryptjs');

// 1. GET: Fetch Profile Data
exports.getProfile = async (req, res) => {
  try {
    const facultyId = req.user.id; 

    const facultyData = await FacultyProfile.findById(facultyId);

    if (!facultyData) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }
    
    // Ensure specializations is an array (even if null in DB)
    if (typeof facultyData.specializations === 'string') {
        try {
            facultyData.specializations = JSON.parse(facultyData.specializations);
        } catch (e) {
            facultyData.specializations = [];
        }
    }
    facultyData.specializations = facultyData.specializations || [];

    res.json({ success: true, data: facultyData });
  } catch (err) {
    console.error("Fetch Profile Error:", err.sqlMessage || err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. PUT: Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    await FacultyProfile.update(facultyId, req.body);

    console.log(`Profile updated for Faculty ID: ${facultyId}`);
    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    // 🎯 FIXED: This will now print the EXACT MySQL error in your VS Code terminal!
    console.error("Update Profile Error:", err.sqlMessage || err.message);
    res.status(500).json({ success: false, message: "Server Error", error: err.sqlMessage });
  }
};

// 3. PUT: Change Password
exports.changePassword = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { current, newPass } = req.body;

    if (!current || !newPass) {
      return res.status(400).json({ success: false, message: "Please provide both current and new passwords" });
    }

    const user = await FacultyProfile.getPasswordHash(facultyId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);
    
    await FacultyProfile.updatePassword(facultyId, newHash);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change Password Error:", err.sqlMessage || err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};