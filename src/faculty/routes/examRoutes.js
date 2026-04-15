const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyFaculty } = require('../Middlewares/authMiddleware'); // Check if this should be lowercase 'middlewares' based on your folder structure!

// Fetch all exams (Dropdown) - 🚀 Changed to getExams
router.get('/', verifyFaculty, examController.getExams);

// Create a new exam - 🚀 Changed to addExam
router.post('/', verifyFaculty, examController.addExam);

// Fetch students for a specific exam - Matches perfectly!
router.get('/:id/students', verifyFaculty, examController.getExamStudents);

// Submit marks for an exam - 🚀 Changed to saveResults
router.post('/:id/marks', verifyFaculty, examController.saveResults);

// (Optional) Delete an exam if a teacher makes a mistake
router.delete('/:id', verifyFaculty, examController.deleteExam);

module.exports = router;