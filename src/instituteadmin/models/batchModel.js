const db = require('../../config/db');

const BatchModel = {
  // Fetch all batches with section details and student counts
  async getAll(instituteId) {
    const query = `
      SELECT 
        b.*, 
        (SELECT COUNT(*) FROM batch_students WHERE batch_id = b.id) as student_count,
        f1.name as proctor_fname, 
        '' as proctor_lname,
        f2.name as hod_fname, 
        '' as hod_lname
      FROM batches b
      LEFT JOIN faculty f1 ON b.proctor_id = f1.id
      LEFT JOIN faculty f2 ON b.hod_id = f2.id
      WHERE b.institute_id = ?  /* 🚀 FIXED: Changed from institute_code */
      ORDER BY b.created_at DESC
    `;
    const [batches] = await db.query(query, [instituteId]);
    if (batches.length === 0) return [];

    const batchIds = batches.map(b => b.id);
    const [sections] = await db.query(
      `SELECT batch_id, section_name as name, strength FROM batch_sections WHERE batch_id IN (?)`,
      [batchIds]
    );

    return batches.map(b => ({
      ...b,
      sections: sections.filter(s => s.batch_id === b.id)
    }));
  },

  // Create Batch, Sections, and Students Link in ONE transaction
  async create(batchData, sections, studentIds) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [batchResult] = await conn.query(`INSERT INTO batches SET ?`, [batchData]);
      const batchId = batchResult.insertId;

      if (sections && sections.length > 0) {
        const sectionValues = sections.map(s => [batchId, s.name, parseInt(s.strength) || 0]);
        await conn.query(`INSERT INTO batch_sections (batch_id, section_name, strength) VALUES ?`, [sectionValues]);
      }

      if (studentIds && studentIds.length > 0) {
        const studentLinks = studentIds.map(sid => [batchId, sid]);
        await conn.query(`INSERT INTO batch_students (batch_id, student_id) VALUES ?`, [studentLinks]);
      }

      await conn.commit();
      return batchId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getById(id, instituteId) {
    const [rows] = await db.query(`
      SELECT 
        b.*, 
        f1.name as proctor_fname, 
        '' as proctor_lname,
        f2.name as hod_fname, 
        '' as hod_lname
      FROM batches b
      LEFT JOIN faculty f1 ON b.proctor_id = f1.id
      LEFT JOIN faculty f2 ON b.hod_id = f2.id
      WHERE b.id = ? AND b.institute_id = ? /* 🚀 FIXED: Changed from institute_code */
    `, [id, instituteId]);
    
    if (rows.length === 0) return null;
    const batch = rows[0];

    const [sections] = await db.query(`SELECT section_name as name, strength FROM batch_sections WHERE batch_id = ?`, [id]);
    batch.sections = sections;
    return batch;
  },

  async delete(id, instituteId) {
    const [result] = await db.query(
        `DELETE FROM batches WHERE id = ? AND institute_id = ?`, /* 🚀 FIXED */
        [id, instituteId]
    );
    return result.affectedRows;
  }
};

module.exports = BatchModel;