const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyFaculty } = require('../Middlewares/authMiddleware'); 

// --- 1. Personal Faculty Attendance Routes (Existing) ---
router.get('/today', verifyFaculty, attendanceController.getTodayRecord);
router.get('/history', verifyFaculty, attendanceController.getAttendanceHistory);
router.post('/punch', verifyFaculty, attendanceController.handlePunch);

// --- 2. Class & Student Management Routes (NEW) ---
// Get subjects and classes assigned to this faculty
router.get('/assignments', verifyFaculty, attendanceController.getAssignments);

// Open a class session so students can mark attendance
router.post('/session/approve', verifyFaculty, attendanceController.createSession);

// Get list of students waiting for approval
router.get('/pending', verifyFaculty, attendanceController.getPendingStudents);

// Approve or reject a student's attendance
router.post('/verify', verifyFaculty, attendanceController.verifyStudent);

module.exports = router;