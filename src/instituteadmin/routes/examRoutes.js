const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const examController = require('../controllers/examController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../../../../uploads/question_papers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save to our new folder
  },
  filename: (req, file, cb) => {
    // Add a timestamp to the filename to prevent overwriting
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); 
  }
});
const upload = multer({ storage });

// ─── ROUTES ────────────────────────────────────────────────────────────

router.get('/', verifyToken, examController.getExams);

// 🚀 POST now uses multer to catch 'question_paper'
router.post('/', verifyToken, upload.single('question_paper'), examController.addExam);

router.delete('/:id', verifyToken, examController.deleteExam);

// Route specifically for downloading the PDF
router.get('/download/:id', verifyToken, examController.downloadPaper);

// ==========================================
// 🚀 NEW: MARKS ENTRY ROUTES
// ==========================================

// 1. Fetch students for a specific exam's batch
router.get('/:id/students', verifyToken, examController.getExamStudents);

// 2. Save the array of student marks
router.post('/results', verifyToken, examController.saveResults);

module.exports = router;