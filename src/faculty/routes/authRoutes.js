const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/faculty/auth/login
router.post('/login', authController.login);

module.exports = router;