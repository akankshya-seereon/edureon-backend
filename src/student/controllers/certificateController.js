const db = require('../../config/db');

exports.getMyDocuments = async (req, res) => {
  try {
    const studentId = req.user.id; // Gets the ID from the logged-in student's token

    // 🚀 FIX: Changed c.name to c.course_name to match your DB schema
    const [documents] = await db.query(
      `SELECT d.*, c.course_name 
       FROM student_documents d
       LEFT JOIN courses c ON d.course_id = c.id
       WHERE d.student_id = ? AND d.status = 'Published'
       ORDER BY d.created_at DESC`,
      [studentId]
    );

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('[Student Certificate Controller] Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};