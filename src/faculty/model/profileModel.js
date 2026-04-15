const db = require('../../config/db');

class FacultyProfile {
  // 1. Fetch profile details
  // 1. Fetch profile details
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT 
         f.id, 
         f.name AS fullName, 
         f.name, 
         f.email, 
         f.mobile, 
         f.experience, 
         f.qualification, 
         f.specializations,
         f.designation,
         f.dept,
         i.organisation->>'$.name' AS institute_name  --  Extracting from JSON!
       FROM faculty f
       LEFT JOIN institutes i ON f.institute_code = i.institute_code
       WHERE f.id = ?`,
      [id]
    );
    return rows[0]; 
  }
  // 2. Update profile details (🎯 FIXED: Dynamic SQL Builder)
  static async update(id, profileData) {
    // Map the expected frontend keys to your actual MySQL column names
    const allowedFields = {
      fullName: 'name',
      name: 'name',
      email: 'email',
      mobile: 'mobile',
      phone: 'mobile', // fallback if frontend sends 'phone'
      experience: 'experience',
      qualification: 'qualification',
      specializations: 'specializations'
    };

    const fieldsToUpdate = [];
    const values = [];

    // Loop through frontend data and build the SQL query dynamically
    for (const [key, value] of Object.entries(profileData)) {
      const dbColumn = allowedFields[key];
      
      if (dbColumn !== undefined && value !== undefined) {
        fieldsToUpdate.push(`${dbColumn} = ?`);
        
        // Convert arrays (like specializations) into strings for MySQL
        if (Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    // If there is nothing valid to update, just return early
    if (fieldsToUpdate.length === 0) return true;

    // Add the Faculty ID to the end of the values array for the WHERE clause
    values.push(id);

    const query = `UPDATE faculty SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    
    const [result] = await db.query(query, values);
    return result;
  }

  // 3. Get just the password hash for verification
  static async getPasswordHash(id) {
    const [rows] = await db.query(`SELECT password FROM faculty WHERE id = ?`, [id]);
    return rows[0]; 
  }

  // 4. Update the password
  static async updatePassword(id, newHash) {
    const [result] = await db.query(
      `UPDATE faculty SET password = ? WHERE id = ?`, 
      [newHash, id]
    );
    return result;
  }
}

module.exports = FacultyProfile;