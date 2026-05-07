const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const examController = require('../controllers/examController');
const { verifyToken } = require('../middlewares/authMiddleware');

const uploadDir = path.join(__dirname, '../../../../uploads/question_papers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); 
  }
});
const upload = multer({ storage });

// ─── ROUTES ────────────────────────────────────────────────────────────

// 🚀 NEW: Get Form Data MUST be before /:id routes
router.get('/form-data', verifyToken, examController.getFormData);

router.get('/', verifyToken, examController.getExams);
router.post('/', verifyToken, upload.single('question_paper'), examController.addExam);

// 🚀 NEW: Update Route (PUT)
router.put('/:id', verifyToken, upload.single('question_paper'), examController.updateExam);

router.delete('/:id', verifyToken, examController.deleteExam);
router.get('/download/:id', verifyToken, examController.downloadPaper);

// ==========================================
// MARKS ENTRY ROUTES
// ==========================================
router.get('/:id/students', verifyToken, examController.getExamStudents);
router.post('/results', verifyToken, examController.saveResults);

module.exports = router;