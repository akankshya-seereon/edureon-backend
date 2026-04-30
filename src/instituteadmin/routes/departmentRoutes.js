const express = require('express');
const router  = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken } = require('../middlewares/authMiddleware');

console.log('✅ Loading Department Routes...');

// All department routes require a valid token
router.use(verifyToken);

// ── BUILDINGS ──────────────────────────────────────────────────────────────
// Registered here as /buildings → accessible at /api/admin/departments/buildings
// The frontend must call /api/admin/departments/buildings (fixed in Department.jsx)
router.get('/buildings', departmentController.getBuildings);

// ── DEPARTMENTS CRUD ───────────────────────────────────────────────────────
router.get('/', departmentController.getDepartments);
router.post('/', departmentController.createDepartment);

// ⚠️ IMPORTANT: /assign-room MUST be defined BEFORE /:id
router.post('/assign-room', (req, res, next) => {
  console.log('🚀 HIT /assign-room ROUTE!');
  console.log('   Body received:', JSON.stringify(req.body, null, 2));
  next();
}, departmentController.assignRoom);

router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;