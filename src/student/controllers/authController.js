const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const StudentAuth = require('../model/authModel');

exports.login = async (req, res) => {
  try {
    const { email, password, instituteCode } = req.body;

    // 1. Validate incoming data
    if (!email || !password || !instituteCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email, password, and institute code.' 
      });
    }

    // 2. Fetch the student from MySQL (passing the instituteCode from the frontend to the institute_id in DB)
    const student = await StudentAuth.findStudentByEmailAndInstitute(email, instituteCode);

    if (!student) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials or institute ID.' 
      });
    }

    // 3. Verify the password using bcrypt against 'password_hash'
    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // 4. Generate JWT Token
    // Notice we are manually setting the role to 'student' here since it isn't in the DB
    const token = jwt.sign(
      { id: student.id, role: 'student', instituteId: student.institute_id },
      process.env.JWT_SECRET || 'your_super_secret_key',
      { expiresIn: '1d' }
    );

    // 5. Send successful response mapping to your React frontend
    res.status(200).json({
      success: true,
      token,
      user: {
        id: student.id,
        name: `${student.first_name} ${student.last_name || ''}`.trim(),
        email: student.email,
        role: 'student',
        instituteCode: student.institute_id
      }
    });

  } catch (error) {
    console.error('Student Login Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during login.' 
    });
  }
}; 