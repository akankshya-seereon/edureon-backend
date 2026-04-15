const db = require('../../config/db');

const AttendanceModel = {
  // 1. Get all attendance for a specific institute and date
  async getByDate(institute_code, date) {
    const [rows] = await db.query(
      `SELECT user_id, user_type, punch_in, punch_out, status, approved_by
       FROM attendance
       WHERE institute_id = (SELECT id FROM institutes WHERE institute_code = ?) 
       AND date = ?`,
      [institute_code, date]
    );
    return rows;
  },

  // 2. Insert or update an attendance record (Upsert)
  async upsertRecord(institute_code, user_id, user_type, date, data) {
    const query = `
      INSERT INTO attendance 
        (institute_id, user_id, user_type, date, punch_in, punch_out, status, approved_by)
      VALUES (
        (SELECT id FROM institutes WHERE institute_code = ?), 
        ?, ?, ?, ?, ?, ?, ?
      )
      ON DUPLICATE KEY UPDATE
        punch_in = VALUES(punch_in),
        punch_out = VALUES(punch_out),
        status = VALUES(status),
        approved_by = VALUES(approved_by)
    `;
    
    const values = [
      institute_code, 
      user_id, 
      user_type, 
      date,
      data.punchIn || null, 
      data.punchOut || null, 
      data.status || 'Absent', 
      data.approvedBy || null
    ];

    await db.query(query, values);
  }
};

module.exports = AttendanceModel;