const db = require('../../config/db');

const NotificationModel = {
  async getAll(instituteCode) {
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE institute_code = ? ORDER BY created_at DESC`,
      [instituteCode]
    );
    return rows;
  },

  async create(data) {
    const [result] = await db.query(`INSERT INTO notifications SET ?`, [data]);
    return result.insertId;
  }
};

module.exports = NotificationModel;