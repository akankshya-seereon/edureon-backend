const db = require('../../config/db');

const Attendance = {
  // 1. Find record for a specific user on a specific date
  findByUserAndDate: async (userId, userType, date) => {
    const [rows] = await db.query(
      `SELECT punch_in AS punchIn, punch_out AS punchOut, status, date, institute_id 
       FROM attendance 
       WHERE user_id = ? AND user_type = ? AND date = ?`,
      [userId, userType, date]
    );
    return rows[0];
  },

  // 2. UNIVERSAL PUNCH-IN (Handles both New and Existing records)
  // This version will work whether the row is 'Authorized' or doesn't exist yet.
  savePunchIn: async (data) => {
    const { userId, userType, instituteId, date, time, status } = data;
    
    // Using an "INSERT ... ON DUPLICATE KEY UPDATE"
    // This requires a UNIQUE index on (user_id, user_type, date) in your SQL table
    const query = `
      INSERT INTO attendance (user_id, user_type, institute_id, date, punch_in, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        punch_in = VALUES(punch_in),
        status = VALUES(status),
        institute_id = VALUES(institute_id)
    `;
    
    return await db.query(query, [userId, userType, instituteId, date, time, status]);
  },

  // 3. Standard Punch-Out
  punchOut: async (userId, userType, date, time) => {
    return await db.query(
      `UPDATE attendance 
       SET punch_out = ? 
       WHERE user_id = ? AND user_type = ? AND date = ?`,
      [time, userId, userType, date]
    );
  },

  // 4. History for the UI (Last 30 Days)
  getHistory: async (userId, userType) => {
    const [rows] = await db.query(
      `SELECT date, punch_in AS punchIn, punch_out AS punchOut, status 
       FROM attendance 
       WHERE user_id = ? AND user_type = ? 
       ORDER BY date DESC LIMIT 30`,
      [userId, userType]
    );
    return rows;
  }
};

module.exports = Attendance;