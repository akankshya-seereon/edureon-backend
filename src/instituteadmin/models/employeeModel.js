const db = require('../../config/db');

const Employee = {
  // 1. Create a new employee
  create: async (data) => {
    const query = `
      INSERT INTO employees 
      (staffType, firstName, lastName, email, phone, gender, dob, 
       bloodGroup, qualification, designation, employeeId, joiningDate, 
       departmentId, address, password, panNumber, aadhaarNumber, 
       profilePhoto, panCardDoc, aadhaarCardDoc, degreeDoc, experienceDoc) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.staffType, data.firstName, data.lastName, data.email, data.phone, 
      data.gender, data.dob, data.bloodGroup, data.qualification, data.designation, 
      data.employeeId, data.joiningDate, data.departmentId, data.address, 
      data.password, data.panNumber, data.aadhaarNumber, 
      data.profilePhoto, data.panCardDoc, data.aadhaarCardDoc, data.degreeDoc, data.experienceDoc
    ];

    const [result] = await db.query(query, values);
    return result.insertId;
  },

  // 2. Fetch all employees (For Directory & Dropdowns)
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM employees ORDER BY id DESC");
    return rows;
  },

  // 3. Fetch a single employee by ID (For Profile & Edit pages)
  findById: async (id) => {
    const query = "SELECT * FROM employees WHERE id = ?";
    const [rows] = await db.query(query, [id]);
    return rows[0]; // Return the single object
  },

  // 4. Update an existing employee
  update: async (id, data) => {
    // Dynamically build the SET clause (e.g., "firstName = ?, lastName = ?")
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    
    // Add the ID to the end of the values array for the WHERE clause
    values.push(id);
    
    const query = `UPDATE employees SET ${fields} WHERE id = ?`;
    const [result] = await db.query(query, values);
    
    return result.affectedRows;
  },

  // 5. Delete an employee (🚀 NEW: Required for the Directory Delete button!)
  delete: async (id) => {
    const query = "DELETE FROM employees WHERE id = ?";
    const [result] = await db.query(query, [id]);
    return result.affectedRows;
  }
};

module.exports = Employee;