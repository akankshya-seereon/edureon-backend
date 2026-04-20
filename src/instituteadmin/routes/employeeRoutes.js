const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── 1. SECURE UPLOAD DIRECTORY SETUP ───
// Using path.resolve to ensure the path is always correct from the project root
const uploadDir = path.resolve(__dirname, '../../../uploads/employee_docs');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Created upload directory at: ${uploadDir}`);
}

// ─── 2. MULTER STORAGE CONFIGURATION ───
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generates a clean, unique filename: e.g., profilePhoto-1678901234-87654321.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    }
});

// ─── 3. FILE TYPE FILTER (Security) ───
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('INVALID_FILE_TYPE')); // Custom error trigger
    }
};

// ─── 4. MULTER UPLOAD INSTANCE ───
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB limit per file
    } 
});

// Map exact field names from the Frontend FormData
const uploadFields = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 },
    { name: 'experienceLetter', maxCount: 1 },
    { name: 'otherDocs', maxCount: 10 } 
]);

// ─── 5. ERROR HANDLING WRAPPER ───
// This catches Multer errors before they crash the controller
const handleUpload = (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: "File is too large. Maximum size is 5MB." });
            }
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            if (err.message === 'INVALID_FILE_TYPE') {
                return res.status(400).json({ success: false, message: "Only .png, .jpg, .jpeg, .webp and .pdf formats are allowed!" });
            }
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// ══════════════════════════════════════════════════════════════════════
// ─── API ROUTES ───
// ══════════════════════════════════════════════════════════════════════

// POST: Register New Employee (Handles Files + Data)
router.post('/register', handleUpload, employeeController.registerEmployee);

// GET: List All Employees (MUST be placed above '/:id' to prevent route conflicts)
router.get('/list', employeeController.getAllEmployees);

// GET: Fetch Single Employee Profile by ID
router.get('/:id', employeeController.getEmployeeById);

// PUT: Update Existing Employee (Handles Files + Data)
router.put('/:id', handleUpload, employeeController.updateEmployee);

// DELETE: Remove an Employee
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;