const express = require('express');
const router = express.Router();
const academicProgramController = require('../controllers/academicprogramController');

// 🚀 1. IMPORT YOUR AUTHENTICATION MIDDLEWARE HERE
// If your function is named something else (like requireAuth), change it here!
const { verifyToken } = require('../middlewares/authMiddleware');

// 🚀 2. ADD THE MIDDLEWARE TO EVERY ROUTE

// --- 🏢 INFRASTRUCTURE ROUTES ---
router.get('/buildings', verifyToken, academicProgramController.getBuildings);

// --- 🎓 GET FULL NESTED TREE (Courses + Specs + Batches) ---
// This is the route your frontend was crashing on!
router.get('/', verifyToken, academicProgramController.getPrograms);

// --- 📚 COURSE ROUTES ---
router.post('/courses', verifyToken, academicProgramController.createCourse);
router.put('/courses/:id', verifyToken, academicProgramController.updateCourse);
router.delete('/courses/:id', verifyToken, academicProgramController.deleteCourse);

// --- 🎯 SPECIALIZATION ROUTES ---
router.post('/specializations', verifyToken, academicProgramController.createSpecialization);
router.put('/specializations/:id', verifyToken, academicProgramController.updateSpecialization);
router.delete('/specializations/:id', verifyToken, academicProgramController.deleteSpecialization);

// --- 📅 BATCH ROUTES ---
router.post('/batches', verifyToken, academicProgramController.createBatch);
router.put('/batches/:id', verifyToken, academicProgramController.updateBatch);
router.delete('/batches/:id', verifyToken, academicProgramController.deleteBatch);

module.exports = router;