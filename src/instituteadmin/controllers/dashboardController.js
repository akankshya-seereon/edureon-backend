const db = require('../../config/db');

exports.getDashboardSummary = async (req, res) => {
  try {
    console.log("\n--- DASHBOARD DATA CHECK ---");
    console.log("req.user full object:", req.user); // Add this to debug

    // ✅ FIXED: institute_id first (set by impersonation), then fall back to id
    const instId = req.user.institute_id || req.user.id;
    const instCode = req.user.code || req.user.institute_code;

    console.log(`Role: ${req.user.role} | Resolved instId: ${instId} | Code: ${instCode}`);

    if (!instId) {
      return res.status(400).json({ success: false, message: "No Institute ID found in token!" });
    }

    const [
      [activeStudentRows],
      [facultyRows],
      [feesCollectedRows],
      [feesDueRows],
      [pendingStudentRows]
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM students WHERE institute_id = ? AND status = "Active"', [instId]),
      db.query('SELECT COUNT(*) as count FROM faculty WHERE institute_id = ?', [instId]).catch(() => [[{ count: 0 }]]),
      db.query('SELECT SUM(paid_amount) as total FROM fees WHERE institute_id = ?', [instId]),
      db.query('SELECT SUM(total_amount - paid_amount) as total FROM fees WHERE institute_id = ? AND status != "Paid"', [instId]),
      db.query('SELECT COUNT(*) as count FROM students WHERE institute_id = ? AND status = "Pending"', [instId])
    ]);

    const [upcomingExams] = await db.query(`
      SELECT subject, title as course,
        DATE_FORMAT(exam_date, '%Y-%m-%d') as date,
        TIME_FORMAT(start_time, '%h:%i %p') as time
      FROM exams
      WHERE (institute_id = ? OR institute_code = ?)
        AND exam_date >= CURDATE()
      ORDER BY exam_date ASC LIMIT 4
    `, [instId, instCode]).catch(err => {
      console.log("Exam Query Error:", err.message);
      return [[]];
    });

    res.status(200).json({
      success: true,
      stats: {
        faculties: facultyRows[0]?.count || 0,
        pending: pendingStudentRows[0]?.count || 0,
        students: activeStudentRows[0]?.count || 0,
        feesCollected: feesCollectedRows[0]?.total || 0,
        feesDue: feesDueRows[0]?.total || 0,
        attendance: "94%"
      },
      exams: upcomingExams,
      chartData: [
        { name: 'Jan', value: 30000 }, { name: 'Feb', value: 45000 },
        { name: 'Mar', value: 75000 }, { name: 'Apr', value: 70000 },
        { name: 'May', value: 90000 },
        { name: 'Jun', value: Number(feesCollectedRows[0]?.total || 0) },
      ]
    });

  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard data" });
  }
};