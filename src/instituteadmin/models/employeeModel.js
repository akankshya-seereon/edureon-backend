const db = require('../../config/db');

const Employee = {
  // 1. Convert to async and remove the callback parameter
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

    // 🚀 FIX: Await the query execution
    const [result] = await db.query(query, values);
    return result.insertId;
  },

  // 2. Convert getAll to async as well
  getAll: async () => {
    // 🚀 FIX: Await the query and return the rows directly
    const [rows] = await db.query("SELECT * FROM employees ORDER BY id DESC");
    return rows;
  }
};

module.exports = Employee;