const db = require('../../config/db');

const Class = {
  // 1. Get all classes assigned to a specific faculty member
  findByFacultyId: async (facultyId) => {
    const [rows] = await db.query(
      `SELECT 
        id, 
        course_name AS courseName, 
        class_section AS classSection, 
        subject, 
        academic_year AS academicYear, 
        schedule, 
        students_count AS students 
      FROM classes 
      WHERE faculty_id = ?`, 
      [facultyId]
    );
    return rows;
  },

  // 2. Get all students enrolled in a specific class
  // Uses CONCAT because your table has first_name and last_name separately
  getEnrolledStudents: async (classId) => {
    const [rows] = await db.query(
      `SELECT 
        s.id, 
        CONCAT(s.first_name, ' ', IFNULL(s.last_name, '')) AS name, 
        s.student_code AS studentId, 
        e.current_grade AS grade, 
        e.attendance_percentage AS attendance
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      WHERE e.class_id = ?`, 
      [classId]
    );
    return rows;
  },

  // 3. Get assignments for a specific class
  getAssignments: async (classId) => {
    const [rows] = await db.query(
      `SELECT 
        id, 
        title, 
        due_date AS dueDate, 
        submitted_count AS submitted, 
        total_students AS total, 
        status 
      FROM assignments 
      WHERE class_id = ? 
      ORDER BY due_date DESC`, 
      [classId]
    );
    return rows;
  },

  // 4. Save bulk attendance records
  // Uses ON DUPLICATE KEY UPDATE to allow correcting attendance after saving
  saveBulkAttendance: async (values) => {
    const query = `
      INSERT INTO attendance (student_id, class_id, attendance_date, status)
      VALUES ?
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;
    // We wrap 'values' in an extra array [] because the mysql2 driver 
    // requires it for the bulk insert syntax 'VALUES ?'
    return await db.query(query, [values]);
  }
};

module.exports = Class;