const db = require('../../config/db');

const AuthModel = {
  async findByEmailAndCode(email, instituteCode) {
    // 🚀 We added this tracker to prove the new code is running!
    console.log(`🔍 [DEBUG] Searching EMPLOYEES table for Email: ${email}, Code: ${instituteCode}`);
    
    const [rows] = await db.query(
      `SELECT * FROM employees WHERE email = ? AND institute_code = ?`,
      [email, instituteCode]
    );
    return rows[0]; 
  },

  async updateLastLogin(employeeId) {
    console.log(`[Info] Login successful for employee ID: ${employeeId}`);
    return;
  }
};

module.exports = AuthModel;