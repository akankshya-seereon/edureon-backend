// src/instituteadmin/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

//  THE FIX: We are now importing 'verifyToken' exactly as your file exports it!
const { verifyToken } = require('../middlewares/authMiddleware');

// The Route
router.get('/summary', verifyToken, dashboardController.getDashboardSummary);

module.exports = router;