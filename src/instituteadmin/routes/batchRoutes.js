const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { verifyToken } = require('../middlewares/authMiddleware');

// --- ⚡ ADMIN POWER: CLASS & FACULTY ASSIGNMENT ---
// 🚀 FIXED: Moved static routes to the top to prevent Express routing conflicts with /:id
/**
 * Triggers: Create Class + Auto-Enroll Batch Students + Faculty Assignment + Notifications
 */
router.post('/assign-faculty', verifyToken, batchController.assignFacultyToBatch);


// --- 📋 BATCH MANAGEMENT (CRUD) ---

// Get all batches for the institute
router.get('/', verifyToken, batchController.getBatches);

// Create a new batch
router.post('/', verifyToken, batchController.createBatch);

// Get a single batch by ID
router.get('/:id', verifyToken, batchController.getBatchById);

// Delete a batch
router.delete('/:id', verifyToken, batchController.deleteBatch);


// --- 👥 STUDENT ASSIGNMENT ---

/**
 * 🚀 NEW ROUTE: Add students to a specific batch
 * Expects { studentIds: [1, 2, 3] } in the body
 */
router.post('/:batchId/students', verifyToken, batchController.addStudentsToBatch);


module.exports = router;