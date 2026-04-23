const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { verifyToken } = require('../middlewares/authMiddleware');

// --- 📋 BATCH MANAGEMENT (CRUD) ---

// Get all batches for the institute
router.get('/', verifyToken, batchController.getBatches);

// Get a single batch by ID
router.get('/:id', verifyToken, batchController.getBatchById);

// Create a new batch
router.post('/', verifyToken, batchController.createBatch);

// Delete a batch
router.delete('/:id', verifyToken, batchController.deleteBatch);

// --- 👥 STUDENT ASSIGNMENT ---

/**
 * 🚀 NEW ROUTE: Add students to a specific batch
 * Expects { studentIds: [1, 2, 3] } in the body
 */
router.post('/:batchId/students', verifyToken, batchController.addStudentsToBatch);

// --- ⚡ ADMIN POWER: CLASS & FACULTY ASSIGNMENT ---

/**
 * Triggers: Create Class + Auto-Enroll Batch Students + Faculty Assignment + Notifications
 */
router.post('/assign-faculty', verifyToken, batchController.assignFacultyToBatch);

module.exports = router;