const db = require('../../config/db');

const FeeModel = {
  // --- FEE STRUCTURES ---
  async getAllStructures(instituteId) {
    // 🚀 CRITICAL FIX: Added a LEFT JOIN to fetch the actual student's name
    const [rows] = await db.query(
      `SELECT 
          fs.*, 
          TRIM(CONCAT(IFNULL(s.first_name, ''), ' ', IFNULL(s.last_name, ''))) AS student_name 
       FROM fee_structures fs
       LEFT JOIN students s ON fs.student_id = s.id
       WHERE fs.institute_id = ? 
       ORDER BY fs.created_at DESC`,
      [instituteId]
    );
    return rows;
  },

  async createStructure(data) {
    // Using SET ? automatically maps the student_id from your controller!
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
  },

  // --- STUDENT FETCHER ---
  async getStudentsForFees(instituteId) {
    const [rows] = await db.query(
      `SELECT 
        id, 
        first_name, 
        last_name, 
        TRIM(CONCAT(IFNULL(first_name, ''), ' ', IFNULL(last_name, ''))) AS name,
        roll_no, 
        standard_name AS course_name 
       FROM students 
       WHERE institute_id = ?`,
      [instituteId]
    );
    return rows;
  }
};

module.exports = FeeModel;