const db = require('../../config/db');

const AuthModel = {
  /**
   * Find a faculty member by email and verify they belong to the correct institute
   * @param {string} email 
   * @param {string} instituteCode 
   */
  async findByEmailAndCode(email, instituteCode) {
    const [rows] = await db.query(
      `SELECT id, name, email, password, institute_code, emp_id, status 
       FROM faculty 
       WHERE email = ? AND institute_code = ?`,
      [email, instituteCode]
    );
    return rows[0]; 
  },

  async updateLastLogin(facultyId) {
    // 🛑 COMMENTED OUT FOR NOW to prevent SQL crash!
    // We can add an 'updated_at' column to your database later if you want to track this.
    console.log(`[Info] Login successful for faculty ID: ${facultyId}`);
    return;
  }
};

module.exports = AuthModel;