const db = require('../../config/db');

exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;

    //  High-speed parallel fetching
    const [
      [profileRows], 
      [attendanceRows], 
      [feeRows],
      [classRows],
      [assignmentStats] 
    ] = await Promise.all([
      // 1. Profile: Joins with 'courses' to get the real name (Btech CSE)
      db.query(`
        SELECT s.first_name, s.last_name, c.course_name as course, s.section, s.student_code as rollNo 
        FROM students s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE s.id = ?
      `, [studentId]),

      // 2. Attendance: Counts Present + Late
      db.query(`
        SELECT COUNT(*) as total, COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as attended 
        FROM attendance 
        WHERE user_id = ? AND user_type = 'student'
      `, [studentId]),

      // 3. Fees: Calculates remaining balance
      db.query(`SELECT (total_amount - paid_amount) as balance, due_date FROM fees WHERE student_id = ?`, [studentId]),

      // 4. Timetable: Finds today's classes for the student's section
      db.query(`
        SELECT s.subject_name as subject, t.start_time, t.end_time, t.room_number as room 
        FROM timetable t 
        JOIN subjects s ON t.subject_id = s.id 
        WHERE t.section = (SELECT section FROM students WHERE id = ?) 
        AND t.day_of_week = DAYNAME(CURDATE())
      `, [studentId]),
      
      // 5. Assignments: Calculates Pending vs Completed
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM assignments WHERE status = 'Published' AND course_id = (SELECT course_id FROM students WHERE id = ?)) as total_assigned,
          (SELECT COUNT(*) FROM assignment_submissions WHERE student_id = ?) as completed
      `, [studentId, studentId])
    ]);

    if (profileRows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const s = profileRows[0];
    const att = attendanceRows[0];
    const fee = feeRows[0];
    const stats = assignmentStats[0];

    // Math & Formatting
    const attendancePerc = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;
    
    const dashboardData = {
      profile: {
        name: `${s.first_name} ${s.last_name}`,
        course: s.course || "Not Assigned",
        section: s.section || "N/A",
        rollNo: s.rollNo
      },
      stats: {
        attendance: attendancePerc,
        pendingAssignments: stats.total_assigned - stats.completed, 
        completedAssignments: stats.completed,
        feeDue: fee ? fee.balance : 0,
        feeDueDate: fee ? new Date(fee.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : "N/A" 
      },
      todayClasses: classRows.map(c => ({
        subject: c.subject,
        time: `${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}`,
        room: c.room,
        status: "Upcoming"
      })),
      pendingAssignmentsList: []  
    };

    res.status(200).json({ success: true, data: dashboardData });

  } catch (error) {
    console.error("Dashboard Master Error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};