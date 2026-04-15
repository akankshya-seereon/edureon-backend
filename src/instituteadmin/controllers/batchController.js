const BatchModel = require('../models/batchModel');
const db = require('../../config/db'); 

// --- 📋 EXISTING BATCH FUNCTIONS ---

exports.getBatches = async (req, res) => {
  try {
    const batches = await BatchModel.getAll(req.user.code);
    res.json({ success: true, batches });
  } catch (err) {
    console.error("SQL ERROR IN getBatches:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const batch = await BatchModel.getById(req.params.id, req.user.code);
    if (!batch) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, batch });
  } catch (err) {
    console.error("SQL ERROR IN getBatchById:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createBatch = async (req, res) => {
  try {
    const { sections, studentIds, ...mainData } = req.body;
    const batchData = { ...mainData, institute_code: req.user.code };
    const batchId = await BatchModel.create(batchData, sections, studentIds);
    res.status(201).json({ success: true, batchId });
  } catch (err) {
    console.error("SQL ERROR IN createBatch:", err);
    res.status(500).json({ success: false, message: "Creation failed" });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    await BatchModel.delete(req.params.id, req.user.code);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("SQL ERROR IN deleteBatch:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// --- ⚡ ADMIN "COMMAND CENTER" POWER ---
// This handles Class Creation + Faculty Assignment + Dual-Role Notifications

exports.assignFacultyToBatch = async (req, res) => {
  const connection = await db.getConnection(); 
  try {
    await connection.beginTransaction();

    const { batchId, subjectId, facultyId, schedule, roomNo } = req.body;
    const adminId = req.user.id; 
    const instCode = req.user.code;

    // 1. Fetch Details for the Class and Notifications
    const [[details]] = await connection.query(
      `SELECT b.name as batch_name, b.course_name, b.academic_year, s.subject_name 
       FROM batches b, subjects s 
       WHERE b.id = ? AND s.id = ?`, 
      [batchId, subjectId]
    );

    if (!details) throw new Error("Batch or Subject details not found.");

    // 2. Create the Class Record
    await connection.query(
      `INSERT INTO classes 
       (batch_id, subject_id, faculty_id, schedule, created_by, course_name, class_section, subject, academic_year) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batchId, subjectId, facultyId, schedule, adminId, details.course_name, details.batch_name, details.subject_name, details.academic_year]
    );

    // 3. Notify Faculty (Specific User)
    // We populate 'targetRoles' and 'institute_code' to match your schema
    await connection.query(
      `INSERT INTO notifications (user_id, user_role, institute_code, title, message, targetRoles, status) 
       VALUES (?, 'faculty', ?, 'New Class Assigned', ?, '["faculty"]', 'sent')`,
      [facultyId, instCode, `You have been assigned ${details.subject_name} for ${details.batch_name} at ${schedule}`]
    );

    // 4. Notify Students of that Batch (Broadcast to the course)
    // This uses your 'course' column to show up on the students' notice board
    await connection.query(
      `INSERT INTO notifications (user_role, institute_code, course, title, message, targetRoles, status)
       VALUES ('student', ?, ?, 'New Schedule Updated', ?, '["student"]', 'sent')`,
      [instCode, details.course_name, `New class for ${details.subject_name} scheduled at ${schedule}`]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: "Class assigned and notifications sent!" });

  } catch (err) {
    await connection.rollback();
    console.error("ADMIN POWER FAILED:", err);
    res.status(500).json({ success: false, message: "Assignment failed: " + err.message });
  } finally {
    connection.release();
  }
};