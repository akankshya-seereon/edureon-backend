const db = require('../../config/db');

const ExamModel = {
  // ---------------------------------------------------------
  // 1. GET EXAMS (Filters by Faculty ID so teachers only see theirs)
  // ---------------------------------------------------------
  async getExams(instituteId, facultyId = null) {
    let query = `SELECT 
        id, title, subject, exam_type as examType, semester, batch, year, 
        exam_date as examDate, start_time as startTime, duration, 
        total_marks as totalMarks, passing_marks as passingMarks,
        faculty_id as assignedFaculty,
        question_paper_path 
       FROM exams 
       WHERE institute_id = ?`;
    
    let params = [instituteId];

    if (facultyId) {
      query += ` AND (faculty_id = ? OR faculty_id IS NULL)`;
      params.push(facultyId);
    }

    query += ` ORDER BY exam_date DESC`;
    
    const [rows] = await db.query(query, params);
    return rows;
  },

  async getExamById(id, instituteId) {
    const [rows] = await db.query(
      `SELECT * FROM exams WHERE id = ? AND institute_id = ?`,
      [id, instituteId]
    );
    return rows[0];
  },

  // ---------------------------------------------------------
  // 2. CREATE EXAM (Now saves faculty_id!)
  // ---------------------------------------------------------
  async addExam(data) {
    const query = `
      INSERT INTO exams (
        institute_id, faculty_id, institute_code, title, subject, exam_type, semester, batch, 
        year, exam_date, start_time, duration, total_marks, passing_marks, venue, question_paper_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.instituteId, 
      data.assignedFaculty || null, // 🚀 Saves the assigned teacher
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
      data.question_paper_path 
    ];
    const [result] = await db.query(query, values);
    return result.insertId;
  },

  // ---------------------------------------------------------
  // 3. CREATE QUESTIONS (From your snippet!)
  // ---------------------------------------------------------
  async createQuestions(questionsData) {
    const query = `
      INSERT INTO exam_questions 
      (exam_id, question_text, question_type, marks, options, correct_answer) 
      VALUES ?
    `;
    // Note the extra brackets around questionsData for bulk insert
    const [result] = await db.query(query, [questionsData]);
    return result;
  },

  async deleteExam(id, instituteId) {
    const [result] = await db.query(
      `DELETE FROM exams WHERE id = ? AND institute_id = ?`,
      [id, instituteId]
    );
    return result.affectedRows;
  },

  // ---------------------------------------------------------
  // 4. GET STUDENTS FOR GRADING (Matches academic_year to batch)
  // ---------------------------------------------------------
  async getStudentsForExam(examId, instituteId) {
    const [rows] = await db.query(
      `SELECT 
        s.id, 
        CONCAT(s.first_name, ' ', IFNULL(s.last_name, '')) AS name,
        s.roll_no AS rollNo,
        r.obtained_marks AS marks,
        r.grade
       FROM students s
       JOIN exams e ON s.academic_year = e.batch AND s.institute_id = e.institute_id
       LEFT JOIN exam_results r ON r.student_id = s.id AND r.exam_id = e.id
       WHERE e.id = ? AND e.institute_id = ?
       ORDER BY s.roll_no ASC`,
      [examId, instituteId]
    );
    return rows;
  },

  // ---------------------------------------------------------
  // 5. SAVE STUDENT MARKS (Upsert logic)
  // ---------------------------------------------------------
  async saveStudentMarks(examId, studentId, obtainedMarks, grade) {
    const [existing] = await db.query(
      `SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?`,
      [examId, studentId]
    );

    if (existing.length > 0) {
      const [result] = await db.query(
        `UPDATE exam_results SET obtained_marks = ?, grade = ? WHERE id = ?`,
        [obtainedMarks, grade, existing[0].id]
      );
      return result.affectedRows > 0;
    } else {
      const [result] = await db.query(
        `INSERT INTO exam_results (exam_id, student_id, obtained_marks, grade) VALUES (?, ?, ?, ?)`,
        [examId, studentId, obtainedMarks, grade]
      );
      return result.insertId > 0;
    }
  }
};

module.exports = ExamModel;