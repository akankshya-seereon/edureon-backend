const db = require('../../config/db');

const StudentAuth = {
  findStudentByEmailAndInstitute: async (email, instituteCode) => {
    try {
      // We JOIN the students table and the institutes table together.
      // This checks if the student's email matches AND if the institute's text code matches.
      const query = `
        SELECT s.* FROM students s
        JOIN institutes i ON s.institute_id = i.id
        WHERE s.email = ? AND i.institute_code = ?
      `;
      
      // We pass the string "KII751030" straight from the frontend
      const [rows] = await db.execute(query, [email, instituteCode]);
      return rows[0]; 
    } catch (error) {
      throw error;
    }
  }
};

module.exports = StudentAuth;