const BatchModel = require('../models/batchModel');
const db = require('../../config/db'); 

// --- 📋 BATCH CRUD ---

// 1. Get all batches
exports.getBatches = async (req, res) => {
  try {
    const batches = await BatchModel.getAll(req.user.code);
    res.json({ success: true, batches });
  } catch (err) {
    console.error("SQL ERROR IN getBatches:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Get batch by ID (🚀 Re-added to prevent crash)
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

// 3. Create Batch (🚀 Re-added to prevent crash)
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

// 4. Delete Batch (🚀 Re-added to prevent crash)
exports.deleteBatch = async (req, res) => {
  try {
    await BatchModel.delete(req.params.id, req.user.code);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("SQL ERROR IN deleteBatch:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// --- 👥 STUDENT ENROLLMENT ---

// 5. Add Students to a Batch
exports.addStudentsToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { studentIds } = req.body; // Expecting [1, 2, 3...]

    if (!batchId || !studentIds?.length) {
      return res.status(400).json({ success: false, message: "Missing Batch ID or Student list" });
    }

    const values = studentIds.map(sId => [batchId, sId]);
    const query = "INSERT IGNORE INTO batch_students (batch_id, student_id) VALUES ?";

    await db.query(query, [values]);
    res.json({ success: true, message: "Students linked to batch successfully!" });
  } catch (err) {
    console.error("BATCH LINK ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to link students to batch" });
  }
};

// --- ⚡ THE COMMAND CENTER (Class Creation & Auto-Enrollment) ---

// 6. Assign Faculty
exports.assignFacultyToBatch = async (req, res) => {
  const connection = await db.getConnection(); 
  try {
    await connection.beginTransaction();

    const { batchId, subjectId, facultyId, schedule, roomNo } = req.body;
    const adminId = req.user.id; 
    const instCode = req.user.code;

    // 1. Fetch Details (Using explicit JOIN for better performance)
    const [[details]] = await connection.query(
      `SELECT b.name as batch_name, b.course_name, b.academic_year, s.subject_name 
       FROM batches b
       JOIN syllabus_subjects s ON s.id = ?
       WHERE b.id = ?`, 
      [subjectId, batchId]
    );

    if (!details) throw new Error("Batch or Subject details not found.");

    // 2. Create the Class Record
    const [classResult] = await connection.query(
      `INSERT INTO classes 
       (batch_id, subject_id, faculty_id, schedule, created_by, course_name, class_section, subject, academic_year) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [batchId, subjectId, facultyId, JSON.stringify(schedule), adminId, details.course_name, details.batch_name, details.subject_name, details.academic_year]
    );

    const newClassId = classResult.insertId;

    // 3. 🚀 THE MAGIC STEP: Auto-Enrollment
    // This copies all students currently in the Batch into this specific Class
    await connection.query(
      `INSERT INTO enrollments (student_id, class_id, status)
       SELECT student_id, ? AS class_id, 'Active'
       FROM batch_students
       WHERE batch_id = ?`,
      [newClassId, batchId]
    );

    // 4. Notify Faculty
    await connection.query(
      `INSERT INTO notifications (user_id, user_role, institute_code, title, message, targetRoles, status) 
       VALUES (?, 'faculty', ?, 'New Class Assigned', ?, '["faculty"]', 'sent')`,
      [facultyId, instCode, `You have been assigned ${details.subject_name} for ${details.batch_name}`]
    );

    // 5. Notify Students of that Batch
    await connection.query(
      `INSERT INTO notifications (user_role, institute_code, title, message, targetRoles, status)
       VALUES ('student', ?, 'New Schedule Updated', ?, '["student"]', 'sent')`,
      [instCode, `New class for ${details.subject_name} (${details.batch_name}) has been scheduled.`]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: "Class created and all students auto-enrolled!" });

  } catch (err) {
    await connection.rollback();
    console.error("ADMIN POWER FAILED:", err);
    res.status(500).json({ success: false, message: "Assignment failed: " + err.message });
  } finally {
    connection.release();
  }
};