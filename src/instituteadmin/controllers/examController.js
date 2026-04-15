const ExamModel = require('../models/examModel');
const path = require('path');
const fs = require('fs');

exports.getExams = async (req, res) => {
  try {
    // Using both ID and Code for maximum query safety
    const instituteId = req.user.id; 
    const instituteCode = req.user.code;
    
    const exams = await ExamModel.getExams(instituteId, instituteCode);
    
    // 🚀 FIX: Changed 'exams' to 'data' so it perfectly matches your React frontend expectation!
    res.status(200).json({ success: true, data: exams });
  } catch (err) {
    console.error("Get Exams Error:", err);
    res.status(500).json({ success: false, message: "Error fetching exams" });
  }
};

exports.addExam = async (req, res) => {
  try {
    const instituteId = req.user.id; 
    const instituteCode = req.user.code;
    
    // 🚀 FIX: Extract ALL the fields sent by the React FormData
    const { 
      title, subject, examType, semester, batch, year, 
      examDate, startTime, duration, totalMarks, 
      passingMarks, venue, assignedFaculty 
    } = req.body;
    
    if (!title || !subject || !examDate || !startTime) {
      return res.status(400).json({ success: false, message: "Missing required exam details." });
    }

    // Path handling for the PDF upload
    const filePath = req.file ? `/uploads/exams/${req.file.filename}` : null;

    const id = await ExamModel.addExam({ 
      instituteId,       
      instituteCode, 
      title,             
      subject,
      examType,
      semester: semester ? parseInt(semester.replace(/\D/g, '')) || 1 : null,
      batch,
      year,
      examDate,
      startTime,
      duration: duration ? parseInt(duration) : null,
      totalMarks: totalMarks ? parseInt(totalMarks) : null,
      passingMarks: passingMarks ? parseInt(passingMarks) : null,
      venue,
      faculty_id: assignedFaculty || null, // 🚀 THE MAGIC LINK: Saves the assigned teacher!
      question_paper_path: filePath 
    });
    
    res.status(201).json({ success: true, id, message: "Exam scheduled successfully!" });
  } catch (err) {
    console.error("Add Exam Error:", err);
    res.status(500).json({ success: false, message: "Error adding exam" });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const instituteId = req.user.id;
    const examId = req.params.id; 

    // Retrieve exam to get file path before deletion
    const exam = await ExamModel.getExamById(examId, instituteId);
    
    if (exam && exam.question_paper_path) {
      // Logic to delete the physical PDF from the server
      const fullPath = path.join(__dirname, '../../../../', exam.question_paper_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath); 
      }
    }

    const deleted = await ExamModel.deleteExam(examId, instituteId);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    }

    res.status(200).json({ success: true, message: "Exam deleted successfully." });
  } catch (err) {
    console.error("Delete Exam Error:", err);
    res.status(500).json({ success: false, message: "Error deleting exam" });
  }
};

exports.downloadPaper = async (req, res) => {
  try {
    const instituteId = req.user.id;
    const examId = req.params.id;

    const exam = await ExamModel.getExamById(examId, instituteId);
    
    if (!exam || !exam.question_paper_path) {
      return res.status(404).json({ success: false, message: "PDF not found for this exam." });
    }

    const filePath = path.join(__dirname, '../../../../', exam.question_paper_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File physically missing from server." });
    }

    res.download(filePath); 
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({ success: false, message: "Error downloading file" });
  }
};

// ==========================================
// 🚀 NEW: MARKS ENTRY FUNCTIONS
// ==========================================

// Fetch students for a specific exam to populate the grading table
exports.getExamStudents = async (req, res) => {
    try {
        const examId = req.params.id;
        const instituteId = req.user.id;
        
        // This will fetch students belonging to the batch assigned to this exam
        const students = await ExamModel.getStudentsForExam(examId, instituteId);
        
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('[ExamController] Get Students Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

// Save the submitted marks array to the database
exports.saveResults = async (req, res) => {
    try {
        // 🚀 FIX: Support exam ID from the URL params and the 'students' array from React
        const examId = req.params.id || req.body.examId; 
        const results = req.body.students || req.body.results; 

        if (!examId || !results || !Array.isArray(results)) {
             return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        await Promise.all(results.map(async (student) => {
            const theory = parseFloat(student.theory) || 0;
            const practical = parseFloat(student.practical) || 0;
            const total = theory + practical;
            
            let grade = 'F';
            if (total >= 75) grade = 'A';
            else if (total >= 60) grade = 'B';
            else if (total >= 40) grade = 'C';

            const studentId = student.id || student.studentId;
            const finalMarks = student.obtainedMarks !== undefined ? student.obtainedMarks : total;
            const finalGrade = student.grade || grade;

            await ExamModel.saveStudentMarks(examId, studentId, finalMarks, finalGrade);
        }));

        res.status(200).json({ success: true, message: 'Results saved successfully' });
    } catch (error) {
        console.error('[ExamController] Save Results Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save results' });
    }
};