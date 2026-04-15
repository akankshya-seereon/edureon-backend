const db = require('../../config/db');

const AcademicModel = {
  // DEPARTMENTS
  async getDepartments(instituteCode) {
    const [rows] = await db.query(`SELECT id, department_name as name, department_code as code, head FROM departments WHERE institute_code = ?`, [instituteCode]);
    return rows;
  },
  async addDepartment(data) {
    const [result] = await db.query(
      `INSERT INTO departments (institute_code, department_name, department_code, head) VALUES (?, ?, ?, ?)`,
      [data.instituteCode, data.name, data.code, data.head]
    );
    return result.insertId;
  },

  // COURSES
  async getCourses(instituteCode) {
    const [rows] = await db.query(`SELECT id, department_id as deptId, course_name as name, course_code as code, type, duration FROM courses WHERE institute_code = ?`, [instituteCode]);
    return rows;
  },
  async addCourse(data) {
    const [result] = await db.query(
      `INSERT INTO courses (institute_code, department_id, course_name, course_code, type, duration) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.instituteCode, data.deptId, data.name, data.code, data.type, data.duration]
    );
    return result.insertId;
  },

  // SYLLABI & SUBJECTS
  async getSyllabi(instituteCode) {
    const [rows] = await db.query(`SELECT id, course_id as courseId, syllabus_name as name, semester FROM syllabi WHERE institute_code = ?`, [instituteCode]);
    return rows;
  },
  async addSyllabus(data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. Save Syllabus
      const [sylResult] = await connection.query(
        `INSERT INTO syllabi (institute_code, course_id, syllabus_name, semester) VALUES (?, ?, ?, ?)`,
        [data.instituteCode, data.courseId, data.name, data.semester]
      );
      const syllabusId = sylResult.insertId;

      // 2. Loop through and save all Subjects & Topics
      if (data.subjects && data.subjects.length > 0) {
        for (let subj of data.subjects) {
          await connection.query(
            `INSERT INTO subjects (institute_code, syllabus_id, subject_name, subject_code, credits, topics) VALUES (?, ?, ?, ?, ?, ?)`,
            [data.instituteCode, syllabusId, subj.name, subj.code, subj.credits || 0, JSON.stringify(subj.topics || [])]
          );
        }
      }

      await connection.commit();
      return syllabusId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = AcademicModel;