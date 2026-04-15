const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { verifyToken } = require('../middlewares/authMiddleware');

// ─── EXISTING ACADEMIC ROUTES ───
router.get('/departments', verifyToken, academicController.getDepartments);
router.post('/departments', verifyToken, academicController.addDepartment);

router.get('/courses', verifyToken, academicController.getCourses);
router.post('/courses', verifyToken, academicController.addCourse);

router.get('/syllabi', verifyToken, academicController.getSyllabi);
router.post('/syllabi', verifyToken, academicController.addSyllabus);

// ─── NEW ROUTES FOR "ASSIGN FACULTY" DROPDOWNS ───
// These match the 404 errors you saw in your terminal
router.get('/subjects', verifyToken, academicController.getAllSubjects);
router.get('/faculty', verifyToken, academicController.getAllFaculty);

module.exports = router;