const express = require('express');
const router = express.Router();

// Import the MySQL controller
const authController = require('../controllers/authController'); 

// Route for student login (POST /api/student/auth/login)
router.post('/login', authController.login);

module.exports = router;