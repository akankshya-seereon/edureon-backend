const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const authMiddleware = require('../middlewares/authMiddleware');

const verifyAdmin = authMiddleware.verifyAdmin || authMiddleware.verifyToken || ((req, res, next) => next());

const safeFn = (fn, name) => {
    if (typeof fn !== 'function') {
        console.error(` ROUTE ERROR: '${name}' is missing from syllabusController.js!`);
        return (req, res) => res.status(500).json({ success: false, message: `Controller ${name} missing.` });
    }
    return fn;
};

//  MOUNT ROUTES: Path /api/admin/syllabus
router.get('/form-data', verifyAdmin, safeFn(syllabusController.getFormData, 'getFormData'));
router.post('/', verifyAdmin, safeFn(syllabusController.saveSyllabus, 'saveSyllabus'));
router.get('/', verifyAdmin, safeFn(syllabusController.getSyllabus, 'getSyllabus'));
router.delete('/:id', verifyAdmin, safeFn(syllabusController.deleteSyllabus, 'deleteSyllabus')); // Delete added

module.exports = router;