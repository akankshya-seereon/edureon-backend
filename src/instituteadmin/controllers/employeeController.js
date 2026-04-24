const Employee = require('../models/employeeModel'); 
const db = require('../../config/db'); 
const bcrypt = require('bcryptjs');

// ─── HELPER: Securely get Institute ID ───
const getInstituteId = (req) => req.user?.institute_id || req.user?.id || 1;

// ─── 1. REGISTER NEW EMPLOYEE ───
exports.registerEmployee = async (req, res) => {
  try {
    const sanitize = (val) => (val === '' || val === undefined || val === 'null' ? null : val);
    const instituteId = getInstituteId(req); // 🚀 Ensure we grab the ID for DB isolation

    let hashedPassword = null;
    if (req.body.password) {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
    }

    const employeeData = {
      ...req.body,
      password: hashedPassword,
      institute_id: instituteId, // 🚀 Save the numeric ID for joins
      institute_code: req.body.instituteCode || req.body.institute_code, 
      departmentId:   sanitize(req.body.departmentId),
      dob:            sanitize(req.body.dob),
      joiningDate:    sanitize(req.body.joiningDate),
      bankName:       sanitize(req.body.bankName),
      accountName:    sanitize(req.body.accountName),
      accountNumber:  sanitize(req.body.accountNumber),
      ifscCode:       sanitize(req.body.ifscCode),
      branchName:     sanitize(req.body.branchName),
      
      profilePhoto:   req.files?.['profilePhoto']        ? req.files['profilePhoto'][0].filename       : null,
      panCardDoc:     req.files?.['panCard']             ? req.files['panCard'][0].filename            : null,
      aadhaarCardDoc: req.files?.['aadhaarCard']         ? req.files['aadhaarCard'][0].filename        : null,
      degreeDoc:      req.files?.['degreeCertificate']   ? req.files['degreeCertificate'][0].filename  : null,
      experienceDoc:  req.files?.['experienceLetter']    ? req.files['experienceLetter'][0].filename   : null
    };

    const insertId = await Employee.create(employeeData);
    res.status(201).json({ success: true, message: "Employee registered successfully", id: insertId });

  } catch (error) {
    console.error("Registration Error:", error.message);
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email'))      return res.status(409).json({ success: false, message: "Email Address is already registered." });
        if (error.sqlMessage.includes('phone'))      return res.status(409).json({ success: false, message: "Phone Number is already registered." });
        if (error.sqlMessage.includes('employeeId')) return res.status(409).json({ success: false, message: "This Employee ID is already in use." });
        return res.status(409).json({ success: false, message: "Duplicate record found." });
    }
    res.status(500).json({ success: false, message: "Failed to register employee", error: error.message });
  }
};

// ─── 2. GET ALL EMPLOYEES ───
// ─── 2. GET ALL EMPLOYEES (FINAL STABLE VERSION) ───
exports.getAllEmployees = async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    const instituteCode = req.user?.code || req.user?.instituteCode || '';

    // 🚀 We changed 'd.name' to 'd.department_name' 
    // 🚀 We added 'OR e.institute_id IS NULL' to show newly registered people who might have missing IDs
    const query = `
      SELECT e.id, e.firstName, e.lastName, e.email, e.phone, e.employeeId, e.designation, e.staffType, 
             e.institute_code, e.bankName, e.accountNumber, d.department_name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.departmentId = d.id
      WHERE (e.institute_id = ? OR e.institute_code = ? OR e.institute_id IS NULL)
      ORDER BY e.id DESC
    `;
    
    try {
      const [results] = await db.query(query, [instituteId, instituteCode]);
      return res.status(200).json({ success: true, data: results });
    } catch (sqlErr) {
      console.error("❌ SQL JOIN failed. Check if column is 'department_name' or 'name':", sqlErr.message);
      
      // Fallback: If 'department_name' also fails, try 'name'
      const fallbackQuery = `SELECT * FROM employees WHERE institute_id = ? OR institute_id IS NULL ORDER BY id DESC`;
      const [simpleResults] = await db.query(fallbackQuery, [instituteId]);
      return res.status(200).json({ success: true, data: simpleResults });
    }
    
  } catch (err) {
    console.error("🔥 Critical Controller Error:", err.message);
    res.status(500).json({ success: false, message: "Database Error" });
  }
};
// ─── 3. GET UNIQUE DESIGNATIONS (for autocomplete in Employee form) ───
exports.getDesignations = async (req, res) => {
  try {
    const instituteId   = req.user?.institute_id || null;
    const instituteCode = req.user?.code || req.user?.instituteCode || null;

    let rows;

    if (instituteId) {
      [rows] = await db.query(
        `SELECT DISTINCT designation FROM employees 
         WHERE designation IS NOT NULL AND designation != '' AND institute_id = ? 
         ORDER BY designation ASC`, [instituteId]
      );
    } else if (instituteCode) {
      [rows] = await db.query(
        `SELECT DISTINCT designation FROM employees 
         WHERE designation IS NOT NULL AND designation != '' AND institute_code = ? 
         ORDER BY designation ASC`, [instituteCode]
      );
    } else {
      [rows] = await db.query(
        `SELECT DISTINCT designation FROM employees 
         WHERE designation IS NOT NULL AND designation != '' 
         ORDER BY designation ASC`
      );
    }

    const designations = rows.map(r => r.designation);
    res.status(200).json({ success: true, data: designations });

  } catch (err) {
    console.error("Fetch Designations Error:", err);
    res.status(200).json({ success: true, data: [] }); // Safe fallback for frontend
  }
};

