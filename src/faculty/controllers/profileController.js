const FacultyProfile = require('../model/profileModel');
const bcrypt = require('bcryptjs');

/**
 * 1. GET: Fetch Profile Data
 * Endpoint: GET /api/faculty/profile/me
 */
exports.getProfile = async (req, res) => {
  try {
    // 🚀 SAFETY CHECK: Ensure middleware is passing the user ID
    if (!req.user || !req.user.id) {
      console.error("Auth Error: req.user.id is missing. Check your middleware!");
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
    }

    const facultyId = req.user.id; 
    console.log(`Attempting to fetch profile for ID: ${facultyId}`);

    const facultyData = await FacultyProfile.findById(facultyId);

    if (!facultyData) {
      console.error(`Profile Fail: No employee found with ID ${facultyId}`);
      return res.status(404).json({ 
        success: false, 
        message: "Profile not found. Please re-login." 
      });
    }

    // 🚀 NAME BRIDGE: Ensure 'fullName' exists for the frontend
    // Use the aliased fullName from the model, or fallback to manual concat
    const firstName = facultyData.firstName || "";
    const lastName = facultyData.lastName || "";
    facultyData.fullName = facultyData.fullName || `${firstName} ${lastName}`.trim() || "Faculty Member";

    // 🚀 SPECIALIZATIONS SAFETY: Handle JSON parsing and nulls
    if (facultyData.specializations) {
      if (typeof facultyData.specializations === 'string') {
        try {
          // If it's a JSON string like "['Math', 'Science']", parse it.
          // If it's a simple string like "Math, Science", catch the error and keep it as is.
          facultyData.specializations = JSON.parse(facultyData.specializations);
        } catch (e) {
          facultyData.specializations = facultyData.specializations.split(',').map(s => s.trim());
        }
      }
    } else {
      facultyData.specializations = [];
    }

    // 🚀 EXPERIENCE SAFETY: Ensure it's at least a string for the UI
    facultyData.experience = facultyData.experience || "0";

    console.log(`Profile successfully fetched for: ${facultyData.email}`);
    res.json({ success: true, data: facultyData });

  } catch (err) {
    console.error("FATAL CONTROLLER ERROR:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: err.message 
    });
  }
};

/**
 * 2. PUT: Update Profile
 * Endpoint: PUT /api/faculty/profile/update
 */
exports.updateProfile = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { fullName, email, mobile, qualification, address } = req.body;

    // 🚀 THE BRIDGE: Prepare payload for 'employees' table
    // MySQL 'employees' table uses firstName/lastName and phone.
    // React frontend sends fullName and mobile.
    
    let updatePayload = {};

    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      updatePayload.firstName = nameParts[0];
      updatePayload.lastName = nameParts.slice(1).join(" ") || "";
    }

    if (email) updatePayload.email = email;
    if (mobile) updatePayload.phone = mobile; // Map mobile to phone column
    if (qualification) updatePayload.qualification = qualification;
    if (address) updatePayload.address = address;

    // 🎯 VALIDATION: Ensure we aren't sending an empty object to prevent SQL syntax errors
    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    const result = await FacultyProfile.update(facultyId, updatePayload);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found or no changes made." });
    }

    console.log(`Profile updated for Faculty ID: ${facultyId}`);
    res.json({ success: true, message: "Profile updated successfully" });

  } catch (err) {
    console.error("Update Profile Error:", err.sqlMessage || err.message);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update profile", 
      error: err.sqlMessage || err.message 
    });
  }
};

/**
 * 3. PUT: Change Password
 * Endpoint: PUT /api/faculty/profile/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { current, newPass } = req.body;

    if (!current || !newPass) {
      return res.status(400).json({ 
        success: false, 
        message: "Current and new passwords are required." 
      });
    }

    // This lookup now targets the 'employees' table via the model
    const user = await FacultyProfile.getPasswordHash(facultyId);
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User security record not found." });
    }

    // Verify against existing hash
    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "The current password you entered is incorrect." });
    }

    // Create new hash
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);
    
    await FacultyProfile.updatePassword(facultyId, newHash);

    console.log(`Password securely changed for ID: ${facultyId}`);
    res.json({ success: true, message: "Password updated successfully." });

  } catch (err) {
    console.error("Change Password Error:", err.message);
    res.status(500).json({ success: false, message: "Server error during password update." });
  }
};