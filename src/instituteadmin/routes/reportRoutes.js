const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// 🚀 THE FIX: Changed 'verifyAdmin' to 'verifyToken' 
// (If your file exports something else like 'verifyInstituteAdmin', use that instead!)
const { verifyToken } = require('../middlewares/authMiddleware');

/**
 * 🔐 BASE URL: /api/admin/reports (Set in index.js)
 */

// 📍 1. GET: Generate the actual report data
router.get('/generate', verifyToken, reportController.generateReport);

// 📍 2. GET: Fetch dynamic courses and departments for React Dropdowns
router.get('/filters', verifyToken, reportController.getFilterOptions);

module.exports = router;