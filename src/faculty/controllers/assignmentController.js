const db = require('../../config/db');

exports.createAssignment = async (req, res) => {
  try {
    // These names match what you appended to FormData in React
    const { courseId, moduleId, title, description, dueDate, maxPoints, status } = req.body;
    
    // Safety check matching your auth middleware
    const instituteCode = req.user.institute_code || req.user.instituteCode;
    
    // If a file was uploaded, multer attaches it to req.file
    const attachmentPath = req.file ? req.file.path : null;

    const query = `
      INSERT INTO assignments 
      (course_id, module_id, institute_code, title, description, due_date, max_points, attachment_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      courseId, 
      moduleId, 
      instituteCode, 
      title, 
      description, 
      dueDate, 
      maxPoints, 
      attachmentPath, 
      status || 'Draft'
    ]);

    res.status(201).json({ 
      success: true, 
      message: "Assignment created successfully!", 
      id: result.insertId 
    });
  } catch (error) {
    console.error("Assignment Create Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const instituteCode = req.user.institute_code || req.user.instituteCode;
    
    // 🚀 FIXED: We join BOTH tables and use c.name AS course_name
    const query = `
      SELECT 
        a.*, 
        c.name AS course_name, 
        m.title AS module_name 
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN course_modules m ON a.module_id = m.id
      WHERE a.institute_code = ?
      ORDER BY a.created_at DESC
    `;

    const [rows] = await db.query(query, [instituteCode]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Fetch Assignments Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};