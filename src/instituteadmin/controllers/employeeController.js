const Employee = require('../models/employeeModel');
const db = require('../../config/db'); 

// ─── 1. REGISTER NEW EMPLOYEE ───
exports.registerEmployee = async (req, res) => {
  try {
    const sanitize = (val) => (val === '' || val === undefined ? null : val);

    const employeeData = {
      ...req.body,
      departmentId:  sanitize(req.body.departmentId),
      dob:           sanitize(req.body.dob),
      joiningDate:   sanitize(req.body.joiningDate),
      profilePhoto:   req.files?.['profilePhoto'] ? req.files['profilePhoto'][0].filename : null,
      panCardDoc:     req.files?.['panCard'] ? req.files['panCard'][0].filename : null,
      aadhaarCardDoc: req.files?.['aadhaarCard'] ? req.files['aadhaarCard'][0].filename : null,
      degreeDoc:      req.files?.['degreeCertificate'] ? req.files['degreeCertificate'][0].filename : null,
      experienceDoc:  req.files?.['experienceLetter'] ? req.files['experienceLetter'][0].filename : null
    };

    const insertId = await Employee.create(employeeData);
    
    res.status(201).json({ success: true, message: "Employee registered successfully", id: insertId });

  } catch (error) {
    console.error("Controller Error:", error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) return res.status(409).json({ success: false, message: "Email Address is already registered." });
        if (error.sqlMessage.includes('phone')) return res.status(409).json({ success: false, message: "Phone Number is already registered." });
        if (error.sqlMessage.includes('employeeId')) return res.status(409).json({ success: false, message: "This Employee ID is already in use." });
        return res.status(409).json({ success: false, message: "Duplicate record found." });
    }

    res.status(500).json({ success: false, message: "Failed to register employee", error: error.sqlMessage || error.message });
  }
};

// ─── 2. GET ALL EMPLOYEES ───
exports.getAllEmployees = async (req, res) => {
  try {
    const query = "SELECT id, firstName, lastName, email, employeeId, designation, staffType FROM employees ORDER BY id DESC";
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
    
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    
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

    // Prepare text fields
    const employeeData = {
      staffType: req.body.staffType,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      gender: req.body.gender,
      dob: sanitize(req.body.dob),
      bloodGroup: req.body.bloodGroup,
      qualification: req.body.qualification,
      designation: req.body.designation,
      employeeId: req.body.employeeId,
      joiningDate: sanitize(req.body.joiningDate),
      departmentId: sanitize(req.body.departmentId),
      address: req.body.address,
      panNumber: req.body.panNumber,
      aadhaarNumber: req.body.aadhaarNumber,
    };

    // Only update password if a new one was provided
    if (req.body.password && req.body.password.trim() !== '') {
        employeeData.password = req.body.password;
    }

    // Only update files if new ones were uploaded
    if (req.files?.['profilePhoto']) employeeData.profilePhoto = req.files['profilePhoto'][0].filename;
    if (req.files?.['panCard']) employeeData.panCardDoc = req.files['panCard'][0].filename;
    if (req.files?.['aadhaarCard']) employeeData.aadhaarCardDoc = req.files['aadhaarCard'][0].filename;
    if (req.files?.['degreeCertificate']) employeeData.degreeDoc = req.files['degreeCertificate'][0].filename;
    if (req.files?.['experienceLetter']) employeeData.experienceDoc = req.files['experienceLetter'][0].filename;

    const affectedRows = await Employee.update(employeeId, employeeData);
    
    if (affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Employee not found." });
    }

    res.status(200).json({ success: true, message: "Employee updated successfully!" });

  } catch (error) {
    console.error("Update Employee Error:", error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) return res.status(409).json({ success: false, message: "Email already in use by another employee." });
        if (error.sqlMessage.includes('phone')) return res.status(409).json({ success: false, message: "Phone number already in use." });
        if (error.sqlMessage.includes('employeeId')) return res.status(409).json({ success: false, message: "Employee ID already in use." });
    }

    res.status(500).json({ success: false, message: "Failed to update employee", error: error.message });
  }
};

// ─── 5. DELETE EMPLOYEE ───
exports.deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const affectedRows = await Employee.delete(employeeId);
    
    if (affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    
    res.status(200).json({ success: true, message: "Employee deleted successfully." });
  } catch (err) {
    console.error("Delete Employee Error:", err);
    
    // Safety check: Prevents crashing if the employee is assigned as an HOD or Class Teacher
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ 
          success: false, 
          message: "Cannot delete this employee. They are currently assigned to a department or class. Please reassign their duties first." 
        });
    }
    
    res.status(500).json({ success: false, message: "Database Error" });
  }
};