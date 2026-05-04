const AuthModel = require('../models/authModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminAuthController = { 
  // ─── 1. INSTITUTE / ADMIN LOGIN ───
  instituteLogin: async (req, res) => {
    console.log("\n-----------------------------------------");
    console.log(" 🏢 NEW ADMIN/INSTITUTE LOGIN ATTEMPT");
    console.log("- Email:", req.body.email);
    console.log("-----------------------------------------");

    try {
      // 1. Extract variables with Fail-Safes (handling camelCase & snake_case)
      const { instituteCode, institute_code, email, password, roleType } = req.body;
      const finalInstituteCode = instituteCode || institute_code;
      
      // Default to institute_admin if no specific sub-role (like principal/accountant) was sent
      const normalizedRole = roleType || 'institute_admin'; 

      // 2. Validate Input
      if (!finalInstituteCode || !email || !password) {
        console.log("❌ FAILED: Missing required fields.");
        return res.status(400).json({ 
          success: false, 
          message: 'Institute Code, Email, and Password are required.' 
        });
      }

      // 3. Fetch from Database using the MODEL
      const institute = await AuthModel.findInstituteForLogin(finalInstituteCode, email);

      if (!institute) {
        console.log("❌ FAILED: Database returned 0 matches for Code + Email.");
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Institute Code or Email.' 
        });
      }

      // 4. Check Status (Must be 'Active')
      if (institute.status && institute.status !== 'Active') {
        console.log(`❌ FAILED: Institute status is ${institute.status}`);
        return res.status(403).json({ 
          success: false, 
          message: 'Your institute is currently inactive or suspended.' 
        });
      }

      // 5. Verify Password (with a fallback for testing plain-text passwords)
      let isMatch = false;
      const dbPassword = institute.password_hash || institute.password; // Handle both column name possibilities
      
      if (!dbPassword) {
         return res.status(401).json({ success: false, message: 'Password not set for this account.' });
      }

      // Check if the password looks like a bcrypt hash (starts with $2)
      if (dbPassword.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, dbPassword);
      } else {
        // Fallback: If you manually typed '123456' in your database for testing
        isMatch = (password === dbPassword);
      }

      if (!isMatch) {
        console.log("❌ FAILED: Password mismatch.");
        return res.status(401).json({ success: false, message: 'Invalid Password.' });
      }

      // 6. Parse the JSON organisation column (if it exists)
      let orgData = {};
      if (institute.organisation) {
        try {
          orgData = typeof institute.organisation === 'string' 
          ? JSON.parse(institute.organisation) 
          : institute.organisation;
        } catch (e) {
          console.warn("⚠️ Warning: Could not parse organisation JSON.");
        }
      }

      // 7. Create Token
      const token = jwt.sign(
        { 
          id: institute.id, 
          role: normalizedRole, 
          code: institute.institute_code || finalInstituteCode
        },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '1d' }
      );

      // 8. 🎯 CRITICAL: Set the HTTP-Only Cookie
      // This perfectly matches your frontend's { withCredentials: true } setting
      res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax', // Use 'lax' for better local dev compatibility, switch to 'strict' in production
          maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      console.log("✅ SUCCESS: Admin logged in.");

      // 9. Send Success Response
      res.status(200).json({
        success: true,
        message: `Login successful for ${orgData?.name || 'Institute'}`,
        token, // Also keep it in the body just in case frontend needs it
        user: { 
          id: institute.id,
          name: orgData?.name || 'Institute Admin',
          email: email,
          code: institute.institute_code || finalInstituteCode,
          role: normalizedRole
        }
      });

    } catch (err) {
      console.error('❌ Login Error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
  },

  // ─── 2. ADMIN SECURE LOGOUT ───
  logout: async (req, res) => {
    try {
      // Clear the HTTP-Only cookie securely
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      console.log("👋 Admin securely logged out (cookie cleared).");
      return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      console.error('❌ Logout Error:', err);
      res.status(500).json({ success: false, message: 'Server error during logout' });
    }
  }
};

module.exports = adminAuthController;