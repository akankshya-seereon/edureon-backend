const FeeModel = require('../models/feeModel');

// ─── FEE STRUCTURES ──────────────────────────────────────────────────────────

exports.getStructures = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    const structures = await FeeModel.getAllStructures(instituteId);
    res.json({ success: true, structures });
  } catch (err) {
    // 🛡️ FAULT TOLERANCE: If table doesn't exist, send empty array instead of crashing
    console.warn("[FeeController] SQL WARNING in getStructures:", err.message);
    res.json({ success: true, structures: [] }); 
  }
};

exports.addStructure = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;

    // 1. Basic Validation to prevent empty rows
    if (!req.body.course || !req.body.feeTitle || !req.body.amountPerSem) {
      return res.status(400).json({ success: false, message: "Missing required fee data" });
    }

    // 2. Map React keys to MySQL Column names
    const dataToInsert = {
      institute_id: instituteId,
      // Catch the student ID from the React frontend payload (if assigned to one person)
      student_id: req.body.student_id || req.body.studentId || null, 
      course: req.body.course,
      fee_title: req.body.feeTitle || req.body.fee_title,
      amount_per_sem: req.body.amountPerSem || req.body.amount_per_sem,
      total_amount: req.body.totalAmount || req.body.total_amount,
      status: req.body.status || 'Draft',
      // Ensure semesters array is safely stringified for MySQL JSON column
      semesters: typeof req.body.semesters === 'string' 
        ? req.body.semesters 
        : JSON.stringify(req.body.semesters || [])
    };

    const id = await FeeModel.createStructure(dataToInsert);
    res.status(201).json({ success: true, id, message: "Fee structure created successfully" });
  } catch (err) {
    console.error("[FeeController] SQL ERROR in addStructure:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Creation failed", 
      error: err.message 
    });
  }
};

// ─── PUBLISH FEES ────────────────────────────────────────────────────────────

exports.publishFees = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    const { selectedFees, selectedClass, selectedYear, totalAmount } = req.body;

    if (!selectedFees || selectedFees.length === 0) {
      return res.status(400).json({ success: false, message: "No fees selected to publish" });
    }

    const result = await FeeModel.publishFeesToDb(instituteId, {
      selectedFees,
      selectedClass,
      selectedYear,
      totalAmount
    });

    res.json({ success: true, message: "Fees published successfully", result });
  } catch (err) {
    console.error("[FeeController] SQL ERROR in publishFees:", err.message);
    res.status(500).json({ success: false, message: "Publishing failed" });
  }
};

exports.updateStructure = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    await FeeModel.updateStructureStatus(req.params.id, req.body.status, instituteId);
    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("[FeeController] SQL ERROR in updateStructure:", err.message);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.deleteStructure = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    await FeeModel.deleteStructure(req.params.id, instituteId);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("[FeeController] SQL ERROR in deleteStructure:", err.message);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// ─── FEE NOTIFICATIONS ───────────────────────────────────────────────────────

exports.getNotifications = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    // getAllNotifications should join with the students table to return student_name
    const notifications = await FeeModel.getAllNotifications(instituteId);
    res.json({ success: true, notifications });
  } catch (err) {
    console.warn("[FeeController] SQL WARNING in getNotifications:", err.message);
    res.json({ success: true, notifications: [] }); 
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    
    // Safety check - we now expect the array of IDs from React
    const studentIds = req.body.student_ids || [];
    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No students selected" });
    }

    // Safely parse the names for the individual snapshot
    let namesSnapshot = [];
    try {
      namesSnapshot = typeof req.body.students_snapshot === 'string' 
        ? JSON.parse(req.body.students_snapshot) 
        : (req.body.students_snapshot || []);
    } catch(e) {
      namesSnapshot = [];
    }

    // 🚀 CRITICAL FIX: Loop through each selected student and create an individual record
    // This makes history show the "particular student" rather than a group.
    const notificationPromises = studentIds.map((studentId, index) => {
      const dataToInsert = {
        institute_id: instituteId,
        fee_id: req.body.fee_id || req.body.feeId,
        student_id: studentId, // Pushes to the individual student's module
        fee_title: req.body.fee_title || req.body.feeTitle,
        course: req.body.course,
        amount: req.body.amount,
        student_count: 1, // Marked as 1 because it's a personal record
        // Store only the specific student's name in this row's snapshot
        students_snapshot: JSON.stringify([namesSnapshot[index] || "Particular Student"]),
        message: req.body.message || null,
        due_date: req.body.due_date || null,
        payment_status: 'Pending' // Individual payment tracking
      };
      
      return FeeModel.createNotification(dataToInsert);
    });

    // Execute all database insertions simultaneously
    await Promise.all(notificationPromises);

    res.status(201).json({ 
      success: true, 
      message: `Notifications successfully sent to ${studentIds.length} individual students` 
    });
  } catch (err) {
    console.error("[FeeController] SQL ERROR in sendNotification:", err.message);
    res.status(500).json({ success: false, message: "Notification failed" });
  }
}; 

// ─── STUDENT FETCHER FOR SEARCH BAR ──────────────────────────────────────────

exports.getFeeStudents = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    const students = await FeeModel.getStudentsForFees(instituteId);
    
    // Explicitly send as `students` so the frontend array map picks it up perfectly
    res.json({ success: true, students:  students || [] });
  } catch (err) {
    console.warn("[FeeController] Error fetching students for fees:", err.message);
    res.json({ success: true, students: [] }); 
  }
};