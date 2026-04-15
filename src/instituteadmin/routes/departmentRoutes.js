const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// 🚀 Match the name EXACTLY as it is exported in your middleware file
const { verifyToken } = require('../middlewares/authMiddleware');

// Protect all routes using the Master Key middleware
router.use(verifyToken);

router.get('/', departmentController.getDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment); // 🚀 NEW: Update Route
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;