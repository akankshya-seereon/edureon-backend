// src/student/routes/feeRoutes.js
const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

// 🎯 FIXED: Changed 'Middlewares' to 'middlewares' (lowercase m)
const { verifyStudent } = require('../middlewares/authMiddleware'); 

router.get('/', verifyStudent, feeController.getStudentFees);
router.post('/pay', verifyStudent, feeController.payFee);

module.exports = router;