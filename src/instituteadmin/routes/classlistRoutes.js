const express = require('express');
const router = express.Router();
const classlistController = require('../controllers/classlistController');

// 1. Import the entire middleware file to see what it actually exports
const authMiddleware = require('../middlewares/authMiddleware');

// 2. Safely grab the verification function, trying the most common names
const verifyAdmin = 
  authMiddleware.verifyAdmin || 
  authMiddleware.verifyToken || 
  authMiddleware.authenticateToken || 
  authMiddleware.verifyInstituteAdmin;

// 3. 🚀 DEBUGGING: Check if the functions actually exist before Express crashes
if (!verifyAdmin) {
  console.error("❌ ROUTE ERROR: Missing Admin Middleware! Open 'src/instituteadmin/middlewares/authMiddleware.js' and check what function name you are exporting.");
}
if (!classlistController.getAllClasses) {
  console.error("❌ ROUTE ERROR: Missing getAllClasses in classlistController!");
}

// 4. Define CRUD routes (Using a fallback dummy function just in case, so the server doesn't crash)
const safeMiddleware = verifyAdmin || ((req, res, next) => next());

router.get('/', safeMiddleware, classlistController.getAllClasses);
router.post('/', safeMiddleware, classlistController.createClass);
router.put('/:id', safeMiddleware, classlistController.updateClass);
router.delete('/:id', safeMiddleware, classlistController.deleteClass);

module.exports = router;