const AuthModel = require('../model/authModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password, instituteCode } = req.body;

  console.log("-----------------------------------------");
  console.log("  NEW FACULTY LOGIN ATTEMPT");
  console.log("Email:", email);
  console.log("-----------------------------------------");

  if (!email || !password || !instituteCode) {
    return res.status(400).json({ 
      success: false, 
      message: "Please provide email, password, and institute code." 
    });
  }

  try {
    const faculty = await AuthModel.findByEmailAndCode(email, instituteCode);

    if (!faculty) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Email or Institute Code." 
      });
    }

    if (faculty.status !== 'Active') {
      return res.status(403).json({ 
        success: false, 
        message: "Account is inactive. Please contact Admin." 
      });
    }

    const isMatch = await bcrypt.compare(password, faculty.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid Password." 
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("CRITICAL: process.env.JWT_SECRET is missing!");
    }

    // 1. Create the Token
    const token = jwt.sign(
      { 
        id: faculty.id, 
        role: 'faculty', 
        institute_code: faculty.institute_code, 
        department_id: faculty.department_id    
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    //  2. THE FIX: Set the Token as an HTTP-Only Cookie
   //  2. THE FIX: Set the Token as an HTTP-Only Cookie
res.cookie('token', token, {
  httpOnly: true,
  secure: false,       //  FORCE false for localhost
  sameSite: 'lax',     //  MUST be 'lax' for localhost cross-port
  path: '/',           //  CRITICAL: This makes the cookie visible to /api/faculty/exams
  maxAge: 24 * 60 * 60 * 1000 
});
    await AuthModel.updateLastLogin(faculty.id);

    console.log(" ✅ RESULT: Login Successful & Cookie Set!");

    // 3. Return user data (but token is now safely in the cookie)
    res.json({
      success: true,
      user: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: 'faculty',
        institute_code: faculty.institute_code 
      }
    });

  } catch (err) {
    console.error("FATAL CRASH:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};