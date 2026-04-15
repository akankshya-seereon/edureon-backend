const InstituteModel = require('../model/instituteModel'); 
const bcrypt = require('bcrypt');
const db = require('../../config/db'); // 🚀 ADDED: Needed for the deep-dive multi-table queries

exports.getAllInstitutes = async (req, res) => {
  try {
    const institutes = await InstituteModel.getAll();
    res.status(200).json({ success: true, count: institutes.length, data: institutes });
  } catch (err) {
    console.error('[InstituteController] getAllInstitutes:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getInstituteById = async (req, res) => {
  try {
    const institute = await InstituteModel.findById(req.params.id);
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });
    res.status(200).json({ success: true, data: institute });
  } catch (err) {
    console.error('[InstituteController] getInstituteById:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addInstitute = async (req, res) => {
  try {
    const { organisation, directors, legal, branches } = req.body;

    if (!organisation || !organisation.name || !organisation.email) {
      return res.status(400).json({ success: false, message: 'Organisation name and email are required' });
    }

    if (await InstituteModel.emailExists(organisation.email)) {
      return res.status(409).json({ success: false, message: 'Institute with this email already exists' });
    }

    const instituteCode = (organisation.name.substring(0, 3).toUpperCase()) + (organisation.pin || '000');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const id = await InstituteModel.create({ 
      organisation, 
      directors, 
      legal, 
      branches, 
      institute_code: instituteCode,
      admin_email: organisation.email,
      password_hash: passwordHash
    });

    const doc = await InstituteModel.findById(id);

    res.status(201).json({ 
      success: true, 
      message: 'Institute added successfully', 
      data: doc 
    });
  } catch (err) {
    console.error('[InstituteController] addInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

exports.updateInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    if (!await InstituteModel.findById(id)) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }
    
    const { organisation, directors, legal, branches } = req.body;
    res.status(200).json({ success: true, message: 'Institute updated successfully (Placeholder)' });
  } catch (err) {
    console.error('[InstituteController] updateInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body; 
    
    if (is_active === undefined) {
      return res.status(400).json({ success: false, message: 'is_active is required' });
    }
    if (!await InstituteModel.findById(id)) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }
    
    await InstituteModel.toggleStatus(id, is_active);
    res.status(200).json({ success: true, message: `Institute ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error('[InstituteController] toggleStatus:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteInstitute = async (req, res) => {
  try {
    if (!await InstituteModel.findById(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }
    await InstituteModel.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Institute deleted successfully' });
  } catch (err) {
    console.error('[InstituteController] deleteInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================================
// 🚀 NEW: Get Full Institute Details (For Super Admin Dashboard Mini-View)
// ============================================================================
// ============================================================================
// 🚀 UPDATED: Get Full Institute Details (For Super Admin Dashboard Mini-View)
// ============================================================================
exports.getFullInstituteDetails = async (req, res) => {
  const instId = req.params.id;

  try {
    // 1. Fetch the base institute record using your existing model logic 
    const baseInstitute = await InstituteModel.findById(instId);
    
    if (!baseInstitute) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    // 2. Fetch all related data simultaneously for maximum speed
    const [
      [students],
      [faculty],
      [batches],
      [exams],
      [collections],
      [placements],
      [expensesAgg]
    ] = await Promise.all([
      // Students table
      db.query(`
        SELECT 
          id, 
          CONCAT(first_name, ' ', IFNULL(last_name, '')) AS name, 
          roll_no AS roll, 
          standard_name AS batch, 
          status 
        FROM students 
        WHERE institute_id = ? 
        LIMIT 15
      `, [instId]),
      
      // FIXED: Reverted back to 'dept' instead of 'department'
      db.query(`
        SELECT 
          id, 
          name, 
          designation, 
          dept AS subject, 
          status 
        FROM faculty 
        WHERE institute_id = ? 
        LIMIT 15
      `, [instId]),
      
      // Classes/Batches table 
      db.query(`
        SELECT 
          id, 
          course_name AS name, 
          course_name AS course, 
          status, 
          (SELECT COUNT(*) FROM students WHERE class_id = classes.id) AS studentCount 
        FROM classes 
        WHERE institute_id = ? 
        LIMIT 15
      `, [instId]).catch(() => [[ ]]),
      
      // Exams 
      db.query(`SELECT id, title, exam_date AS date, class_id AS batch, subject_id AS subject, status FROM exams WHERE institute_id = ? ORDER BY exam_date DESC LIMIT 10`, [instId]).catch(() => [[ ]]),
      
      // Collections
      db.query(`SELECT id, receipt_no, student_name, amount, payment_date AS date, status FROM fee_collections WHERE institute_id = ? ORDER BY payment_date DESC LIMIT 10`, [instId]).catch(() => [[ ]]),
      
      // Placements
      db.query(`SELECT id, student_name, company, role, package_lpa AS package FROM placements WHERE institute_id = ? ORDER BY id DESC LIMIT 10`, [instId]).catch(() => [[ ]]),

      // Financials (Expenses)
      db.query(`SELECT SUM(amount) AS totalExpenses FROM expenses WHERE institute_id = ?`, [instId]).catch(() => [[{ totalExpenses: 0 }]])
    ]);

    // Calculate total revenue from the collections array
    const revenueCollected = collections.reduce((sum, record) => sum + (Number(record.amount) || 0), 0);

    // 3. Mold the data into the exact format the React UI expects
    const fullDetails = {
      ...baseInstitute, 
      name: baseInstitute.organisation?.name || baseInstitute.name, 
      city: baseInstitute.organisation?.city || "",
      
      // Lists for the tables
      studentsList: students,
      facultyList: faculty,
      batchesList: batches,
      examsList: exams,
      collectionsList: collections,
      placementsList: placements,
      
      // Stats for the top row pills
      totalStudents: students.length, 
      totalFaculty: faculty.length,
      totalBatches: batches.length,
      totalPlacements: placements.length,
      
      // Financials
      totalExpenses: expensesAgg[0]?.totalExpenses || 0,
      revenueCollected: revenueCollected,
      totalCollections: revenueCollected, 
    };

    // 4. Send it to the React Dashboard
    res.json({
      success: true,
      data: fullDetails
    });

  } catch (error) {
    console.error("[InstituteController] getFullInstituteDetails:", error);
    res.status(500).json({ success: false, message: "Failed to load complete institute details." });
  }
};