const db = require('../../config/db');

const SettingModel = {
  /**
   * 🚀 FETCH PROFILE
   * Fetches the flat columns and the JSON objects (organisation, directors, etc.)
   */
  async getProfile(instituteId) {
    const [rows] = await db.query(
      `SELECT 
        id, 
        institute_code, 
        status, 
        plan, 
        organisation,    -- 📦 JSON column (contains Institute Name, city, etc.)
        directors,       -- 📦 JSON column
        legal,           -- 📦 JSON column
        branches,        -- 📦 JSON column
        admin_name, 
        admin_email, 
        admin_phone, 
        created_at 
       FROM institutes 
       WHERE id = ?`,
      [instituteId]
    );
    return rows[0];
  },

  /**
   * 📝 UPDATE ADMIN DETAILS
   * Updates the flat columns for the administrator
   */
  async updateProfile(instituteId, data) {
    const [result] = await db.query(
      `UPDATE institutes 
       SET admin_name = ?, 
           admin_email = ?, 
           admin_phone = ? 
       WHERE id = ?`,
      [data.admin_name, data.admin_email, data.admin_phone, instituteId]
    );
    return result.affectedRows;
  },

  /**
   * 🔐 AUTHENTICATION DETAILS
   * Fetches only the password hash for verification
   */
  async getAuthDetails(instituteId) {
    const [rows] = await db.query(
      `SELECT admin_password_hash AS password 
       FROM institutes 
       WHERE id = ?`,
      [instituteId]
    );
    return rows[0];
  },

  /**
   * 🔑 UPDATE PASSWORD
   */
  async updatePassword(instituteId, hashedPassword) {
    const [result] = await db.query(
      `UPDATE institutes 
       SET admin_password_hash = ? 
       WHERE id = ?`,
      [hashedPassword, instituteId]
    );
    return result.affectedRows;
  }
};

module.exports = SettingModel;