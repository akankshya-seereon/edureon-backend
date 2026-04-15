const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');

// 🚀 FIX: Import 'verifyStudent' instead of 'verifyToken'
const { verifyStudent } = require('../middlewares/authMiddleware');

// Secure route: Only logged-in students can access
router.use(verifyStudent); 

// GET /api/student/certificates
router.get('/', certificateController.getMyDocuments);

module.exports = router;