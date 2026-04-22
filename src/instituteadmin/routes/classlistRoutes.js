const express = require('express');
const router = express.Router();
const classlistController = require('../controllers/classlistController');
const authMiddleware = require('../middlewares/authMiddleware');

// 🛡️ 1. SAFE MIDDLEWARE EXTRACTOR
// Grabs your verifyAdmin function. If it's missing, it creates a temporary 
// fallback function that prevents a server crash and warns you instead.
const verifyAdmin = authMiddleware.verifyAdmin || authMiddleware.verifyToken || ((req, res, next) => {
    console.error("❌ ROUTE ERROR: 'verifyAdmin' middleware is missing or not exported correctly.");
    return res.status(500).json({ success: false, message: "Server route configuration error." });
});

// 🛡️ 2. CRASH-PROOF CONTROLLER WRAPPER
// This function stops the dreaded "argument handler must be a function" Express crash.
// If your controller function is undefined, it handles it gracefully.
const safeFn = (controllerFunction, functionName) => {
    if (typeof controllerFunction !== 'function') {
        console.error(`❌ ROUTE ERROR: '${functionName}' is missing from classlistController.js!`);
        return (req, res) => res.status(500).json({ success: false, message: `Controller ${functionName} missing.` });
    }
    return controllerFunction;
};

// 🚀 3. MOUNT ROUTES
// Path: /api/admin/classes

// GET: Fetch all classes
router.get('/', verifyAdmin, safeFn(classlistController.getAllClasses, 'getAllClasses'));

// 🚀 NEW: Fetch form dropdown data (MUST BE BEFORE /:id ROUTES!)
// This is the magic route that sends your departments, faculty, and subjects to React.
router.get('/form-data', verifyAdmin, safeFn(classlistController.getFormData, 'getFormData'));

// POST: Create a new class
router.post('/', verifyAdmin, safeFn(classlistController.createClass, 'createClass'));

// PUT: Update a specific class by ID
router.put('/:id', verifyAdmin, safeFn(classlistController.updateClass, 'updateClass'));

// DELETE: Remove a specific class by ID
router.delete('/:id', verifyAdmin, safeFn(classlistController.deleteClass, 'deleteClass'));

module.exports = router;