const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { verifyToken } = require('../middlewares/authMiddleware');

// ✅ UPDATED ROUTES TO MATCH YOUR POSTMAN REQUESTS
// Prefix in index.js: app.use('/api/admin/fees', feeRoutes);

// ─── FEE STRUCTURES ──────────────────────────────────────────────────────────
router.get('/all', verifyToken, feeController.getStructures);       // GET /api/admin/fees/all
router.post('/create', verifyToken, feeController.addStructure);    // POST /api/admin/fees/create
router.put('/update/:id', verifyToken, feeController.updateStructure); // PUT /api/admin/fees/update/:id
router.delete('/delete/:id', verifyToken, feeController.deleteStructure); // DELETE /api/admin/fees/delete/:id

// ─── PUBLISH & HISTORY ───────────────────────────────────────────────────────
router.post('/publish', verifyToken, feeController.publishFees);    // POST /api/admin/fees/publish

// ─── NOTIFICATIONS & STUDENTS ────────────────────────────────────────────────
router.get('/notifications', verifyToken, feeController.getNotifications); // GET /api/admin/fees/notifications
router.post('/notify', verifyToken, feeController.sendNotification);       // POST /api/admin/fees/notify

// 🚀 CRITICAL FIX: Exposes the student fetcher for the React search bar!
router.get('/students', verifyToken, feeController.getFeeStudents);        // GET /api/admin/fees/students

module.exports = router;