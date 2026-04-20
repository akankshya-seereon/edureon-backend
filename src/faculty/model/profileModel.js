const db = require('../../config/db');

class FacultyProfile {
  /**
   * 1. Fetch profile details
   * Joins with institutes to get the organization name.
   */
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
            e.id, 
            e.firstName, 
            e.lastName, 
            CONCAT(e.firstName, ' ', e.lastName) AS fullName, 
            e.email, 
            e.phone, 
            e.phone AS mobile, 
            e.qualification, 
            e.designation,
            e.employeeId,
            e.departmentId,
            e.profilePhoto,
            e.address,
            e.institute_code,
            -- Safety: If these columns don't exist in your table yet, 
            -- these aliases prevent the frontend from crashing.
            '0' AS experience,
            '[]' AS specializations,
            i.organisation->>'$.name' AS institute_name 
         FROM employees e
         LEFT JOIN institutes i ON e.institute_code = i.institute_code
         WHERE e.id = ?`,
        [id]
      );
      return rows[0];
    } catch (err) {
      console.error("SQL ERROR in findById:", err.sqlMessage || err.message);
      throw err;
    }
  }

  /**
   * 2. Update profile details
   * Translates frontend keys (fullName, mobile) to DB columns (firstName, lastName, phone).
   */
  static async update(id, profileData) {
    const dbPayload = {};

    // 🚀 THE BRIDGE: Map frontend fields to Database columns
    
    // Handle Name splitting
    if (profileData.fullName) {
      const nameParts = profileData.fullName.trim().split(/\s+/);
      dbPayload.firstName = nameParts[0];
      dbPayload.lastName = nameParts.slice(1).join(" ") || "";
    } else {
      if (profileData.firstName) dbPayload.firstName = profileData.firstName;
      if (profileData.lastName) dbPayload.lastName = profileData.lastName;
    }

    // Handle Phone mapping
    if (profileData.mobile || profileData.phone) {
      dbPayload.phone = profileData.mobile || profileData.phone;
    }

    // Handle other standard fields
    if (profileData.email) dbPayload.email = profileData.email;
    if (profileData.qualification) dbPayload.qualification = profileData.qualification;
    if (profileData.address) dbPayload.address = profileData.address;

    // 🎯 SAFETY GUARD: If no valid fields are left, return early to avoid SQL syntax error
    if (Object.keys(dbPayload).length === 0) {
      console.warn("Update called with no recognized fields. Skipping database query.");
      return { affectedRows: 0 };
    }

    try {
      // The '?' in SET ? is a mysql2 feature that handles objects
      const [result] = await db.query("UPDATE employees SET ? WHERE id = ?", [dbPayload, id]);
      return result;
    } catch (err) {
      console.error("SQL ERROR in update:", err.sqlMessage || err.message);
      throw err;
    }
  }

  /**
   * 3. Fetch password hash for security checks
   */
  static async getPasswordHash(id) {
    const [rows] = await db.query(`SELECT password FROM employees WHERE id = ?`, [id]);
    return rows[0]; 
  }

  /**
   * 4. Update password
   */
  static async updatePassword(id, newHash) {
    const [result] = await db.query(
      "UPDATE employees SET password = ? WHERE id = ?", 
      [newHash, id]
    );
    return result; 
  }
}

module.exports = FacultyProfile;