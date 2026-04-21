const ClassListModel = require('../models/classlistModel');

// GET ALL CLASSES FOR THE INSTITUTE
exports.getAllClasses = async (req, res) => {
  try {
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;
    
    // Fetch directly from the Model
    const rows = await ClassListModel.getAllByInstitute(instituteId);

    // Map DB snake_case columns back to React camelCase state
    const data = rows.map(row => ({
      id: row.id,
      className: row.class_name,
      program: row.program,
      department: row.department,
      subject: row.subject,
      facultyAssigned: row.faculty_assigned,
      academicYear: row.academic_year,
      semester: row.semester,
      section: row.section,
      maxStudents: row.max_students,
      students: row.enrolled_students || 0,
      description: row.description,
      // Parse the JSON string back into a JavaScript array for React
      schedule: typeof row.schedule === 'string' ? JSON.parse(row.schedule) : row.schedule,
      modules: row.modules || 0
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Admin Fetch Classes Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE A NEW CLASS
exports.createClass = async (req, res) => {
  try {
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;
    
    // Call the model's create method
    const insertId = await ClassListModel.create({ instituteId, ...req.body });

    res.status(201).json({ success: true, message: "Class created successfully", id: insertId });
  } catch (error) {
    console.error("Admin Create Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE AN EXISTING CLASS
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;

    // Call the model's update method
    await ClassListModel.update(id, instituteId, req.body);

    res.status(200).json({ success: true, message: "Class updated successfully" });
  } catch (error) {
    console.error("Admin Update Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE A CLASS
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;

    // Call the model's delete method
    await ClassListModel.delete(id, instituteId);
    
    res.status(200).json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    console.error("Admin Delete Class Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};