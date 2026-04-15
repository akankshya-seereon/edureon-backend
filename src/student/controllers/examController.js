const db = require('../../config/db');

exports.getUpcomingExams = async (req, res) => {
  try {
    const studentId = req.user.id;

    console.log(`\n--- FETCHING EXAMS FOR STUDENT ${studentId} ---`);

    //  We removed the 'institute_code' filter. 
    // Now it just looks for ANY exam that is scheduled for today or the future!
    const [exams] = await db.query(`
      SELECT 
        id, 
        title as name, 
        subject, 
        exam_type as type, 
        exam_date as date, 
        TIME_FORMAT(start_time, '%h:%i %p') as time
      FROM exams 
      WHERE exam_date >= CURDATE()
      ORDER BY exam_date ASC
    `);

    console.log(`✅ SUCCESS: Found ${exams.length} upcoming exams!`);
    console.log(`-----------------------------------------\n`);

    res.status(200).json({ success: true, exams });
  } catch (error) {
    console.error(" Error fetching upcoming exams:", error);
    res.status(500).json({ success: false, message: "Failed to load upcoming exams" });
  }
};

exports.getExamResults = async (req, res) => {
  try {
    const studentId = req.user.id;

    // This query is a masterpiece: it calculates Percentage, Status, and Grade on the fly!
    const [results] = await db.query(`
      SELECT 
        r.id, 
        e.subject, 
        r.marks as marksObtained, 
        e.total_marks as totalMarks, 
        (r.marks / e.total_marks * 100) as percentage,
        CASE 
          WHEN r.marks >= e.passing_marks THEN 'Pass' 
          ELSE 'Fail' 
        END as status,
        CASE
          WHEN (r.marks / e.total_marks * 100) >= 90 THEN 'A+'
          WHEN (r.marks / e.total_marks * 100) >= 80 THEN 'A'
          WHEN (r.marks / e.total_marks * 100) >= 70 THEN 'B+'
          WHEN (r.marks / e.total_marks * 100) >= 60 THEN 'B'
          WHEN (r.marks / e.total_marks * 100) >= 50 THEN 'C'
          ELSE 'F'
        END as grade
      FROM exam_results r
      JOIN exams e ON r.exam_id = e.id
      WHERE r.student_id = ? 
      AND r.absent = 0
      ORDER BY e.exam_date DESC
    `, [studentId]);

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error(" Error fetching exam results:", error);
    res.status(500).json({ success: false, message: "Failed to load exam results" });
  }
};