const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { verifyToken } = require('../middlewares/authMiddleware');

// ---  BATCH MANAGEMENT (CRUD) ---
router.get('/', verifyToken, batchController.getBatches);
router.get('/:id', verifyToken, batchController.getBatchById);
router.post('/', verifyToken, batchController.createBatch);
router.delete('/:id', verifyToken, batchController.deleteBatch);

// ---  ADMIN POWER: CLASS & FACULTY ASSIGNMENT ---
// This route triggers the "Assign Faculty + Create Class + Blast Notifications" logic
router.post('/assign-faculty', verifyToken, batchController.assignFacultyToBatch);

module.exports = router;