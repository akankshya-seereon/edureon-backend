const jwt = require('jsonwebtoken');
const AdminModel = require('../model/adminModel');
// const SuperAdminModel = require('../model/superAdminModel'); // UNCOMMENT IF THEY LIVE IN A DIFFERENT TABLE

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 1. Find the user in the database
    let admin = await AdminModel.findById(decoded.id);

    // 🚨 IF SUPER ADMINS ARE IN A DIFFERENT TABLE, ADD THIS LOGIC:
    // if (!admin) {
    //   admin = await SuperAdminModel.findById(decoded.id);
    // }

    if (!admin || !admin.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — admin not found or inactive',
      });
    }

    // 2. Attach base user details to the request
    req.admin = { 
      id: admin.id, 
      role: admin.role,
      institute_id: admin.institute_id // Assuming your schema has this field
    };

    // ==========================================
    // 🚀 3. THE MASTER KEY: IMPERSONATION LOGIC
    // ==========================================
    
    // 🚀 CRITICAL FIX: Normalize the role to handle "SUPER ADMIN", "SuperAdmin", etc.
    const normalizedRole = String(admin.role || '').toLowerCase().replace(/[^a-z]/g, '');

    if (normalizedRole === 'superadmin') {
      // Look for the Ghost Header sent by Axios
      const managedInstituteId = req.headers['x-managed-institute-id'];
      
      if (managedInstituteId) {
        // OVERRIDE: Trick the controllers into using the targeted institute!
        req.admin.institute_id = managedInstituteId;
        req.instituteId = managedInstituteId; // Fallback depending on what your controllers use
      }
    } else {
      // Standard admin mapping
      req.instituteId = admin.institute_id;
    }
    // ==========================================

    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — token invalid or expired',
    });
  }
};

module.exports = protect;