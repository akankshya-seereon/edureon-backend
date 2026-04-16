const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

/**
 * 🔒 AUTHENTICATION & CONTEXT MIDDLEWARES
 * Ensure the user is logged in and the institute context is captured.
 */
const { verifyToken } = require('../middlewares/authMiddleware');
// If you have a separate middleware to inject instituteId from the headers/JWT, 
// make sure it is included here.
router.use(verifyToken);

/**
 * 🏢 DEPARTMENT ROUTES
 * Base URL: /admin/departments (defined in your main server.js/app.js)
 */

// ─── READ ───
// Fetches all departments for the current institute (including HOD names)
router.get('/', departmentController.getDepartments);

// ─── CREATE ───
// Adds a new department and assigns an HOD (if provided)
router.post('/', departmentController.createDepartment);

// ─── UPDATE ───
// 🚀 Matches the frontend Inline Edit: PUT /admin/departments/:id
router.put('/:id', departmentController.updateDepartment);

// ─── DELETE ───
// Removes a department (Controller now handles if it's linked to other data)
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;