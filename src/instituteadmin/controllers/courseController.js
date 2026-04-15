const db = require('../../config/db');

exports.getMyCourses = async (req, res) => {
  try {
    const instituteCode = req.user.institute_code || req.user.code;

    const query = `
      SELECT 
        id, 
        course_name AS courseTitle, 
        course_code AS class,         
        duration AS academicYear,     
        type AS status,               
        0 AS modules                  
      FROM courses 
      WHERE institute_code = ?
      ORDER BY id DESC
    `;

    const [rows] = await db.query(query, [instituteCode]);

    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error("Fetch Courses Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching courses" });
  }
};