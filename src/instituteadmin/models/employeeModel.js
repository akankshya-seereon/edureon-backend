const db = require('../../config/db');

const Employee = {
  // ─── 1. CREATE A NEW EMPLOYEE ───
  create: async (data) => {
    // Included Bank Details and Status (Defaults to 'Active')
    const query = `
      INSERT INTO employees 
      (staffType, firstName, lastName, email, phone, gender, dob, 
       bloodGroup, qualification, designation, employeeId, joiningDate, 
       departmentId, address, password, panNumber, aadhaarNumber, 
       profilePhoto, panCardDoc, aadhaarCardDoc, degreeDoc, experienceDoc, 
       institute_code, bankName, accountName, accountNumber, ifscCode, branchName, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.staffType, 
      data.firstName, 
      data.lastName, 
      data.email, 
      data.phone, 
      data.gender, 
      data.dob, 
      data.bloodGroup, 
      data.qualification, 
      data.designation, 
      data.employeeId, 
      data.joiningDate, 
      data.departmentId, 
      data.address, 
      data.password, 
      data.panNumber, 
      data.aadhaarNumber, 
      data.profilePhoto, 
      data.panCardDoc, 
      data.aadhaarCardDoc, 
      data.degreeDoc, 
      data.experienceDoc,
      data.institute_code,
      // 🏦 Bank Details
      data.bankName,
      data.accountName,
      data.accountNumber,
      data.ifscCode,
      data.branchName,
      data.status || 'Active' // Default status for new joins
    ];

    const [result] = await db.query(query, values);
    return result.insertId;
  },

  // ─── 2. FETCH ALL EMPLOYEES ───
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM employees ORDER BY id DESC");
    return rows;
  },

  // ─── 3. FETCH BY ID ───
  findById: async (id) => {
    const query = "SELECT * FROM employees WHERE id = ?";
    const [rows] = await db.query(query, [id]);
    return rows[0]; 
  },

  // ─── 4. UPDATE EMPLOYEE ───
  update: async (id, data) => {
    // Dynamically build the SET clause based on provided keys
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    // Add the ID for the WHERE clause
    values.push(id);
    
    const query = `UPDATE employees SET ${fields} WHERE id = ?`;
    const [result] = await db.query(query, values);
    
    return result.affectedRows;
  },

  // ─── 5. DELETE EMPLOYEE ───
  delete: async (id) => {
    const query = "DELETE FROM employees WHERE id = ?";
    const [result] = await db.query(query, [id]);
    return result.affectedRows;
  }
};

module.exports = Employee;