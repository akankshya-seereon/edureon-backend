const db = require('../../config/db');

const Syllabus = {
  // Save a new subject
  createSubject: (data, callback) => {
    const query = `
      INSERT INTO syllabus_subjects 
      (course_name, specialization, batch, semester, subject_name, subject_code, specialization_link, faculty_name, marking_system, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.courseName, data.specialization, data.batch, data.semester,
      data.name, data.code, data.specLink, data.faculty, data.markingSystem, data.status || 'Upcoming'
    ];
    db.query(query, values, callback);
  },

  // Get subjects for a specific course/batch/semester
  getBySemester: (course, batch, sem, callback) => {
    const query = `SELECT * FROM syllabus_subjects WHERE course_name = ? AND batch = ? AND semester = ?`;
    db.query(query, [course, batch, sem], callback);
  },

  // Delete a subject
  deleteSubject: (id, callback) => {
    db.query("DELETE FROM syllabus_subjects WHERE id = ?", [id], callback);
  }
};

module.exports = Syllabus;