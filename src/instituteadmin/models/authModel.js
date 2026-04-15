const db = require('../../config/db');

const AuthModel = {
  // Find institute by code and email for login
  async findInstituteForLogin(institute_code, admin_email) {
    const [rows] = await db.query(
      `SELECT * FROM institutes WHERE institute_code = ? AND admin_email = ? LIMIT 1`,
      [institute_code, admin_email]
    );
    return rows[0] || null;
  }
};

module.exports = AuthModel;