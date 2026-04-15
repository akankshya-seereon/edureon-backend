const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path'); //  1. IMPORT NODE'S PATH MODULE
const assignmentController = require('../controllers/assignmentController');
const { verifyFaculty } = require('../Middlewares/authMiddleware');

//  2. FORCE AN ABSOLUTE PATH (This tells Node exactly where your server folder is)
const uploadDir = path.join(__dirname, '../uploads/assignments');

// 1. Configure Multer for attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //  3. AUTO-CREATE USING THE ABSOLUTE PATH
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); 
    }
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// 2. Define the Routes
router.get('/', verifyFaculty, assignmentController.getAssignments);
router.post('/', verifyFaculty, upload.single('file'), assignmentController.createAssignment);

module.exports = router; 