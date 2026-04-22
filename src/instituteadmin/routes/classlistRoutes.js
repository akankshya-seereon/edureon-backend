const express = require('express');
const router = express.Router();
const classlistController = require('../controllers/classlistController');
const authMiddleware = require('../middlewares/authMiddleware');

// 🛡️ 1. SAFE MIDDLEWARE EXTRACTOR
// Grabs your verifyAdmin or verifyToken function. Prevents server crash if missing.
const verifyAdmin = authMiddleware.verifyAdmin || authMiddleware.verifyToken || ((req, res, next) => {
    console.error("❌ ROUTE ERROR: Authentication middleware is missing or not exported correctly.");
    return res.status(500).json({ success: false, message: "Server route configuration error." });
});

// 🛡️ 2. CRASH-PROOF CONTROLLER WRAPPER
// Stops the "argument handler must be a function" Express crash.
const safeFn = (controllerFunction, functionName) => {
    if (typeof controllerFunction !== 'function') {
        console.error(`❌ ROUTE ERROR: '${functionName}' is missing from classlistController.js!`);
        return (req, res) => res.status(500).json({ success: false, message: `Controller ${functionName} missing on server.` });
    }
    return controllerFunction;
};

// 🚀 3. MOUNT ROUTES
// Base Path mapped in app.js: /api/admin/classes

// ==========================================
// ⚠️ STATIC ROUTES (MUST GO BEFORE /:id)
// ==========================================

// Fetch form dropdown data (Departments, Programs, Subjects, Faculty)
router.get('/form-data', verifyAdmin, safeFn(classlistController.getFormData, 'getFormData'));

// Fetch all classes
router.get('/', verifyAdmin, safeFn(classlistController.getAllClasses, 'getAllClasses'));

// Create a new class
router.post('/', verifyAdmin, safeFn(classlistController.createClass, 'createClass'));

// ==========================================
// ⚠️ DYNAMIC ID ROUTES (MUST GO LAST)
// ==========================================

// Update a specific class by ID
router.put('/:id', verifyAdmin, safeFn(classlistController.updateClass, 'updateClass'));

// Delete a specific class by ID
router.delete('/:id', verifyAdmin, safeFn(classlistController.deleteClass, 'deleteClass'));


module.exports = router;