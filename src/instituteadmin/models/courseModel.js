const db = require('../../config/db');

const CourseModel = {
  // --- COURSES ---
  async getCourses(instituteCode) {
    const [rows] = await db.query(
      `SELECT id, institute_code, course_name, duration, status, created_at 
       FROM courses 
       WHERE institute_code = ?`,
      [instituteCode]
    );
    return rows;
  },

  async addCourse(data) {
    const query = `INSERT INTO courses (institute_code, course_name, duration, status) VALUES (?, ?, ?, ?)`;
    const values = [data.instituteCode, data.courseName, data.duration, data.status || 'Active'];
    const [result] = await db.query(query, values);
    return result;
  },

  // --- SUBJECTS ---
  async getSubjects(instituteCode) {
    const [rows] = await db.query(
      `SELECT s.id, s.course_id, s.subject_name, s.subject_code, s.type, c.course_name 
       FROM subjects s
       JOIN courses c ON s.course_id = c.id
       WHERE s.institute_code = ?`,
      [instituteCode]
    );
    return rows;
  },

  async addSubject(data) {
    const query = `INSERT INTO subjects (institute_code, course_id, subject_name, subject_code, type) VALUES (?, ?, ?, ?, ?)`;
    const values = [data.instituteCode, data.courseId, data.subjectName, data.subjectCode, data.type || 'Theory'];
    const [result] = await db.query(query, values);
    return result;
  }
};

module.exports = CourseModel;