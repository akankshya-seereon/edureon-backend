const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Ensure this path matches exactly where your auth middleware is located
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, attendanceController.getAttendance);
router.post('/', verifyToken, attendanceController.saveAttendance);

module.exports = router;