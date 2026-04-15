const db = require('../../config/db');

const CertificateModel = {
  // Check if a marksheet already exists for a student in a specific semester
  async checkExists(studentId, semester, type = 'Marksheet') {
    const [rows] = await db.query(
      'SELECT id FROM student_documents WHERE student_id = ? AND semester = ? AND document_type = ?',
      [studentId, semester, type]
    );
    return rows.length > 0;
  },

  // Save the generated document path to the database
  async create(data) {
    const [result] = await db.query(
      `INSERT INTO student_documents 
      (institute_id, student_id, course_id, batch, semester, document_type, file_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft')`,
      [data.instituteId, data.studentId, data.courseId, data.batch, data.semester, data.documentType, data.fileUrl]
    );
    return result.insertId;
  },

  async getAllByInstitute(instituteId, filters = {}) {
    // 🚀 FIX: Strictly using first_name and last_name since full_name and name do not exist in the DB
    let query = `
      SELECT d.*, 
             CONCAT(s.first_name, ' ', s.last_name) AS student_name, 
             s.email AS student_email, 
             c.course_name 
      FROM student_documents d
      LEFT JOIN students s ON d.student_id = s.id
      LEFT JOIN courses c ON d.course_id = c.id
      WHERE d.institute_id = ?
    `;
    const params = [instituteId];

    if (filters.courseId) { query += ' AND d.course_id = ?'; params.push(filters.courseId); }
    if (filters.batch) { query += ' AND d.batch = ?'; params.push(filters.batch); }
    if (filters.semester) { query += ' AND d.semester = ?'; params.push(filters.semester); }
    if (filters.status) { query += ' AND d.status = ?'; params.push(filters.status); }

    query += ' ORDER BY d.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  // Change status from 'Draft' to 'Published' so students can see them
  async publish(documentIds, instituteId) {
    if (!documentIds || documentIds.length === 0) return 0;
    const [result] = await db.query(
      `UPDATE student_documents SET status = 'Published' WHERE id IN (?) AND institute_id = ?`,
      [documentIds, instituteId]
    );
    return result.affectedRows;
  },

  // Delete a draft document
  async delete(id, instituteId) {
    const [result] = await db.query(
      `DELETE FROM student_documents WHERE id = ? AND institute_id = ? AND status = 'Draft'`,
      [id, instituteId]
    );
    return result.affectedRows;
  }
};

module.exports = CertificateModel;