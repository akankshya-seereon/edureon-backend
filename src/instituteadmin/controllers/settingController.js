const SettingModel = require('../models/settingModel');
const bcrypt = require('bcryptjs');

// ─── Helper: resolve correct institute ID ────────────────────────────────────
// ALWAYS use institute_id first (set by impersonation middleware),
// then fall back to id (the logged-in user's own row ID).
// ❌ NEVER do:  req.user.id || req.user.institute_id
// ✅ ALWAYS do: req.user.institute_id || req.user.id
const getInstituteId = (req) => req.user.institute_id || req.user.id;

/**
 * GET INSTITUTE PROFILE
 */
exports.getProfile = async (req, res) => {
  try {
    const instituteId = getInstituteId(req); // ✅ FIXED

    console.log(`[getProfile] role=${req.user.role} | resolved instituteId=${instituteId}`);

    const rawProfile = await SettingModel.getProfile(instituteId);

    if (!rawProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const parseData = (data) => {
      if (!data) return null;
      if (typeof data === 'string') return JSON.parse(data);
      return data;
    };

    const formattedInstitute = {
      id: rawProfile.institute_code || "N/A",
      status: rawProfile.status || "Active",
      plan: rawProfile.plan || "Premium",
      createdAt: rawProfile.created_at,
      organisation: parseData(rawProfile.organisation) || {},
      directors: parseData(rawProfile.directors) || [],
      legal: parseData(rawProfile.legal) || {},
      branches: parseData(rawProfile.branches) || []
    };

    if (!formattedInstitute.organisation.name) {
      formattedInstitute.organisation.name = rawProfile.admin_name || "Unnamed Institute";
    }
    if (!formattedInstitute.organisation.email) {
      formattedInstitute.organisation.email = rawProfile.admin_email;
    }

    res.json({ success: true, institute: formattedInstitute });

  } catch (err) {
    console.error("Controller Error (getProfile):", err);
    res.status(500).json({ success: false, message: "Failed to fetch institute data" });
  }
};

/**
 * UPDATE ADMIN PROFILE
 */
exports.updateProfile = async (req, res) => {
  try {
    const instituteId = getInstituteId(req); // ✅ FIXED

    const { admin_name, admin_email, admin_phone } = req.body;

    if (!admin_name || !admin_email) {
      return res.status(400).json({ success: false, message: "Name and Email are required" });
    }

    await SettingModel.updateProfile(instituteId, { admin_name, admin_email, admin_phone });

    res.json({ success: true, message: "Admin profile updated successfully" });
  } catch (err) {
    console.error("Controller Error (updateProfile):", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/**
 * UPDATE PASSWORD
 */
exports.updatePassword = async (req, res) => {
  try {
    const instituteId = getInstituteId(req); // ✅ FIXED

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await SettingModel.getAuthDetails(instituteId);
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await SettingModel.updatePassword(instituteId, hashedPassword);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Controller Error (updatePassword):", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};