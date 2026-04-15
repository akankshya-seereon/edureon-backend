// src/instituteadmin/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Ensure this says 'reports' (plural) if that's what you want in the URL
router.get('/reports/generate', verifyToken, reportController.generateReport);

module.exports = router;