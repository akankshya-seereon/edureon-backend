const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const protect = require('../middlewares/authMiddlewares');

router.get('/dashboard-stats', protect, superAdminController.getDashboardStats);
router.get('/institutes', protect, superAdminController.getInstitutes);
router.get('/institutes/:id/full-details', protect, superAdminController.getInstituteFullDetails); // ← THIS WAS MISSING

module.exports = router;