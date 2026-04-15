const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyFaculty } = require('../Middlewares/authMiddleware');

/**
 * 🔐 ALL ROUTES BELOW REQUIRE FACULTY AUTHENTICATION
 * The 'verifyFaculty' middleware ensures a valid cookie/token exists
 * and attaches the faculty user object to 'req.user'.
 */

// 📍 GET: Fetch the logged-in faculty's profile 
// Endpoints: GET /api/faculty/profile OR GET /api/faculty/profile/me
router.get('/', verifyFaculty, profileController.getProfile); 
router.get('/me', verifyFaculty, profileController.getProfile); 

// 📍 PUT: Update profile details (Name, Mobile, Skills, etc.)
// Endpoint: PUT /api/faculty/profile/update
router.put('/update', verifyFaculty, profileController.updateProfile);

// 📍 PUT: Security - Change account password
// Endpoint: PUT /api/faculty/profile/change-password
router.put('/change-password', verifyFaculty, profileController.changePassword);

module.exports = router;