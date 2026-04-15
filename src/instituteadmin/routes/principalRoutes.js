const express = require('express');
const router = express.Router();
const principalController = require('../controllers/principalController');

// 🚀 FIXED: We are now importing 'verifyToken' exactly as you exported it!
const { verifyToken } = require('../middlewares/authMiddleware'); 

// Apply your JWT middleware to all routes below
router.use(verifyToken);

// GET /api/admin/principal/dashboard
router.get('/dashboard', principalController.getPrincipalDashboard);

// PUT /api/admin/principal/approvals/:id
router.put('/approvals/:id', principalController.handleApproval);

module.exports = router;