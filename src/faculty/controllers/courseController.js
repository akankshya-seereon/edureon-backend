const db = require('../../config/db');

/**
 * 1. Fetch all courses for the logged-in faculty's institute
 */
exports.getMyCourses = async (req, res) => {
  try {
    const instituteCode = req.user.institute_code || req.user.instituteCode || req.user.code;

    if (!instituteCode) {
      return res.status(400).json({ success: false, message: "Institute Code missing." });
    }

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

/**
 * 2. Create a new course
 */
exports.createCourse = async (req, res) => {
  try {
    const { courseTitle, className, academicYear, status } = req.body;
    const instituteCode = req.user.institute_code || req.user.instituteCode || req.user.code;
    const departmentId = req.user.department_id || 1; 

    if (!instituteCode) {
      return res.status(400).json({ success: false, message: "Institute Code missing from token." });
    }

    const query = `
      INSERT INTO courses 
      (institute_code, department_id, course_name, course_code, duration, type) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      instituteCode,
      departmentId,
      courseTitle,
      className,
      academicYear,
      status || 'Draft'
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
    const instituteCode = req.user.institute_code || req.user.instituteCode || req.user.code;

    const query = `
      SELECT id, course_name AS courseTitle, course_code AS class, duration AS academicYear, type AS status
      FROM courses 
      WHERE id = ? AND institute_code = ?
    `;

    const [rows] = await db.query(query, [id, instituteCode]);
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
    const instituteCode = req.user.institute_code || req.user.instituteCode || req.user.code;

    const [result] = await db.query(
      "DELETE FROM courses WHERE id = ? AND institute_code = ?", 
      [id, instituteCode]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Not found" });

    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting course" });
  }
};