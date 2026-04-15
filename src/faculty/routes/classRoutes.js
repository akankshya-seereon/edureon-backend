const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyFaculty } = require('../Middlewares/authMiddleware');

// Main list of classes
router.get('/my-classes', verifyFaculty, classController.getMyClasses);

// Class Detail Endpoints
router.get('/:classId/students', verifyFaculty, classController.getClassStudents);
router.post('/:classId/attendance', verifyFaculty, classController.saveAttendance);
router.get('/:classId/assignments', verifyFaculty, classController.getAssignments);

module.exports = router;