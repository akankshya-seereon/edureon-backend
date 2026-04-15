const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

//  Import the whole file so we can see what it exports
const authMiddleware = require('../middlewares/authMiddleware'); 

//  DEBUGGING LOGS (Check your terminal when saving this!)
console.log("DEBUGGING STUDENT ASSIGNMENT ROUTES ---");
console.log("Controller Exports:", Object.keys(assignmentController));
console.log("Middleware Exports:", Object.keys(authMiddleware));
console.log("----------------------------------------------");

//  Smart fallback: It will use verifyStudent, verifyToken, or protect automatically!
const protectRoute = authMiddleware.verifyStudent || authMiddleware.verifyToken || authMiddleware.protect || authMiddleware.auth;

if (!protectRoute) {
    console.error(" ERROR: Could not find your student auth middleware function!");
}
if (!assignmentController.getStudentAssignments) {
    console.error(" ERROR: getStudentAssignments is missing from your controller! Did you save it?");
}

// --- Routes ---
router.get('/my-assignments', protectRoute, assignmentController.getStudentAssignments);

module.exports = router;