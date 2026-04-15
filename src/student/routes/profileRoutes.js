const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// 🌟 IMPORTANT: Import your student verification middleware
const { verifyStudent } = require('../middlewares/authMiddleware');

// GET /api/student/profile
router.get('/', verifyStudent, profileController.getProfile);

module.exports = router;