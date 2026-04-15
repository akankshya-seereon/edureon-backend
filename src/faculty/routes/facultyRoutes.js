const express = require('express');
const router = express.Router();
const multer = require('multer'); 

// 1. IMPORT CONTROLLERS
const dashboardController = require('../controllers/dashboardController');
const attendanceController = require('../controllers/attendanceController');
const profileController = require('../controllers/profileController');
const courseController = require('../controllers/courseController'); 
const assignmentController = require('../controllers/assignmentController');
const salaryController = require('../controllers/salaryController');

// 🚀 IMPORT YOUR DEDICATED EXAM ROUTER
const examRoutes = require('./examRoutes'); // Adjust path if needed

// 2. IMPORT MIDDLEWARE
const { verifyFaculty } = require('../Middlewares/authMiddleware'); 

// 3. CONFIGURE FILE UPLOADS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- DASHBOARD ---
router.get('/dashboard', verifyFaculty, dashboardController.getDashboardData);

// --- ATTENDANCE ---
router.get('/attendance/today', verifyFaculty, attendanceController.getTodayRecord);
router.post('/attendance/punch', verifyFaculty, attendanceController.handlePunch);
router.get('/attendance/history', verifyFaculty, attendanceController.getAttendanceHistory);

// --- PROFILE ---
router.get('/profile', verifyFaculty, profileController.getProfile);

// --- COURSE MANAGEMENT ---
router.get('/courses', verifyFaculty, courseController.getMyCourses);           
router.get('/courses/:id', verifyFaculty, courseController.getCourseById);      
router.post('/courses', verifyFaculty, courseController.createCourse);          
router.delete('/courses/:id', verifyFaculty, courseController.deleteCourse);    

router.get('/courses/:courseId/modules', verifyFaculty, courseController.getModules);   
router.post('/courses/:courseId/modules', verifyFaculty, courseController.saveModules); 

// --- ASSIGNMENTS ---
router.get('/assignments', verifyFaculty, assignmentController.getAssignments);
router.post('/assignments', verifyFaculty, upload.single('file'), assignmentController.createAssignment);

// --- 🚀 EXAMS (Delegated to your dedicated examRoutes.js file!) ---
// This tells Express: "If the URL starts with /exams, send it to examRoutes.js"
router.use('/exams', examRoutes);

// --- SALARY ---
router.get('/salary', verifyFaculty, salaryController.getSalaryData);

module.exports = router;