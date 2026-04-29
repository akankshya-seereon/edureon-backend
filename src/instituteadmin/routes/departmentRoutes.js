const express = require('express');
const router  = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken } = require('../middlewares/authMiddleware');
 
console.log('✅ Loading Department Routes...');
 
// All department routes require a valid token
router.use(verifyToken);
 
// ── BUILDINGS (fixes the 404 on the frontend) ──────────────────────────────
router.get('/buildings', departmentController.getBuildings);
 
// ── DEPARTMENTS CRUD ───────────────────────────────────────────────────────
router.get( '/',    departmentController.getDepartments);
router.post('/',    departmentController.createDepartment);
 
// ⚠️  IMPORTANT: /assign-room MUST be defined BEFORE /:id
// Otherwise Express matches "assign-room" as the :id param and hits updateDepartment
router.post('/assign-room', (req, res, next) => {
    console.log('🚀 HIT /assign-room ROUTE!');
    console.log('   Body received:', JSON.stringify(req.body, null, 2));
    next();
}, departmentController.assignRoom);
 
router.put(   '/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);
 
module.exports = router;