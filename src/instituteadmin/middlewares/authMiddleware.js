const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT Token
 * Protects routes and handles Super Admin Impersonation (Master Key)
 */
const verifyToken = (req, res, next) => {
  // 1. Get the token from the 'Authorization' header or cookies
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

  // 2. If there is no token, deny access
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // 3. Verify the token using your Secret Key
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, secret);

    // 4. Attach the user data to the request object (req.user)
    req.user = decoded;

    // ==========================================
    // 🚀 5. THE MASTER KEY: IMPERSONATION LOGIC
    // ==========================================
    // Check if the logged-in user is a Super Admin
    if (req.user.role === 'superadmin' || req.user.role === 'super_admin') {
      
      // Look for the special ghost header sent by the frontend
      const managedInstituteId = req.headers['x-managed-institute-id'];
      
      if (managedInstituteId) {
        // ✅ Parse to integer so SQL comparisons work correctly
        req.user.institute_id = parseInt(managedInstituteId, 10);
        req.instituteId = parseInt(managedInstituteId, 10);
      }
      
    } else {
      // Normal Institute Admin/Faculty logic: just pass along their real ID
      // 🚀 TWEAK: Ensure their real ID is also strictly an integer
      const realId = req.user.institute_id || req.user.instituteCode;
      
      if (realId) {
         req.user.institute_id = parseInt(realId, 10);
         req.instituteId = parseInt(realId, 10);
      }
    }
    // ==========================================

    // 6. Move to the next function (the Controller)
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

// CRITICAL: Export it exactly like this so the Routes can find it
module.exports = { verifyToken };