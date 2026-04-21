const db = require('../../config/db');

const ReportModel = {
  /**
   * 1. Attendance Report
   * Uses STUDENTS table -> Needs numeric institute_id
   */
  async getAttendanceReport(instituteId, filters) {
    let query = `
      SELECT 
        course, 
        academic_year, 
        COUNT(*) as total_students, 
        '94%' as avg_attendance -- Placeholder percentage until attendance table is joined
      FROM students 
      WHERE institute_id = ?`; // 🚀 FIXED: Changed to institute_id
    
    const params = [instituteId];

    if (filters.course && filters.course !== "All Courses") {
      query += ` AND course = ?`;
      params.push(filters.course);
    }

    query += ` GROUP BY course, academic_year`;
    
    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * 2. Fees Collection Report
   * Uses fee_structures table -> Needs numeric institute_id
   */
  async getFeesReport(instituteId, filters) {
    let query = `
      SELECT 
        course, 
        fee_title, 
        amount_per_sem, 
        total_amount, 
        status 
      FROM fee_structures 
      WHERE institute_id = ?`; // 🚀 FIXED: Changed to institute_id
    
    const params = [instituteId];

    if (filters.course && filters.course !== "All Courses") {
      query += ` AND course = ?`;
      params.push(filters.course);
    }
    
    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * 3. Student Enrollment Report
   * Uses STUDENTS table -> Needs numeric institute_id
   */
  async getStudentReport(instituteId, filters) {
    let query = `
      SELECT 
        course, 
        academic_year, 
        status, 
        COUNT(*) as student_count 
      FROM students 
      WHERE institute_id = ?`; // 🚀 FIXED: Changed to institute_id
      
    const params = [instituteId];

    if (filters.course && filters.course !== "All Courses") {
      query += ` AND course = ?`;
      params.push(filters.course);
    }

    query += ` GROUP BY course, academic_year, status`;
      
    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * 4. Faculty/Staff Report 
   * Uses EMPLOYEES table -> Needs string institute_code
   */
  async getFacultyReport(instituteCode, filters) {
    let query = `
      SELECT 
        designation, 
        qualification,
        COUNT(*) as employee_count,
        'Active' as status
      FROM employees 
      WHERE institute_code = ?`; // ✅ Correctly uses institute_code
    
    const params = [instituteCode];

    // Filter by department if provided (departmentId in employees table)
    if (filters.department && filters.department !== "All Departments") {
      query += ` AND departmentId = ?`;
      params.push(filters.department);
    }

    query += ` GROUP BY designation, qualification`;
    
    const [rows] = await db.query(query, params);
    return rows;
  },

  /**
   * 5. 🚀 DYNAMIC FILTERS: Fetch unique courses and departments
   * Accepts BOTH IDs to query the respective tables correctly.
   */
  async getFilterOptions(instituteCode, instituteId) {
    // Get unique courses from STUDENTS (Uses numeric institute_id)
    const [courses] = await db.query(
      `SELECT DISTINCT course 
       FROM students 
       WHERE institute_id = ? AND course IS NOT NULL AND course != ''`,
      [instituteId] // 🚀 FIXED: Passing the numeric ID here
    );

    // Get unique department names from DEPARTMENTS (Uses string institute_code)
    const [departments] = await db.query(
      `SELECT DISTINCT department_name 
       FROM departments 
       WHERE institute_code = ? AND department_name IS NOT NULL AND department_name != ''`,
      [instituteCode] // ✅ Correctly uses string code here
    );

    return {
      // Clean up the data format before sending to the controller
      courses: courses.map(c => c.course),
      departments: departments.map(d => d.department_name)
    };
  }
};

module.exports = ReportModel;