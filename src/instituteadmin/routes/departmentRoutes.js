const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// 🚀 Protect all routes using your middleware
const { verifyToken } = require('../middlewares/authMiddleware');
router.use(verifyToken);

// 🚀 Map the endpoints to the correct controller functions
router.get('/', departmentController.getDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment); 
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;