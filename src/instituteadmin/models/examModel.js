const db = require('../../config/db');

const ExamModel = {
  // Updated to use instituteId so it matches Dashboard logic
  async getExams(instituteId, instituteCode) {
    const [rows] = await db.query(
      `SELECT 
        id, title, subject, exam_type as examType, semester, batch, year, 
        exam_date as examDate, start_time as startTime, duration, 
        total_marks as totalMarks, passing_marks as passingMarks,
        faculty_id, /* 🚀 Fetch the assigned faculty so Admin can see it */
        question_paper_path 
       FROM exams 
       WHERE institute_id = ? OR institute_code = ? 
       ORDER BY exam_date ASC, start_time ASC`,
      [instituteId, instituteCode]
    );
    return rows;
  },

  // Updated to verify by numeric ID
  async getExamById(id, instituteId) {
    const [rows] = await db.query(
      `SELECT * FROM exams WHERE id = ? AND institute_id = ?`,
      [id, instituteId]
    );
    return rows[0];
  },

  async addExam(data) {
    const query = `
      INSERT INTO exams (
        institute_id, institute_code, title, subject, exam_type, semester, batch, 
        year, exam_date, start_time, duration, total_marks, passing_marks, venue, faculty_id, question_paper_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.instituteId, 
      data.instituteCode, 
      data.title, 
      data.subject, 
      data.examType, 
      data.semester, 
      data.batch, 
      data.year, 
      data.examDate, 
      data.startTime, 
      data.duration, 
      data.totalMarks, 
      data.passingMarks, 
      data.venue, 
      data.faculty_id, // 🚀 THE FIX: Now saving the assigned teacher to the database
      data.question_paper_path 
    ];
    const [result] = await db.query(query, values);
    return result.insertId;
  },

  async deleteExam(id, instituteId) {
    const [result] = await db.query(
      `DELETE FROM exams WHERE id = ? AND institute_id = ?`,
      [id, instituteId]
    );
    return result.affectedRows;
  },

  // ==========================================
  // 🚀 MARKS ENTRY SQL QUERIES
  // ==========================================

  // Fetch students for the exam's batch, including any previously saved marks!
  async getStudentsForExam(examId, instituteId) {
    const [rows] = await db.query(
      `SELECT 
        s.id, 
        CONCAT(s.first_name, ' ', IFNULL(s.last_name, '')) AS name,   /* 🚀 FIX: Combine first and last name */
        s.roll_no AS rollNo,
        r.obtained_marks AS marks,
        r.grade
       FROM students s
       /* 🚀 FIX: Match student's academic_year to the exam's batch */
       JOIN exams e ON s.academic_year = e.batch AND s.institute_id = e.institute_id
       LEFT JOIN exam_results r ON r.student_id = s.id AND r.exam_id = e.id
       WHERE e.id = ? AND e.institute_id = ?
       ORDER BY s.roll_no ASC`,
      [examId, instituteId]
    );
    return rows;
  },

  // The "Upsert" logic: Update if a grade already exists, Insert if it's the first time
  async saveStudentMarks(examId, studentId, obtainedMarks, grade) {
    // 1. Check if a result already exists for this exact student and exam
    const [existing] = await db.query(
      `SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?`,
      [examId, studentId]
    );

    if (existing.length > 0) {
      // 2. It exists! Just update the marks
      const [result] = await db.query(
        `UPDATE exam_results SET obtained_marks = ?, grade = ? WHERE id = ?`,
        [obtainedMarks, grade, existing[0].id]
      );
      return result.affectedRows > 0;
    } else {
      // 3. It's brand new! Insert a fresh record
      const [result] = await db.query(
        `INSERT INTO exam_results (exam_id, student_id, obtained_marks, grade) VALUES (?, ?, ?, ?)`,
        [examId, studentId, obtainedMarks, grade]
      );
      return result.insertId > 0;
    }
  }
};

module.exports = ExamModel;