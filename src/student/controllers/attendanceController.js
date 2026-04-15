const db = require('../../config/db');

// ─── SHARED LOGIC ──────────────────────────────────────────────────

// 1. Get Today's Punch Status (Teacher/Student Workday)
exports.getPunchStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [punches] = await db.query(
      `SELECT punch_type, punch_time FROM attendance_punches 
       WHERE user_id = ? AND punch_date = ?`,
      [userId, today]
    );

    const status = {
      punchIn: punches.find(p => p.punch_type === 'IN')?.punch_time || null,
      punchOut: punches.find(p => p.punch_type === 'OUT')?.punch_time || null
    };

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching punch status" });
  }
};


// ─── FACULTY LOGIC ─────────────────────────────────────────────────

// 2. Staff Workday Punch (IN/OUT)
exports.punchAttendance = async (req, res) => {
  try {
    const { type } = req.body; 
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('it-IT'); 

    await db.query(
      `INSERT INTO attendance_punches (user_id, punch_type, punch_time, punch_date) VALUES (?, ?, ?, ?)`,
      [userId, type, timeNow, today]
    );

    res.status(200).json({ success: true, time: timeNow });
  } catch (error) {
    res.status(500).json({ success: false, message: "Punch failed." });
  }
};

// 3. Unlock Session (Broadcast class to students)
exports.approveSession = async (req, res) => {
  try {
    const { subjectId, classId, periodId, remarks, date } = req.body;
    const facultyId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO attendance_sessions (faculty_id, subject_id, class_id, period_id, session_date, remarks) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [facultyId, subjectId, classId, periodId, date, remarks]
    );

    const [[session]] = await db.query(`
      SELECT s.*, sub.subject_name 
      FROM attendance_sessions s 
      LEFT JOIN subjects sub ON s.subject_id = sub.id 
      WHERE s.id = ?`, [result.insertId]);

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to unlock session." });
  }
};

// 4. Get Faculty's Broadcast History
exports.getSessionHistory = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const [sessions] = await db.query(`
      SELECT s.*, sub.subject_name 
      FROM attendance_sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.faculty_id = ?
      ORDER BY s.session_date DESC, s.created_at DESC
    `, [facultyId]);

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading session history" });
  }
};

// 5. Get Dropdown Assignments (Subjects and Classes)
exports.getFacultyAssignments = async (req, res) => {
  try {
    const facultyId = req.user.id;

    // Fetching subjects (using subject_name from your DESC output)
    const [subjects] = await db.query(`SELECT id, subject_name FROM subjects`);

    // Fetching classes (using course_name and class_section from your DESC output)
    const [classes] = await db.query(`
      SELECT id, course_name, class_section 
      FROM classes 
      WHERE faculty_id = ?
    `, [facultyId]);

    res.status(200).json({ 
      success: true, 
      subjects, 
      classes 
    });
  } catch (error) {
    console.error("Assignment Load Error:", error);
    res.status(500).json({ success: false, message: "Error loading assignments" });
  }
};

// 6. Faculty: List of Students Waiting for Approval
exports.getPendingApprovals = async (req, res) => {
  try {
    const facultyId = req.user.id;
    console.log(`\n--- FETCHING PENDING APPROVALS ---`);
    console.log(`Teacher ID: ${facultyId}`);

    const [pending] = await db.query(`
      SELECT 
        r.id as record_id, 
        st.first_name, 
        st.roll_no, 
        sub.subject_name, 
        r.status as marked_as,
        s.faculty_id
      FROM attendance_records r
      JOIN attendance_sessions s ON r.session_id = s.id
      LEFT JOIN students st ON r.student_id = st.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE r.approval_status = 'pending' 
      AND s.faculty_id = ?
    `, [facultyId]);

    console.log(`Found ${pending.length} pending records.`);
    res.status(200).json({ success: true, data: pending });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching pending list" });
  }
};

// 7. Faculty: Approve/Reject Student Mark
exports.verifyAttendance = async (req, res) => {
  try {
    const { recordId, action } = req.body; 
    await db.query(
      `UPDATE attendance_records SET approval_status = ? WHERE id = ?`,
      [action, recordId]
    );
    res.status(200).json({ success: true, message: `Attendance ${action}!` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};


// ─── STUDENT LOGIC ─────────────────────────────────────────────────

// 8. Get Available Sessions (Classes open right now)
exports.getAvailableSessions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Using course_id from students table to match session's class_id
    const [sessions] = await db.query(`
      SELECT s.*, sub.subject_name 
      FROM attendance_sessions s
      LEFT JOIN subjects sub ON s.subject_id = sub.id 
      WHERE s.class_id = (SELECT course_id FROM students WHERE id = ?)
      AND s.session_date = ?
      AND s.id NOT IN (SELECT session_id FROM attendance_records WHERE student_id = ?)
    `, [studentId, today, studentId]);

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading available sessions." });
  }
};

// 9. Mark Attendance (Initial Request)
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, status } = req.body;
    const studentId = req.user.id;

    await db.query(
      `INSERT INTO attendance_records (student_id, session_id, status) VALUES (?, ?, ?)`,
      [studentId, sessionId, status]
    );

    res.status(200).json({ success: true, message: "Request sent to teacher!" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Already marked!" });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// 10. Student Personal History
exports.getAttendanceHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [history] = await db.query(`
      SELECT r.status, r.approval_status, r.marked_at, s.session_date, sub.subject_name
      FROM attendance_records r
      JOIN attendance_sessions s ON r.session_id = s.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE r.student_id = ?
      ORDER BY s.session_date DESC
    `, [studentId]);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading history" });
  }
};