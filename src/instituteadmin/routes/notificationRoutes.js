const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/notifications', verifyToken, notificationController.getNotifications);
router.post('/notifications', verifyToken, notificationController.createNotification);

module.exports = router;