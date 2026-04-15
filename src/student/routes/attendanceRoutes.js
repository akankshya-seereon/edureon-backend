const express = require('express');
const router = express.Router();
const attCtrl = require('../controllers/attendanceController');

//  Middleware: Ensure this 'protect' function allows BOTH Faculty and Students
// If it only allows students, your Faculty Portal will hit 403 Forbidden errors!
const { verifyStudent: protect } = require('../middlewares/authMiddleware.js'); 

// ─── 1. SHARED ROUTES ─────────────────────────────────────────────
// Used by both Faculty and Students to check their personal workday status
router.get('/punch-status', protect, attCtrl.getPunchStatus);


// ─── 2. FACULTY PORTAL ROUTES ─────────────────────────────────────

// Personal Workday Punch (IN/OUT for the teacher)
router.post('/punch', protect, attCtrl.punchAttendance);

// Setup: Get list of Subjects/Classes assigned to the teacher (for dropdowns)
router.get('/assignments', protect, attCtrl.getFacultyAssignments);

// Session Control: "Start Class" (Broadcasts session to students)
router.post('/session/approve', protect, attCtrl.approveSession);

// Session History: View all classes this teacher has conducted
router.get('/sessions/history', protect, attCtrl.getSessionHistory);

// Student Management: The "Waiting Room" for pending attendance requests
router.get('/pending', protect, attCtrl.getPendingApprovals);

// Student Management: The "Approve/Reject" action for a student
router.post('/verify', protect, attCtrl.verifyAttendance);


// ─── 3. STUDENT PORTAL ROUTES ─────────────────────────────────────

// Discovery: See which classes are "Open" for attendance right now
router.get('/sessions/available', protect, attCtrl.getAvailableSessions);

// Action: Click "Mark Present" (Sends request to Faculty's 'pending' list)
router.post('/mark', protect, attCtrl.markAttendance);

// Personal History: Student's own record of Present/Absent/Pending days
router.get('/history', protect, attCtrl.getAttendanceHistory);

module.exports = router;