const StudentModel = require('../models/studentModel');
const bcrypt = require('bcryptjs');

// Fetch existing students
exports.getAllStudents = async (req, res) => {
  try {
    // 🛡️ Privacy Guard: Fetch using the numeric ID
    const instituteId = req.user.id; 
    const students = await StudentModel.getStudentsByInstitute(instituteId);
    
    res.status(200).json({ success: true, students });
  } catch (err) {
    console.error("Fetch Students Error:", err);
    res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
};

// Add new student
exports.addStudent = async (req, res) => {
  try {
    const instituteId = req.user.id; 
    
    // 🎯 Catch EVERYTHING sent by your React form
    const { 
      type, firstName, lastName, email, phone, password, 
      dob, gender, aadhar, pan, course, standard, section, 
      rollNo, year, status, documents, address 
    } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "A default password is required to create a student account." 
      });
    }

    // Encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🛠️ Format JSON and Dates for MySQL strict mode
    const docsJson = JSON.stringify(documents || {});
    const addressJson = JSON.stringify(address || {});
    const formattedDob = dob ? dob : null; // Prevents '0000-00-00' database errors

    // Pass ALL data down to the Model
    await StudentModel.createStudent({
      instituteId, 
      studentCode: rollNo, // Map rollNo to the required student_code column
      type: type || 'University',
      firstName,
      lastName,
      email,
      phone,
      dob: formattedDob,
      gender,
      aadhar,
      pan,
      course: course || null,
      standard: standard || null,
      section,
      rollNo,
      year: year || '2024-25',
      documents: docsJson,
      address: addressJson,
      status: status || 'Pending',
      passwordHash: hashedPassword 
    });

    res.status(201).json({ success: true, message: "Student enrolled successfully!" });
  } catch (err) {
    console.error("Add Student Error:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "This Email or Roll Number is already registered." });
    }
    res.status(500).json({ success: false, message: "Error adding student" });
  }
};