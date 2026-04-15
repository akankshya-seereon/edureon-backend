const db = require('../../config/db');

exports.getDashboardData = async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    // Get local date to match your attendance logic
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const today = new Date(now - offset).toISOString().split('T')[0];

    // 1. REAL DB QUERY: Check the faculty's own attendance status
    const [attendanceRows] = await db.query(
      `SELECT status FROM attendance WHERE user_id = ? AND user_type = 'faculty' AND date = ?`,
      [facultyId, today]
    );
    
    const myAttendance = attendanceRows[0] || null;
    const isPendingApproval = myAttendance?.status === 'Pending';
    const isNotPunchedIn = !myAttendance;

    // 2. BUILD THE RESPONSE DATA
    // Note: We are mocking the schedule/notices until you build those database tables!
    const responseData = {
      stats: {
        totalClasses: 4,
        remainingClasses: 2,
        totalStudents: 120,
        // Dynamic stat based on your actual DB:
        pendingAttendance: isPendingApproval ? 1 : 0 
      },
      schedule: [
        { id: 1, time: "09:00 AM - 10:00 AM", course: "B.Tech CS", subject: "Data Structures", room: "Lab 101", status: "Completed" },
        { id: 2, time: "10:15 AM - 11:15 AM", course: "B.Tech CS", subject: "Algorithms", room: "Room 302", status: "Upcoming" },
        { id: 3, time: "01:00 PM - 02:00 PM", course: "MBA Year 1", subject: "Business Stats", room: "Hall B", status: "Upcoming" },
        { id: 4, time: "03:00 PM - 04:00 PM", course: "B.Tech CS", subject: "Project Review", room: "Lab 102", status: "Upcoming" }
      ],
      // Dynamic Action Card Logic:
      pendingAction: isNotPunchedIn ? {
        course: "Daily Punch-In Required",
        time: "Please mark your attendance"
      } : isPendingApproval ? {
        course: "Punch-In Pending",
        time: "Waiting for Admin Approval"
      } : {
        course: "Algorithms",
        time: "10:15 AM"
      },
      notices: [
        { type: "alert", title: "Exam Papers Due", message: "Mid-term question papers must be submitted by Friday, 5 PM." },
        { type: "info", title: "Staff Meeting", message: "Monthly staff meeting scheduled for Saturday at 10 AM." }
      ]
    };

    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server error loading dashboard" });
  }
};