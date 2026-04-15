const db = require('../../config/db');

const FacultyModel = {
  // 1. Fetch existing faculty 
  async getFacultyByInstitute(institute_code) {
    const [rows] = await db.query(
      `SELECT id, emp_id as empId, name, email, designation, dept, status, created_at 
       FROM faculty 
       WHERE institute_code = ?`, 
      [institute_code]
    );
    return rows;
  },

  // 2. Add a new faculty member
  async createFaculty(data) {
    const query = `
      INSERT INTO faculty (institute_code, emp_id, name, email, password, designation, dept) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.institute_code,
      data.empId,
      data.name,
      data.email,      
      data.password,  
      data.designation,
      data.dept
    ];
    
    const [result] = await db.query(query, values);
    return result;
  },

  // 3. Update an existing faculty member (The missing piece!)
  async updateFaculty(facultyId, instituteCode, data) {
    const fields = [];
    const values = [];

    // Safely build the query using only columns we know exist in your DB
    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.email) { fields.push('email = ?'); values.push(data.email); }
    if (data.designation) { fields.push('designation = ?'); values.push(data.designation); }
    if (data.dept) { fields.push('dept = ?'); values.push(data.dept); }
    if (data.status) { fields.push('status = ?'); values.push(data.status); }
    
    // Mapping the bank info we added via SQL earlier
    if (data.account_number || data.bank_account) { 
      fields.push('bank_account = ?'); 
      values.push(data.account_number || data.bank_account); 
    }
    if (data.ifsc_code || data.ifsc) { 
      fields.push('ifsc = ?'); 
      values.push(data.ifsc_code || data.ifsc); 
    }

    // If there is nothing to update, exit early
    if (fields.length === 0) return null;

    const query = `UPDATE faculty SET ${fields.join(', ')} WHERE id = ? AND institute_code = ?`;
    values.push(facultyId, instituteCode);

    const [result] = await db.query(query, values);
    return result;
  },

  // 4. Delete a faculty member
  async deleteFaculty(facultyId, instituteCode) {
    const [result] = await db.query(
      `DELETE FROM faculty WHERE id = ? AND institute_code = ?`,
      [facultyId, instituteCode]
    );
    return result;
  }
};

module.exports = FacultyModel;