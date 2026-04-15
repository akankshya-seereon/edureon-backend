const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Ensure upload directory exists
// 🚀 FIX: Changed to 3 levels up to correctly target 'server/uploads/employee_docs'
const uploadDir = path.join(__dirname, '../../../uploads/employee_docs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Creates a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 3. File Filter (Security: Only allow images and PDFs)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, .jpeg, .webp and .pdf formats allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 4. Define expected file fields from the Employee.jsx UI
// 🚀 FIX: Added 'otherDocs' so Multer doesn't crash when extra files are uploaded!
const uploadFields = upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 },
    { name: 'experienceLetter', maxCount: 1 },
    { name: 'otherDocs', maxCount: 10 } // <-- MUST BE HERE
]);

// 5. POST Route with Error Handling Middleware
router.post('/register', (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Error:", err);
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            console.error("Unknown Upload Error:", err);
            return res.status(400).json({ success: false, message: err.message });
        }
        // Everything went fine, proceed to controller
        next();
    });
}, employeeController.registerEmployee);

// 6. 🚀 NEW: GET Route for listing (Used by Department.jsx HOD Dropdown)
router.get('/list', employeeController.getAllEmployees);

module.exports = router;