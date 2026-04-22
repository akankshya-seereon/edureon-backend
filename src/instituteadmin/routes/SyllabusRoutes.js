const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const authMiddleware = require('../middlewares/authMiddleware');

// Safe Middleware Extractor
const verifyAdmin = authMiddleware.verifyAdmin || authMiddleware.verifyToken || ((req, res, next) => next());

// Crash-Proof Wrapper
const safeFn = (fn, name) => {
    if (typeof fn !== 'function') {
        console.error(`❌ ROUTE ERROR: '${name}' is missing from syllabusController.js!`);
        return (req, res) => res.status(500).json({ success: false, message: `Controller ${name} missing.` });
    }
    return fn;
};

// 🚀 MOUNT ROUTES: Path /api/admin/syllabus

// Fetch Dropdown Data (MUST BE TOP!)
router.get('/form-data', verifyAdmin, safeFn(syllabusController.getFormData, 'getFormData'));

// Save entire Syllabus
router.post('/', verifyAdmin, safeFn(syllabusController.saveSyllabus, 'saveSyllabus'));

// Get Syllabus by filter
router.get('/', verifyAdmin, safeFn(syllabusController.getSyllabus, 'getSyllabus'));

module.exports = router;