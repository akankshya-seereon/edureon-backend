const Attendance = require('../model/attendanceModel');
const db = require('../../config/db'); 

/**
 * Helper to get local date string (YYYY-MM-DD)
 * This prevents the UTC "yesterday" bug
 */
const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().split('T')[0];
};

// ==========================================
// 1. PERSONAL ATTENDANCE LOGIC
// ==========================================

/**
 * Get today's attendance status
 */
exports.getTodayRecord = async (req, res) => {
  try {
    const today = getLocalDate();
    const userId = req.user.id;
    
    // Ensure we check for 'faculty' type specifically
    const record = await Attendance.findByUserAndDate(userId, 'faculty', today);
    
    res.json({ success: true, data: record || null });
  } catch (err) {
    console.error("Fetch Today Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Handle Punch In/Out
 */
exports.handlePunch = async (req, res) => {
  try {
    const { type, time } = req.body; 
    // Fallback if frontend doesn't send time
    const punchTime = time || new Date().toTimeString().split(' ')[0]; 
    const today = getLocalDate();
    const userId = req.user.id;

    console.log(`--- PUNCH REQUEST: User ${userId} | Type: ${type} | Date: ${today} ---`);

    // STEP 1: GET FACULTY'S NUMERIC INSTITUTE ID
    const [facultyRows] = await db.query(
      `SELECT f.institute_id, f.institute_code, i.id AS actual_id 
       FROM faculty f
       LEFT JOIN institutes i ON f.institute_code = i.institute_code
       WHERE f.id = ?`, 
      [userId]
    );

    if (facultyRows.length === 0) {
      return res.status(404).json({ success: false, message: "Faculty profile not found." });
    }

    const instituteId = facultyRows[0].actual_id || facultyRows[0].institute_id;
    console.log(`Linking punch to Institute ID: ${instituteId}`);

    if (!instituteId) {
      return res.status(403).json({ 
        success: false, 
        message: "Your profile is not linked to an institute. Please contact Admin." 
      });
    }

    // STEP 2: PROCESS THE PUNCH
    const record = await Attendance.findByUserAndDate(userId, 'faculty', today);

    // --- PUNCH IN ---
    if (type === 'in') {
      if (record && record.punchIn) {
        return res.status(400).json({ success: false, message: "Already punched in for today." });
      }

      const initialStatus = "Pending";

      if (!record) {
        await db.query(
          `INSERT INTO attendance (user_id, user_type, institute_id, date, punch_in, status) 
           VALUES (?, 'faculty', ?, ?, ?, ?)`,
          [userId, instituteId, today, punchTime, initialStatus]
        );
      } else {
        await db.query(
          `UPDATE attendance SET punch_in = ?, status = ?, institute_id = ? 
           WHERE user_id = ? AND user_type = 'faculty' AND date = ?`,
          [punchTime, initialStatus, instituteId, userId, today]
        );
      }

      console.log(` Punch-in saved as PENDING for user ${userId}`);
      return res.json({ success: true, message: "Punch-in requested. Waiting for Admin approval." });
    } 

    // --- PUNCH OUT ---
    if (type === 'out') {
      if (!record || !record.punchIn) {
        return res.status(400).json({ success: false, message: "Cannot punch out without punching in first." });
      }
      
      // 🚀 FIXED: Commented out the 'Pending' check to allow instant punch-outs
      /*
      if (record.status === 'Pending') {
        return res.status(403).json({ success: false, message: "Wait for Admin to approve your punch-in." });
      }
      */

      if (record.punchOut) {
        return res.status(400).json({ success: false, message: "Already punched out for today." });
      }

      await db.query(
        `UPDATE attendance SET punch_out = ? WHERE user_id = ? AND user_type = 'faculty' AND date = ?`,
        [punchTime, userId, today]
      );
      
      console.log(` Punch-out saved for user ${userId}`);
      return res.json({ success: true, message: "Punched out successfully" });
    }

    return res.status(400).json({ success: false, message: "Invalid action." });

  } catch (err) {
    console.error("Punch Error Detail:", err);
    res.status(500).json({ success: false, message: "Database Error: " + err.message });
  }
};

/**
 * Fetch History
 */
exports.getAttendanceHistory = async (req, res) => {
  try {
    const data = await Attendance.getHistory(req.user.id, 'faculty');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
};


// ==========================================
// 2. STUDENT CLASS & VERIFICATION LOGIC (NEW)
// ==========================================

/**
 * Get subjects and classes assigned to this faculty for the dropdowns
 */
exports.getAssignments = async (req, res) => {
  try {
    // 💡 Fallback mock data if you don't have a specific `faculty_assignments` table yet
    const data = {
      subjects: [
        { id: '1', subject_name: 'Mathematics' },
        { id: '2', subject_name: 'Physics' },
        { id: '3', subject_name: 'Computer Science' }
      ],
      classes: [
        { id: '1', course_name: 'B.Tech CS', class_section: 'Batch 2024' },
        { id: '2', course_name: 'B.Sc Physics', class_section: 'Batch 2025' }
      ]
    };
    
    res.json({ success: true, data });
  } catch (err) {
    console.error("Get Assignments Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Create a new session to allow students to mark attendance
 */
exports.createSession = async (req, res) => {
  try {
    const { subjectId, classId, periodId, remarks, date } = req.body;
    const facultyId = req.user.id;
    
    console.log(`Session created by Faculty ${facultyId} for Class ${classId}`);
    
    res.json({ 
      success: true, 
      message: "Class session unlocked successfully." 
    });
  } catch (err) {
    console.error("Create Session Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Fetch students whose attendance status is 'Pending'
 */
exports.getPendingStudents = async (req, res) => {
  try {
    const today = getLocalDate();
    
    const [pendingRows] = await db.query(
      `SELECT a.id AS record_id, s.first_name, s.roll_no, 
              'General' AS subject_name, 'present' AS marked_as
       FROM attendance a
       JOIN students s ON a.user_id = s.id
       WHERE a.user_type = 'student' AND a.status = 'Pending' AND a.date = ?`,
      [today]
    );

    res.json({ success: true, data: pendingRows });
  } catch (err) {
    console.error("Get Pending Students Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Approve or Reject a student's pending attendance
 */
exports.verifyStudent = async (req, res) => {
  try {
    const { recordId, action } = req.body; 
    
    if (!recordId || !action) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const newStatus = action === 'approved' ? 'Present' : 'Absent';

    const [result] = await db.query(
      `UPDATE attendance SET status = ? WHERE id = ? AND user_type = 'student'`,
      [newStatus, recordId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    res.json({ success: true, message: `Student attendance marked as ${newStatus}` });
  } catch (err) {
    console.error("Verify Student Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};