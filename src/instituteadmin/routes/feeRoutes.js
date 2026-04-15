const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { verifyToken } = require('../middlewares/authMiddleware');

// ✅ UPDATED ROUTES TO MATCH YOUR POSTMAN REQUESTS
// Prefix in index.js: app.use('/api/admin/fees', feeRoutes);

router.get('/all', verifyToken, feeController.getStructures);       // GET /api/admin/fees/all
router.post('/create', verifyToken, feeController.addStructure);    // POST /api/admin/fees/create
router.put('/update/:id', verifyToken, feeController.updateStructure); // PUT /api/admin/fees/update/1
router.delete('/delete/:id', verifyToken, feeController.deleteStructure); // DELETE /api/admin/fees/delete/1

// Publish & History (For the new MySQL table we made)
router.post('/publish', verifyToken, feeController.publishFees);    // POST /api/admin/fees/publish

// Notification Routes
router.get('/notifications', verifyToken, feeController.getNotifications);
router.post('/notify', verifyToken, feeController.sendNotification);

module.exports = router;