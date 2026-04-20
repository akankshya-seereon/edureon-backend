const Employee = require('../models/employeeModel'); 
const db = require('../../config/db'); 
const bcrypt = require('bcryptjs');

// ─── 1. REGISTER NEW EMPLOYEE ───
exports.registerEmployee = async (req, res) => {
  try {
    const sanitize = (val) => (val === '' || val === undefined ? null : val);

    // 🚀 Hashing the password for security
    let hashedPassword = null;
    if (req.body.password) {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
    }

    const employeeData = {
      ...req.body,
      password: hashedPassword,
      // Handle both camelCase from frontend and snake_case for DB
      institute_code: req.body.instituteCode || req.body.institute_code, 
      departmentId:   sanitize(req.body.departmentId),
      dob:            sanitize(req.body.dob),
      joiningDate:    sanitize(req.body.joiningDate),
      
      // 🏦 🚀 NEW: Bank Details Fields
      bankName:       sanitize(req.body.bankName),
      accountName:    sanitize(req.body.accountName),
      accountNumber:  sanitize(req.body.accountNumber),
      ifscCode:       sanitize(req.body.ifscCode),
      branchName:     sanitize(req.body.branchName),

      // 📄 Documents / File Uploads
      profilePhoto:   req.files?.['profilePhoto'] ? req.files['profilePhoto'][0].filename : null,
      panCardDoc:     req.files?.['panCard'] ? req.files['panCard'][0].filename : null,
      aadhaarCardDoc: req.files?.['aadhaarCard'] ? req.files['aadhaarCard'][0].filename : null,
      degreeDoc:      req.files?.['degreeCertificate'] ? req.files['degreeCertificate'][0].filename : null,
      experienceDoc:  req.files?.['experienceLetter'] ? req.files['experienceLetter'][0].filename : null
    };

    const insertId = await Employee.create(employeeData);
    res.status(201).json({ success: true, message: "Employee registered successfully", id: insertId });

  } catch (error) {
    console.error("Registration Error:", error.message);
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) return res.status(409).json({ success: false, message: "Email Address is already registered." });
        if (error.sqlMessage.includes('phone')) return res.status(409).json({ success: false, message: "Phone Number is already registered." });
        if (error.sqlMessage.includes('employeeId')) return res.status(409).json({ success: false, message: "This Employee ID is already in use." });
        return res.status(409).json({ success: false, message: "Duplicate record found." });
    }
    res.status(500).json({ success: false, message: "Failed to register employee", error: error.message });
  }
};

// ─── 2. GET ALL EMPLOYEES ───
exports.getAllEmployees = async (req, res) => {
  try {
    // Including bank and institute fields in the list for full data access
    const query = `
      SELECT id, firstName, lastName, email, employeeId, designation, staffType, 
      institute_code, bankName, accountNumber 
      FROM employees 
      ORDER BY id DESC
    `;
    const [results] = await db.query(query);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Fetch Employees Error:", err);
    res.status(500).json({ success: false, message: "Database Error" });
  }
};

// ─── 3. GET EMPLOYEE BY ID ───
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

// ─── 4. UPDATE EXISTING EMPLOYEE ───
exports.updateEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const sanitize = (val) => (val === '' || val === undefined ? null : val);

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
      
      // 🏦 🚀 NEW: Bank Details Fields
      bankName:       sanitize(req.body.bankName),
      accountName:    sanitize(req.body.accountName),
      accountNumber:  sanitize(req.body.accountNumber),
      ifscCode:       sanitize(req.body.ifscCode),
      branchName:     sanitize(req.body.branchName),
    };

    // 🚀 Only update password if a new one was actually typed
    if (req.body.password && req.body.password.trim() !== '') {
        employeeData.password = await bcrypt.hash(req.body.password, 10);
    }

    // 📄 Only update files if new ones were uploaded
    if (req.files?.['profilePhoto']) employeeData.profilePhoto = req.files['profilePhoto'][0].filename;
    if (req.files?.['panCard']) employeeData.panCardDoc = req.files['panCard'][0].filename;
    if (req.files?.['aadhaarCard']) employeeData.aadhaarCardDoc = req.files['aadhaarCard'][0].filename;
    if (req.files?.['degreeCertificate']) employeeData.degreeDoc = req.files['degreeCertificate'][0].filename;
    if (req.files?.['experienceLetter']) employeeData.experienceDoc = req.files['experienceLetter'][0].filename;

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

// ─── 5. DELETE EMPLOYEE ───
exports.deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const affectedRows = await Employee.delete(employeeId);
    if (affectedRows === 0) return res.status(404).json({ success: false, message: "Employee not found." });
    
    res.status(200).json({ success: true, message: "Employee deleted successfully." });
  } catch (err) {
    console.error("Delete Employee Error:", err);
    // Prevents deletion if the employee is linked to departments or exam tables
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ success: false, message: "Cannot delete this employee. They are assigned to a department or other records." });
    }
    res.status(500).json({ success: false, message: "Database Error" });
  }
};