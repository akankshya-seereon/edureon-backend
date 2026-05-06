const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── MULTER SETUP FOR FILE UPLOADS ──────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../../uploads/syllabus');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const verifyAdmin = authMiddleware.verifyAdmin || authMiddleware.verifyToken || ((req, res, next) => next());

const safeFn = (fn, name) => {
    if (typeof fn !== 'function') {
        console.error(`❌ ROUTE ERROR: '${name}' is missing from syllabusController.js!`);
        return (req, res) => res.status(500).json({ success: false, message: `Controller ${name} missing.` });
    }
    return fn;
};

// ─── MOUNT ROUTES: Path /api/admin/syllabus ─────────────────────────────────
router.get('/form-data', verifyAdmin, safeFn(syllabusController.getFormData, 'getFormData'));

// 🚀 FIXED: Added multer middleware to capture 'syllabus_file'
router.post('/', verifyAdmin, upload.single('syllabus_file'), safeFn(syllabusController.saveSyllabus, 'saveSyllabus'));

// 🚀 FIXED: Added the PUT route to handle updates from the Edit Screen!
router.put('/:id', verifyAdmin, upload.single('syllabus_file'), safeFn(syllabusController.updateSyllabus, 'updateSyllabus'));

router.get('/', verifyAdmin, safeFn(syllabusController.getSyllabus, 'getSyllabus'));
router.delete('/:id', verifyAdmin, safeFn(syllabusController.deleteSyllabus, 'deleteSyllabus')); 

module.exports = router;