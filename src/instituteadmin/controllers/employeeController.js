const Employee = require('../models/employeeModel');
const db = require('../../config/db'); 

exports.registerEmployee = async (req, res) => {
  try {
    /**
     * Helper to sanitize incoming data.
     * Converts empty strings ('') to null so MySQL integer/date columns don't crash.
     */
    const sanitize = (val) => (val === '' || val === undefined ? null : val);

    // Prepare the data object
    const employeeData = {
      ...req.body,
      
      // 🚀 CRITICAL: Sanitize numeric and date fields
      departmentId:  sanitize(req.body.departmentId),
      dob:           sanitize(req.body.dob),
      joiningDate:   sanitize(req.body.joiningDate),

      // Map uploaded filenames from Multer to the data object using Optional Chaining (?)
      profilePhoto:   req.files?.['profilePhoto'] ? req.files['profilePhoto'][0].filename : null,
      panCardDoc:     req.files?.['panCard'] ? req.files['panCard'][0].filename : null,
      aadhaarCardDoc: req.files?.['aadhaarCard'] ? req.files['aadhaarCard'][0].filename : null,
      degreeDoc:      req.files?.['degreeCertificate'] ? req.files['degreeCertificate'][0].filename : null,
      experienceDoc:  req.files?.['experienceLetter'] ? req.files['experienceLetter'][0].filename : null
    };

    // 🚀 FIX: Using await instead of callbacks
    const insertId = await Employee.create(employeeData);
    
    res.status(201).json({ 
      success: true, 
      message: "Employee registered successfully", 
      id: insertId 
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process employee registration",
      error: error.sqlMessage || error.message
    });
  }
};

/**
 * 🚀 NEW: Fetch all employees for the HOD Dropdown and Staff Tables
 */
exports.getAllEmployees = async (req, res) => {
  try {
    // We use AS first_name and AS last_name to perfectly match what your React Department Dropdown expects
    const query = "SELECT id, firstName AS first_name, lastName AS last_name, designation, staffType FROM employees ORDER BY id DESC";
    
    // 🚀 FIX: Await the promise instead of passing a callback
    const [results] = await db.query(query);
    
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Fetch Employees Error:", err);
    res.status(500).json({ success: false, message: "Database Error" });
  }
};