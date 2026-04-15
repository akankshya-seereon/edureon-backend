// src/student/routes/examRoutes.js
const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../Middlewares/authMiddleware'); 

// Safely grab the middleware (we saw it was named verifyStudent in your previous logs!)
const protectRoute = authMiddleware.verifyStudent || authMiddleware.verifyToken;

// --- Routes ---
router.get('/upcoming', protectRoute, examController.getUpcomingExams);
router.get('/results', protectRoute, examController.getExamResults);

module.exports = router;