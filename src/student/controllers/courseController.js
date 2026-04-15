const db = require('../../config/db');

exports.getMyCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Fetch subjects linked to the student's course_id
    const [courses] = await db.query(`
      SELECT 
        s.id, 
        s.subject_name as title, 
        s.instructor_name as instructor, 
        s.total_modules as modules,
        s.subject_code
      FROM subjects s
      WHERE s.course_id = (SELECT course_id FROM students WHERE id = ?)
    `, [studentId]);

    // 2. Add progress logic 
    // (Currently using a placeholder; in a full system, you'd calculate this from a 'lesson_completions' table)
    const coursesWithProgress = courses.map(course => ({
      ...course,
      progress: Math.floor(Math.random() * 40) + 30, // Mock progress for UI
    }));

    res.status(200).json({
      success: true,
      data: coursesWithProgress
    });

  } catch (error) {
    console.error("Fetch Courses Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching courses." });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const studentId = req.user.id;

    // 1. Fetch Subject Info + Instructor + Academic Year
    const [[subject]] = await db.query(`
      SELECT s.subject_name as title, s.instructor_name as instructor, 
             s.total_modules, s.description, st.academic_year
      FROM subjects s
      JOIN students st ON st.id = ?
      WHERE s.id = ?
    `, [studentId, subjectId]);

    // 2. Fetch all Modules for this subject
    const [modules] = await db.query(`
      SELECT id, title, description, 'Pending' as status, 5 as items 
      FROM modules 
      WHERE subject_id = ? 
      ORDER BY order_index ASC
    `, [subjectId]);

    res.status(200).json({
      success: true,
      data: { ...subject, modules }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading course details" });
  }
};