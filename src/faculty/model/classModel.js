const db = require('../../config/db');

const Class = {
  /**
   * 1. Get all classes assigned to a specific faculty member
   * Aliases database snake_case to frontend camelCase
   */
  findByFacultyId: async (facultyId) => {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, 
          class_name AS className, 
          program,
          department,
          subject, 
          section, 
          academic_year AS academicYear, 
          semester,
          schedule, 
          enrolled_students AS students,
          max_students AS maxStudents
        FROM classes 
        WHERE faculty_id = ?`, 
        [facultyId]
      );

      // Safely parse the JSON schedule string into a JS array
      return rows.map(row => ({
        ...row,
        schedule: typeof row.schedule === 'string' ? JSON.parse(row.schedule) : (row.schedule || [])
      }));
    } catch (err) {
      console.error("Error in findByFacultyId:", err.message);
      throw err;
    }
  },

  /**
   * 2. Get all students enrolled in a specific class
   * Verified Columns: first_name, last_name, student_code
   */
  getEnrolledStudents: async (classId) => {
    try {
      const [rows] = await db.query(
        `SELECT 
          s.id, 
          CONCAT(s.first_name, ' ', IFNULL(s.last_name, '')) AS name, 
          s.student_code AS studentId, 
          e.current_grade AS grade, 
          e.attendance_percentage AS attendance
        FROM students s
        JOIN enrollments e ON s.id = e.student_id
        WHERE e.class_id = ? AND e.status = 'Active'`, 
        [classId]
      );
      return rows;
    } catch (err) {
      console.error("Error fetching enrolled students:", err.message);
      return []; // Return empty array to prevent frontend crash
    }
  },

  /**
   * 3. Get assignments for a specific class
   * Using 0 as placeholders for missing analytics columns
   */
  getAssignments: async (classId) => {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, 
          title, 
          due_date AS dueDate, 
          status,
          0 AS submitted, 
          0 AS total
        FROM assignments 
        WHERE class_id = ? 
        ORDER BY due_date DESC`, 
        [classId]
      );
      return rows;
    } catch (err) {
      console.error("Assignments Table query failed:", err.message);
      return []; 
    }
  },

  /**
   * 4. Save bulk attendance records
   * values format: [[student_id, class_id, attendance_date, status], [...]]
   */
  saveBulkAttendance: async (values) => {
    try {
      const query = `
        INSERT INTO attendance (student_id, class_id, attendance_date, status)
        VALUES ?
        ON DUPLICATE KEY UPDATE status = VALUES(status)
      `;
      // Note: values must be an array of arrays
      const [result] = await db.query(query, [values]);
      return result;
    } catch (err) {
      console.error("Bulk Attendance Save Error:", err.message);
      throw err;
    }
  }
};

module.exports = Class;