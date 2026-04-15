const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

//  Import the exact function name revealed by our debug logs!
const { verifyFaculty } = require('../Middlewares/authMiddleware'); 

// --- Routes ---
router.get('/', verifyFaculty, notificationController.getNotifications);
router.put('/read-all', verifyFaculty, notificationController.markAllAsRead);
router.put('/:id/read', verifyFaculty, notificationController.markAsRead);

module.exports = router;