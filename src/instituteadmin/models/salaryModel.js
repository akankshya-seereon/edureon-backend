const db = require('../../config/db');

const SalaryModel = {
  async getAll(instituteCode) {
    const [rows] = await db.query(
      `SELECT * FROM salary_payments WHERE institute_code = ? ORDER BY created_at DESC`,
      [instituteCode]
    );
    return rows;
  },

  async create(data) {
    const [result] = await db.query(`INSERT INTO salary_payments SET ?`, [data]);
    return result.insertId;
  },

  async delete(id, instituteCode) {
    const [result] = await db.query(
      `DELETE FROM salary_payments WHERE id = ? AND institute_code = ?`,
      [id, instituteCode]
    );
    return result.affectedRows;
  }
};

module.exports = SalaryModel;