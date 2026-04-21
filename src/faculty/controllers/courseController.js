const db = require('../../config/db');

/**
 * 1. Fetch all courses for the logged-in faculty's institute
 */
exports.getMyCourses = async (req, res) => {
  try {
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;

    if (!instituteId) {
      return res.status(400).json({ success: false, message: "Institute ID missing." });
    }

    // 🚀 FIXED: Replaced '0 AS modules' with a subquery to count actual modules!
    const query = `
      SELECT 
        c.id, 
        c.name AS courseTitle, 
        c.code AS class,        
        c.duration AS academicYear,     
        IF(c.is_active = 1, 'Active', 'Draft') AS status,               
        (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) AS modules                  
      FROM courses c
      WHERE c.institute_id = ?
      ORDER BY c.id DESC
    `;

    const [rows] = await db.query(query, [instituteId]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching courses" });
  }
};

/**
 * 2. Create a new course
 */
exports.createCourse = async (req, res) => {
  try {
    const { courseTitle, className, academicYear, status } = req.body;
    
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;
    const departmentId = req.user.department_id || 1; 

    if (!instituteId) {
      return res.status(400).json({ success: false, message: "Institute ID missing from token." });
    }

    // Convert React status string ('Active'/'Draft' or 'Published') to TinyInt (1/0) for DB
    const isActive = (status === 'Active' || status === 'Published') ? 1 : 0;

    const query = `
      INSERT INTO courses 
      (institute_id, department_id, name, code, duration, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      instituteId,
      departmentId,
      courseTitle,
      className,
      academicYear,
      isActive
    ]);

    res.status(201).json({ success: true, message: "Course saved successfully!", id: result.insertId });
  } catch (error) {
    console.error("Insert Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Get Course Details
 */
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;

    const query = `
      SELECT 
        id, 
        name AS courseTitle, 
        code AS class, 
        duration AS academicYear, 
        IF(is_active = 1, 'Published', 'Draft') AS status
      FROM courses 
      WHERE id = ? AND institute_id = ?
    `;

    const [rows] = await db.query(query, [id, instituteId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Course not found" });

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching course details" });
  }
};

/**
 * 4. Fetch all modules and their nested content for a course
 */
exports.getModules = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Fetch all modules
    const [modules] = await db.query(
      "SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index", 
      [courseId]
    );

    // Fetch nested content for each module
    for (let mod of modules) {
      const [contents] = await db.query(
        "SELECT id, type, label, url, platform FROM module_contents WHERE module_id = ?", 
        [mod.id]
      );
      mod.contents = contents;
      mod.expanded = false; 
    }

    res.status(200).json({ success: true, data: modules });
  } catch (error) {
    console.error("Get Modules Error:", error);
    res.status(500).json({ success: false, message: "Failed to load modules" });
  }
};

/**
 * 5. Sync Modules (Delete old structure and insert new one)
 */
exports.saveModules = async (req, res) => {
  const { courseId } = req.params;
  const { modules } = req.body;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Delete existing modules (Cascade handles the contents)
    await connection.query("DELETE FROM course_modules WHERE course_id = ?", [courseId]);

    // 2. Insert new modules
    for (let i = 0; i < modules.length; i++) {
      const { title, description, contents } = modules[i];

      const [modResult] = await connection.query(
        "INSERT INTO course_modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)",
        [courseId, title, description, i]
      );

      const moduleId = modResult.insertId;

      // 3. Insert content items for this module
      if (contents && contents.length > 0) {
        for (let item of contents) {
          await connection.query(
            "INSERT INTO module_contents (module_id, type, label, url, platform) VALUES (?, ?, ?, ?, ?)",
            [moduleId, item.type, item.label, item.url || null, item.platform || null]
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Course content synced successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Sync Modules Error:", error);
    res.status(500).json({ success: false, message: "Failed to save course content" });
  } finally {
    connection.release();
  }
};

/**
 * 6. Delete Course
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;

    const [result] = await db.query(
      "DELETE FROM courses WHERE id = ? AND institute_id = ?", 
      [id, instituteId]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Not found or unauthorized" });

    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting course" });
  }
};