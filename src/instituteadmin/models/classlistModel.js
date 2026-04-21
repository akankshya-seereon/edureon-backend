const db = require('../../config/db');

class ClassListModel {
  
  // 1. Get all classes for a specific institute
  static async getAllByInstitute(instituteId) {
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) AS modules
      FROM classes c
      WHERE c.institute_id = ?
      ORDER BY c.id DESC
    `;
    const [rows] = await db.query(query, [instituteId]);
    return rows;
  }

  // 2. Create a new class
  static async create(data) {
    const query = `
      INSERT INTO classes 
      (institute_id, class_name, program, department, subject, faculty_assigned, academic_year, semester, section, max_students, schedule, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [
      data.instituteId, 
      data.className, 
      data.program, 
      data.department, 
      data.subject, 
      data.facultyAssigned, 
      data.academicYear, 
      data.semester, 
      data.section, 
      data.maxStudents, 
      JSON.stringify(data.schedule), // Convert array to JSON string for DB
      data.description
    ]);
    return result.insertId;
  }

  // 3. Update an existing class
  static async update(id, instituteId, data) {
    const query = `
      UPDATE classes SET 
        class_name = ?, program = ?, department = ?, subject = ?, faculty_assigned = ?, 
        academic_year = ?, semester = ?, section = ?, max_students = ?, schedule = ?, description = ?
      WHERE id = ? AND institute_id = ?
    `;
    const [result] = await db.query(query, [
      data.className, 
      data.program, 
      data.department, 
      data.subject, 
      data.facultyAssigned, 
      data.academicYear, 
      data.semester, 
      data.section, 
      data.maxStudents, 
      JSON.stringify(data.schedule), 
      data.description, 
      id, 
      instituteId
    ]);
    return result.affectedRows;
  }

  // 4. Delete a class
  static async delete(id, instituteId) {
    const query = `DELETE FROM classes WHERE id = ? AND institute_id = ?`;
    const [result] = await db.query(query, [id, instituteId]);
    return result.affectedRows;
  }
}

module.exports = ClassListModel;