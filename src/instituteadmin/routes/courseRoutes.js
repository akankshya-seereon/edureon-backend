const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Course Routes
router.get('/', verifyToken, courseController.getAllCourses);
router.post('/', verifyToken, courseController.addCourse);

// Subject Routes
router.get('/subjects', verifyToken, courseController.getAllSubjects);
router.post('/subjects', verifyToken, courseController.addSubject);

module.exports = router;