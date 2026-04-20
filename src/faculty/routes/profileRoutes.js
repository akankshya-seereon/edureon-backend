const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// 🚀 PATH CHECK: Ensure the casing matches your folder "Middlewares" (capital M)
const { verifyFaculty } = require('../Middlewares/authMiddleware');


router.get('/me', verifyFaculty, profileController.getProfile); 

// Fallback for just GET /api/faculty/profile
router.get('/', verifyFaculty, profileController.getProfile); 

// 📍 PUT: Update profile details (firstName, lastName, mobile, etc.)
// Endpoint: PUT /api/faculty/profile/update
router.put('/update', verifyFaculty, profileController.updateProfile);

// 📍 PUT: Security - Change account password
// Endpoint: PUT /api/faculty/profile/change-password
router.put('/change-password', verifyFaculty, profileController.changePassword);

module.exports = router;