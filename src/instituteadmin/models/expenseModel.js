const db = require('../../config/db');

const ExpenseModel = {
  async getAll(instituteCode) {
    const [rows] = await db.query(
      `SELECT * FROM expenses WHERE institute_code = ? ORDER BY date DESC`,
      [instituteCode]
    );
    return rows;
  },

  async create(data) {
    const [result] = await db.query(`INSERT INTO expenses SET ?`, [data]);
    return result.insertId;
  },

  async delete(id, instituteCode) {
    const [result] = await db.query(
      `DELETE FROM expenses WHERE id = ? AND institute_code = ?`,
      [id, instituteCode]
    );
    return result.affectedRows;
  }
};

module.exports = ExpenseModel;