const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyStudent } = require('../middlewares/authMiddleware'); // Your JWT middleware

// GET /api/student/dashboard
router.get('/', verifyStudent, dashboardController.getStudentDashboard);

module.exports = router;