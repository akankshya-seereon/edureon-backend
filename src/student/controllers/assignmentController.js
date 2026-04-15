const db = require('../../config/db');

exports.getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const instCode = req.user.code; // Get institute code from token

    const [assignments] = await db.query(`
      SELECT 
        a.id, 
        a.title, 
        a.description, 
        a.due_date, 
        a.max_points,
        a.attachment_url,
        c.course_name,
        CASE WHEN sub.id IS NOT NULL THEN 'Submitted' ELSE 'Pending' END as status
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
      WHERE a.course_id = (SELECT course_id FROM students WHERE id = ?)
      AND a.institute_code = ?
      AND a.status = 'Published'
      ORDER BY a.due_date ASC
    `, [studentId, studentId, instCode]);

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    console.error("Fetch Assignments Error:", error);
    res.status(500).json({ success: false, message: "Error loading assignments." });
  }
};