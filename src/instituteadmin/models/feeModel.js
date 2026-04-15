const db = require('../../config/db');

const FeeModel = {
  // --- FEE STRUCTURES ---
  async getAllStructures(instituteId) {
    const [rows] = await db.query(
      `SELECT * FROM fee_structures WHERE institute_id = ? ORDER BY created_at DESC`,
      [instituteId]
    );
    return rows;
  },

  async createStructure(data) {
    const [result] = await db.query(`INSERT INTO fee_structures SET ?`, [data]);
    return result.insertId;
  },

  // --- PUBLISH LOGIC (Matches fee_publications table) ---
  async publishFeesToDb(instituteId, data) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Record the publication history
      const [pubResult] = await connection.query(
        `INSERT INTO fee_publications (institute_id, class_name, academic_year, fee_ids, total_amount) 
         VALUES (?, ?, ?, ?, ?)`,
        [instituteId, data.selectedClass, data.selectedYear, JSON.stringify(data.selectedFees), data.totalAmount]
      );

      // 2. Update status to 'Published' for the selected fees
      await connection.query(
        `UPDATE fee_structures SET status = 'Published' WHERE id IN (?) AND institute_id = ?`,
        [data.selectedFees, instituteId]
      );

      await connection.commit();
      return pubResult.insertId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async updateStructureStatus(id, status, instituteId) {
    const [result] = await db.query(
      `UPDATE fee_structures SET status = ? WHERE id = ? AND institute_id = ?`,
      [status, id, instituteId]
    );
    return result.affectedRows;
  },

  async deleteStructure(id, instituteId) {
    const [result] = await db.query(
      `DELETE FROM fee_structures WHERE id = ? AND institute_id = ?`,
      [id, instituteId]
    );
    return result.affectedRows;
  },

  // --- FEE NOTIFICATIONS ---
  async getAllNotifications(instituteId) {
    const [rows] = await db.query(
      `SELECT * FROM fee_notifications WHERE institute_id = ? ORDER BY sent_at DESC`,
      [instituteId]
    );
    return rows;
  },

  async createNotification(data) {
    const [result] = await db.query(`INSERT INTO fee_notifications SET ?`, [data]);
    return result.insertId;
  }
};

module.exports = FeeModel;