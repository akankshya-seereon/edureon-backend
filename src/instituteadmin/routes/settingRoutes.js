const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

// Import your auth middleware
// Note: Ensure this matches the function name in your authMiddleware.js (verifyToken or protect)
const { verifyToken } = require('../middlewares/authMiddleware');

/**
 * 🏢 INSTITUTE PROFILE ROUTES
 * These routes handle the "Institute Dashboard" and "Settings" pages
 */

// GET: Fetch full institute profile (Organisation, Directors, Legal, etc.)
// Frontend Call: api.get('/admin/settings/profile')
router.get('/profile', verifyToken, settingController.getProfile);

// PUT: Update Admin Personal Details (Name, Email, Phone)
// Frontend Call: api.put('/admin/settings/profile', data)
router.put('/profile', verifyToken, settingController.updateProfile);

// PUT: Update Admin Security Credentials (Password)
// Frontend Call: api.put('/admin/settings/password', data)
router.put('/password', verifyToken, settingController.updatePassword);

/**
 * 💡 ROUTE ALIAS (Optional)
 * If your frontend still calls '/api/admin/institute/profile' instead of '/settings/profile',
 * adding this line will prevent 404 errors without changing frontend code.
 */
router.get('/institute-info', verifyToken, settingController.getProfile);

module.exports = router;