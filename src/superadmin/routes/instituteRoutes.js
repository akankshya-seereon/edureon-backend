const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

const {
  getAllInstitutes,
  getInstituteById,
  addInstitute,
  updateInstitute,
  toggleStatus,
  deleteInstitute,
  getFullInstituteDetails,
  upload,
} = require('../controllers/institutecontroller');

const superAdminProtect = require('../middlewares/authMiddlewares');

// ── Accepts tokens from SuperAdmin AND InstituteAdmin ─────────────────────────
const allowBoth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }
  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded;
    
    // 🚀 CRITICAL FIX: Normalize role to remove underscores (super_admin -> superadmin)
    const normalizedRole = String(decoded.role || '').toLowerCase().replace(/[^a-z]/g, '');
    const allowed = ['superadmin', 'instituteadmin', 'admin', 'principal', 'accountant', 'hod'];
    
    if (!allowed.includes(normalizedRole)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── Routes ────────────────────────────────────────────────────────────────────

// MUST be before /:id — accessible by both SuperAdmin and InstituteAdmin
router.get('/:id/full-details', allowBoth, getFullInstituteDetails);

// SuperAdmin-only routes
router.get('/',             superAdminProtect, getAllInstitutes);
router.get('/:id',          superAdminProtect, getInstituteById);
router.post('/',            superAdminProtect, upload.any(), addInstitute);
router.put('/:id',          superAdminProtect, upload.any(), updateInstitute);
router.patch('/:id/status', superAdminProtect, toggleStatus);
router.delete('/:id',       superAdminProtect, deleteInstitute);

module.exports = router;