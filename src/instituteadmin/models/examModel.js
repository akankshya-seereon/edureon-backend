const db = require('../../config/db');

const ExamModel = {
  async getExams(instituteId, instituteCode) {
    const [rows] = await db.query(
      `SELECT 
        id, title, description, subject, specialization, exam_type as examType, 
        semester, batch, year, exam_shift as examShift, 
        exam_date as examDate, start_time as startTime, duration, 
        total_marks as totalMarks, passing_marks as passingMarks,
        campus, building, block, floor, room,
        faculty_id, 
        question_paper_path 
       FROM exams 
       WHERE institute_id = ? OR institute_code = ? 
       ORDER BY exam_date ASC, start_time ASC`,
      [instituteId, instituteCode]
    );
    return rows;
  },

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
        institute_id, institute_code, title, description, subject, specialization, 
        exam_type, semester, batch, year, exam_shift, exam_date, start_time, 
        duration, total_marks, passing_marks, campus, building, block, floor, room, 
        faculty_id, question_paper_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.instituteId, data.instituteCode, data.title, data.description,       
      data.subject, data.specialization, data.examType, data.semester, 
      data.batch, data.year, data.examShift, data.examDate, data.startTime, 
      data.duration, data.totalMarks, data.passingMarks, data.campus,            
      data.building, data.block, data.floor, data.room, data.faculty_id, 
      data.question_paper_path 
    ];
    const [result] = await db.query(query, values);
    return result.insertId;
  },

  // 🚀 NEW: Added the Update Exam query
  async updateExam(id, instituteId, data) {
    let query = `
      UPDATE exams SET 
        title = ?, description = ?, subject = ?, specialization = ?, 
        exam_type = ?, semester = ?, batch = ?, year = ?, exam_shift = ?, 
        exam_date = ?, start_time = ?, duration = ?, total_marks = ?, passing_marks = ?, 
        campus = ?, building = ?, block = ?, floor = ?, room = ?, faculty_id = ?
    `;
    
    const values = [
      data.title, data.description, data.subject, data.specialization, 
      data.examType, data.semester, data.batch, data.year, data.examShift, 
      data.examDate, data.startTime, data.duration, data.totalMarks, data.passingMarks, 
      data.campus, data.building, data.block, data.floor, data.room, data.faculty_id
    ];

    // Only update PDF if a new one was uploaded
    if (data.question_paper_path) {
        query += `, question_paper_path = ?`;
        values.push(data.question_paper_path);
    }

    query += ` WHERE id = ? AND institute_id = ?`;
    values.push(id, instituteId);

    const [result] = await db.query(query, values);
    return result.affectedRows;
  },

  async deleteExam(id, instituteId) {
    const [result] = await db.query(
      `DELETE FROM exams WHERE id = ? AND institute_id = ?`,
      [id, instituteId]
    );
    return result.affectedRows;
  },

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