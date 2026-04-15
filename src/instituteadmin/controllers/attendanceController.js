const AttendanceModel = require('../models/attendanceModel');

// Fetch attendance for the current date
exports.getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const instituteCode = req.user.code; 
    const adminId = req.user.id;

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const rows = await AttendanceModel.getByDate(instituteCode, date);

    // Default structure matching your React frontend
    let adminRecord = { punchIn: null, punchOut: null, status: "Absent" };
    let records = {};

    // Sort DB rows into Admin and Faculty objects
    rows.forEach(row => {
      if (row.user_type === 'institute_admin' && row.user_id === adminId) {
        adminRecord = {
          punchIn: row.punch_in,
          punchOut: row.punch_out,
          status: row.status
        };
      } else if (row.user_type === 'faculty') {
        records[row.user_id] = {
          punchIn: row.punch_in,
          punchOut: row.punch_out,
          status: row.status,
          approvedBy: row.approved_by
        };
      }
    });

    res.status(200).json({ success: true, adminRecord, records });
  } catch (err) {
    console.error("Fetch Attendance Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Save Admin and Faculty attendance
exports.saveAttendance = async (req, res) => {
  try {
    const { date, adminRecord, records } = req.body;
    const instituteCode = req.user.code;
    const adminId = req.user.id;

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const savePromises = [];

    // 1. Queue Admin Record
    if (adminRecord && (adminRecord.punchIn || adminRecord.status !== "Absent")) {
      savePromises.push(
        AttendanceModel.upsertRecord(instituteCode, adminId, 'institute_admin', date, adminRecord)
      );
    }

    // 2. Queue all Faculty Records
    if (records) {
      for (const [facultyId, record] of Object.entries(records)) {
        // Only save if there's actual data to save
        if (record.punchIn || record.status !== "Absent") {
          savePromises.push(
            AttendanceModel.upsertRecord(instituteCode, parseInt(facultyId), 'faculty', date, record)
          );
        }
      }
    }

    // Execute all database queries at the exact same time
    await Promise.all(savePromises);

    res.status(200).json({ success: true, message: 'Attendance saved successfully' });
  } catch (err) {
    console.error("Save Attendance Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};