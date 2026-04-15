const db = require('../../config/db');

const StudentModel = {
  // Fetch existing students (Expanded to grab all new data)
  async getStudentsByInstitute(instituteId) {
    const [rows] = await db.query(
      `SELECT 
        id, 
        student_code as rollNo, 
        first_name as firstName, 
        last_name as lastName, 
        CONCAT(first_name, ' ', COALESCE(last_name, '')) as name, 
        email, 
        phone, 
        status,
        type,
        course,
        standard_name as standard,
        section,
        academic_year as year,
        dob,
        gender,
        aadhar,
        pan,
        documents,
        address
       FROM students
       WHERE institute_id = ?
       ORDER BY created_at DESC`,
      [instituteId] // 🚀 OPTIMIZED: Using direct ID instead of sub-query
    );
    return rows;
  },

  // Add a new student (Now catches ALL 20 fields from React)
  async createStudent(data) {
    const query = `
      INSERT INTO students (
        institute_id, student_code, type, first_name, last_name, 
        email, phone, dob, gender, aadhar, pan, 
        course, standard_name, section, roll_no, academic_year, 
        documents, address, status, password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.instituteId,
      data.studentCode,
      data.type,
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.dob,
      data.gender,
      data.aadhar,
      data.pan,
      data.course,
      data.standard,
      data.section,
      data.rollNo,
      data.year,
      data.documents, // 🚀 This will now save the parsed JSON string from the controller
      data.address,   // 🚀 This will now save the parsed JSON string from the controller
      data.status,
      data.passwordHash
    ];

    const [result] = await db.query(query, values);
    return result;
  }
};

module.exports = StudentModel;