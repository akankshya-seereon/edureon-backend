const FeeModel = require('../models/feeModel');

// --- FEE STRUCTURES ---
exports.getStructures = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    const structures = await FeeModel.getAllStructures(instituteId);
    res.json({ success: true, structures });
  } catch (err) {
    // 🛡️ FAULT TOLERANCE: If table doesn't exist, send empty array instead of 500 error
    console.warn("[FeeController] SQL WARNING in getStructures (Table might be missing):", err.message);
    res.json({ success: true, structures: [] }); 
  }
};

exports.addStructure = async (req, res) => {
  try {
    // 1. Explicitly map React keys to MySQL Column names
    const dataToInsert = {
      institute_id: req.user.id || req.user.instituteId,
      course: req.body.course,
      fee_title: req.body.feeTitle || req.body.fee_title,
      amount_per_sem: req.body.amountPerSem || req.body.amount_per_sem,
      total_amount: req.body.totalAmount || req.body.total_amount,
      status: req.body.status || 'Draft',
      // Ensure semesters is stringified for MySQL
      semesters: typeof req.body.semesters === 'string' 
        ? req.body.semesters 
        : JSON.stringify(req.body.semesters || [])
    };

    const id = await FeeModel.createStructure(dataToInsert);
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error("SQL ERROR in addStructure:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Creation failed", 
      error: err.message // Returns exact column error to frontend for debugging
    });
  }
};

// --- PUBLISH FEES ---
exports.publishFees = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    const { selectedFees, selectedClass, selectedYear, totalAmount } = req.body;

    const result = await FeeModel.publishFeesToDb(instituteId, {
      selectedFees,
      selectedClass,
      selectedYear,
      totalAmount
    });

    res.json({ success: true, message: "Fees published successfully", result });
  } catch (err) {
    console.error("SQL ERROR in publishFees:", err.message);
    res.status(500).json({ success: false, message: "Publishing failed" });
  }
};

exports.updateStructure = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    await FeeModel.updateStructureStatus(req.params.id, req.body.status, instituteId);
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("SQL ERROR in updateStructure:", err.message);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.deleteStructure = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    await FeeModel.deleteStructure(req.params.id, instituteId);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(" SQL ERROR in deleteStructure:", err.message);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

// --- FEE NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    const notifications = await FeeModel.getAllNotifications(instituteId);
    res.json({ success: true, notifications });
  } catch (err) {
    // 🛡️ FAULT TOLERANCE: If table doesn't exist, send empty array instead of 500 error
    console.warn("[FeeController] SQL WARNING in getNotifications (Table might be missing):", err.message);
    res.json({ success: true, notifications: [] }); 
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.instituteId;
    
    // Mapping keys for notifications as well
    const data = { 
      ...req.body, 
      institute_id: instituteId,
      // Map frontend 'feeId' to 'fee_id' if necessary
      fee_id: req.body.feeId || req.body.fee_id,
      student_count: req.body.studentCount || req.body.student_count,
      students_snapshot: typeof req.body.students_snapshot === 'string'
        ? req.body.students_snapshot
        : JSON.stringify(req.body.students_snapshot || [])
    };
    
    const id = await FeeModel.createNotification(data);
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error("SQL ERROR in sendNotification:", err.message);
    res.status(500).json({ success: false, message: "Notification failed" });
  }
};