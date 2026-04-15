const AuthModel = require('../models/authModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.instituteLogin = async (req, res) => {
  try {
    const { instituteCode, email, password } = req.body;

    // 1. Validate Input
    if (!instituteCode || !email || !password) {
      return res.status(400).json({ success: false, message: 'Code, Email, and Password are required' });
    }

    // 2. Fetch from Database using the MODEL
    const institute = await AuthModel.findInstituteForLogin(instituteCode, email);

    if (!institute) {
      return res.status(401).json({ success: false, message: 'Invalid Institute Code or Email' });
    }

    // 3. Check Status (Must be 'Active')
    if (institute.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your institute is currently inactive or suspended' });
    }

    // 4. 🚀 FIX: Verify the Password against the new 'password_hash' column
    const isMatch = await bcrypt.compare(password, institute.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Password' });
    }

    // 5. Parse the JSON organisation column (if it exists)
    let orgData = {};
    if (institute.organisation) {
       orgData = typeof institute.organisation === 'string' 
        ? JSON.parse(institute.organisation) 
        : institute.organisation;
    }

    // 6. Create Token
    const token = jwt.sign(
      { id: institute.id, role: 'institute_admin', code: institute.institute_code },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    // 7. Send Success Response
    res.status(200).json({
      success: true,
      message: `Login successful for ${orgData?.name || 'Institute'}`,
      token,
      data: {
        id: institute.id,
        name: orgData?.name || 'Institute Admin',
        code: institute.institute_code
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};