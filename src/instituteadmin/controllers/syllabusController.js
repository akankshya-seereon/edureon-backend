const Syllabus = require('../models/syllabusModel');

exports.addSubject = (req, res) => {
  const subjectData = req.body; // Expects courseName, batch, semester + subject details

  Syllabus.createSubject(subjectData, (err, result) => {
    if (err) {
      console.error("Error saving subject:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.status(201).json({ 
      success: true, 
      message: "Subject added to syllabus", 
      subjectId: result.insertId 
    });
  });
};

exports.getSyllabus = (req, res) => {
  const { course, batch, sem } = req.query;
  
  Syllabus.getBySemester(course, batch, sem, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Error fetching syllabus" });
    res.status(200).json({ success: true, data: results });
  });
};

exports.removeSubject = (req, res) => {
  Syllabus.deleteSubject(req.params.id, (err) => {
    if (err) return res.status(500).json({ success: false, message: "Delete failed" });
    res.status(200).json({ success: true, message: "Subject removed" });
  });
};