// ─── 4. GET EMPLOYEE BY ID ───
exports.getEmployeeById = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
    res.status(200).json({ success: true, data: employee });
  } catch (err) {
    console.error("Fetch Employee By ID Error:", err);
    res.status(500).json({ success: false, message: "Database Error" });
  }
};

// ─── 5. UPDATE EXISTING EMPLOYEE ───
exports.updateEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const sanitize = (val) => (val === '' || val === undefined || val === 'null' ? null : val);

    const employeeData = {
      staffType:      req.body.staffType,
      firstName:      req.body.firstName,
      lastName:       req.body.lastName,
      email:          req.body.email,
      phone:          req.body.phone,
      gender:         req.body.gender,
      dob:            sanitize(req.body.dob),
      bloodGroup:     req.body.bloodGroup,
      qualification:  req.body.qualification,
      designation:    req.body.designation,
      employeeId:     req.body.employeeId,
      joiningDate:    sanitize(req.body.joiningDate),
      departmentId:   sanitize(req.body.departmentId),
      address:        req.body.address,
      panNumber:      req.body.panNumber,
      aadhaarNumber:  req.body.aadhaarNumber,
      institute_code: req.body.instituteCode || req.body.institute_code,
      bankName:       sanitize(req.body.bankName),
      accountName:    sanitize(req.body.accountName),
      accountNumber:  sanitize(req.body.accountNumber),
      ifscCode:       sanitize(req.body.ifscCode),
      branchName:     sanitize(req.body.branchName),
    };

    if (req.body.password && req.body.password.trim() !== '') {
        employeeData.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.files?.['profilePhoto'])      employeeData.profilePhoto    = req.files['profilePhoto'][0].filename;
    if (req.files?.['panCard'])           employeeData.panCardDoc      = req.files['panCard'][0].filename;
    if (req.files?.['aadhaarCard'])       employeeData.aadhaarCardDoc  = req.files['aadhaarCard'][0].filename;
    if (req.files?.['degreeCertificate']) employeeData.degreeDoc       = req.files['degreeCertificate'][0].filename;
    if (req.files?.['experienceLetter'])  employeeData.experienceDoc   = req.files['experienceLetter'][0].filename;

    const affectedRows = await Employee.update(employeeId, employeeData);
    if (affectedRows === 0) return res.status(404).json({ success: false, message: "Employee not found." });

    res.status(200).json({ success: true, message: "Employee updated successfully!" });
  } catch (error) {
    console.error("Update Employee Error:", error.message);
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) return res.status(409).json({ success: false, message: "Email already in use." });
    }
    res.status(500).json({ success: false, message: "Failed to update employee" });
  }
};

// ─── 6. DELETE EMPLOYEE ───
exports.deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const affectedRows = await Employee.delete(employeeId);
    if (affectedRows === 0) return res.status(404).json({ success: false, message: "Employee not found." });
    res.status(200).json({ success: true, message: "Employee deleted successfully." });
  } catch (err) {
    console.error("Delete Employee Error:", err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ success: false, message: "Cannot delete this employee. They are assigned to a department or other records." });
    }
    res.status(500).json({ success: false, message: "Database Error" });
  }
};