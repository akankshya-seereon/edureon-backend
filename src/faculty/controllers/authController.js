const AuthModel = require('../model/authModel'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  console.log("\n-----------------------------------------");
  console.log(" 🎓 NEW EMPLOYEE LOGIN ATTEMPT");
  console.log("- Email:", req.body.email);
  console.log("-----------------------------------------");

  try {
    // 1. 🚀 Extract variables with Fail-Safes
    const { email, password, instituteCode, institute_code, roleType } = req.body;
    const finalInstituteCode = instituteCode || institute_code;

    if (!email || !password || !finalInstituteCode) {
      console.log("❌ FAILED: Missing required fields.");
      return res.status(400).json({ 
        success: false, 
        message: "Please provide email, password, and institute code." 
      });
    }

    // 2. Fetch from Database using your custom Model
    const faculty = await AuthModel.findByEmailAndCode(email, finalInstituteCode);

    if (!faculty) {
      console.log("❌ FAILED: Database returned 0 matches for Code + Email.");
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Email or Institute Code." 
      });
    }

    // 3. Check Account Status
    if (faculty.status && faculty.status !== 'Active') {
      console.log(`❌ FAILED: Account status is ${faculty.status}`);
      return res.status(403).json({ 
        success: false, 
        message: "Account is inactive. Please contact Admin." 
      });
    }

    // 4. 🚀 Verify Password (with a fallback for testing plain-text passwords)
    let isMatch = false;
    const dbPassword = faculty.password || faculty.password_hash;
    
    if (!dbPassword) {
       return res.status(401).json({ success: false, message: 'Password not set for this account.' });
    }

    if (dbPassword.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, dbPassword);
    } else {
      isMatch = (password === dbPassword);
    }

    if (!isMatch) {
      console.log("❌ FAILED: Password mismatch.");
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Password." 
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("CRITICAL: process.env.JWT_SECRET is missing!");
    }

    // 🚀 DYNAMIC ROLE: Grab their actual designation from the DB and make it lowercase!
    const trueRole = (faculty.designation || 'faculty').toLowerCase();

    // 5. Create the Token
    const token = jwt.sign(
      { 
        id: faculty.id, 
        role: trueRole, // Send their actual designation!
        institute_code: faculty.institute_code || finalInstituteCode, 
        department_id: faculty.department_id || faculty.departmentId    
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 6. 🎯 Set the Token as an HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',     
      path: '/',           
      maxAge: 24 * 60 * 60 * 1000 
    });

    // 7. Safely attempt to update last login
    if (typeof AuthModel.updateLastLogin === 'function') {
        await AuthModel.updateLastLogin(faculty.id);
    }

    console.log(` ✅ RESULT: Login Successful! Assumed Role: [${trueRole.toUpperCase()}]`);

    // 8. Return user data AND the token in the JSON body
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token, 
      user: {
        id: faculty.id,
        name: faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim(), 
        email: faculty.email,
        role: trueRole, // React uses this to route them to the dashboard!
        institute_code: faculty.institute_code || finalInstituteCode,
        department_id: faculty.department_id || faculty.departmentId
      }
    });

  } catch (err) {
    console.error("❌ FATAL CRASH:", err.message);
    res.status(500).json({ success: false, message: "Internal server error during login." });
  }
};

// ─── LOGOUT ROUTE ───
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    console.log("👋 Employee securely logged out.");
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error('❌ Logout Error:', err);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};