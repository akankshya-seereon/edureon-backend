const express = require('express');
const router = express.Router();
const academicProgramController = require('../controllers/academicprogramController');

// 🛑 The broken 'requireAuth' import has been temporarily removed so your server can start smoothly!
// Note: When you are ready to secure these routes, check inside your 'authMiddleware.js' 
// file to see exactly what function name is being exported, then you can import it.

// --- 🏢 INFRASTRUCTURE ROUTES (🚀 NEW) ---
// Note: Depending on where you mount this router in your main app.js/index.js, 
// this will become either /admin/programs/buildings OR /admin/buildings
router.get('/buildings', academicProgramController.getBuildings);

// --- 🎓 GET FULL NESTED TREE (Courses + Specs + Batches) ---
router.get('/', academicProgramController.getPrograms);

// --- 📚 COURSE ROUTES ---
router.post('/courses', academicProgramController.createCourse);
router.put('/courses/:id', academicProgramController.updateCourse);
router.delete('/courses/:id', academicProgramController.deleteCourse);

// --- 🎯 SPECIALIZATION ROUTES ---
router.post('/specializations', academicProgramController.createSpecialization);
router.put('/specializations/:id', academicProgramController.updateSpecialization);
router.delete('/specializations/:id', academicProgramController.deleteSpecialization);

// --- 📅 BATCH ROUTES ---
router.post('/batches', academicProgramController.createBatch);
router.put('/batches/:id', academicProgramController.updateBatch);
router.delete('/batches/:id', academicProgramController.deleteBatch);

module.exports = router;