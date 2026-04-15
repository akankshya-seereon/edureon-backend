const Class = require('../model/classModel');

// 1. Get all classes for the logged-in faculty
exports.getMyClasses = async (req, res) => {
  try {
    const data = await Class.findByFacultyId(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Fetch Classes Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching classes" });
  }
};

// 2. Get students for a specific class
exports.getClassStudents = async (req, res) => {
  try {
    const data = await Class.getEnrolledStudents(req.params.classId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Fetch Students Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching students" });
  }
};

// 3. Save Attendance (Fixed for BIGINT compatibility)
exports.saveAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, attendanceData } = req.body;

    // Convert keys/values to ensure compatibility with BIGINT UNSIGNED and INT
    const values = Object.entries(attendanceData).map(([studentId, status]) => [
      Number(studentId), // Convert string key to Number for student_id (BIGINT)
      Number(classId),   // Convert string param to Number for class_id (INT)
      date, 
      status
    ]);

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: "No attendance data provided" });
    }

    await Class.saveBulkAttendance(values);
    
    res.json({ success: true, message: "Attendance saved successfully" });

  } catch (err) {
    // This will print the EXACT reason (e.g. Foreign Key fail) in your VS Code terminal
    console.error(" DATABASE ERROR:", err.sqlMessage || err.message);

    res.status(500).json({ 
      success: false, 
      message: "Error saving attendance",
      sqlError: err.sqlMessage || err.message // Sends the real error to Postman
    });
  }
};

// 4. Get Assignments for a class
exports.getAssignments = async (req, res) => {
  try {
    const data = await Class.getAssignments(req.params.classId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Fetch Assignments Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching assignments" });
  }
};