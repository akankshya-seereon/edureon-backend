const ExamModel = require('../models/examModel');
const db = require('../../config/db');
const path = require('path');
const fs = require('fs');

// 🚀 NEW: Gets dropdown data for the frontend form
exports.getFormData = async (req, res) => {
    try {
        const instituteId = req.user.id || req.user.institute_id;
        const instituteCode = req.user.code;

        const [departments] = await db.query("SELECT id, department_name as name FROM departments WHERE institute_code = ?", [instituteCode]).catch(() => [[]]);
        const [subjects] = await db.query("SELECT id, name, code FROM subjects WHERE institute_id = ?", [instituteId]).catch(() => [[]]);
        const [batches] = await db.query("SELECT id, name FROM batches WHERE institute_id = ?", [instituteId]).catch(() => [[]]);
        const [faculty] = await db.query("SELECT id, CONCAT(firstName, ' ', lastName) AS name FROM employees WHERE status = 'Active'").catch(() => [[]]);
        const [buildings] = await db.query("SELECT id, name FROM buildings").catch(() => [[]]);
        const [rooms] = await db.query(`SELECT r.id, r.room_no as name, b.name as building FROM rooms r LEFT JOIN buildings b ON r.building_id = b.id WHERE r.institute_id = ?`, [instituteId]).catch(() => [[]]);

        let campuses = [];
        try {
            // 🚀 FIXED: Query now explicitly checks for BOTH integer ID and string Code
            const [campRes] = await db.query(
                "SELECT id, name FROM campuses WHERE institute_id = ? OR institute_id = ?", 
                [instituteId, instituteCode]
            );
            campuses = campRes;
        } catch (e) {
            campuses = [{ name: 'Main Campus' }, { name: 'North Campus' }, { name: 'South Campus' }]; 
        }

        res.status(200).json({
            success: true,
            data: { departments, subjects, batches, faculty, buildings, campuses, rooms }
        });
    } catch (error) {
        console.error("Exam Form Data Error:", error);
        res.status(500).json({ success: false, message: "Error fetching setup data." });
    }
};

exports.getExams = async (req, res) => {
  try {
    const instituteId = req.user.id; 
    const instituteCode = req.user.code;
    const exams = await ExamModel.getExams(instituteId, instituteCode);
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
    
    const { 
      title, description, subject, specialization, examType, 
      semester, batch, year, examShift, 
      examDate, startTime, duration, totalMarks, passingMarks, 
      campus, building, block, floor, room, assignedFaculty 
    } = req.body;
    
    if (!title || !subject || !examDate || !startTime) {
      return res.status(400).json({ success: false, message: "Missing required exam details." });
    }

    const filePath = req.file ? `/uploads/question_papers/${req.file.filename}` : null;

    const id = await ExamModel.addExam({ 
      instituteId, instituteCode, title, description, subject, specialization, examType,
      semester: semester ? parseInt(semester.replace(/\D/g, '')) || 1 : null,
      batch, year, examShift, examDate, startTime,
      duration: duration ? parseInt(duration) : null,
      totalMarks: totalMarks ? parseInt(totalMarks) : null,
      passingMarks: passingMarks ? parseInt(passingMarks) : null,
      campus, building, block, floor, room,
      faculty_id: assignedFaculty || null, question_paper_path: filePath 
    });
    
    res.status(201).json({ success: true, id, message: "Exam scheduled successfully!" });
  } catch (err) {
    console.error("Add Exam Error:", err);
    res.status(500).json({ success: false, message: "Error adding exam" });
  }
};

// 🚀 NEW: Update existing exam
exports.updateExam = async (req, res) => {
  try {
    const instituteId = req.user.id; 
    const examId = req.params.id;
    
    const { 
      title, description, subject, specialization, examType, 
      semester, batch, year, examShift, 
      examDate, startTime, duration, totalMarks, passingMarks, 
      campus, building, block, floor, room, assignedFaculty 
    } = req.body;

    const filePath = req.file ? `/uploads/question_papers/${req.file.filename}` : null;

    const updated = await ExamModel.updateExam(examId, instituteId, { 
      title, description, subject, specialization, examType,
      semester: semester ? parseInt(semester.replace(/\D/g, '')) || 1 : null,
      batch, year, examShift, examDate, startTime,
      duration: duration ? parseInt(duration) : null,
      totalMarks: totalMarks ? parseInt(totalMarks) : null,
      passingMarks: passingMarks ? parseInt(passingMarks) : null,
      campus, building, block, floor, room,
      faculty_id: assignedFaculty || null, question_paper_path: filePath 
    });
    
    if (!updated) {
        return res.status(404).json({ success: false, message: "Exam not found or unauthorized." });
    }

    res.status(200).json({ success: true, message: "Exam updated successfully!" });
  } catch (err) {
    console.error("Update Exam Error:", err);
    res.status(500).json({ success: false, message: "Error updating exam" });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const instituteId = req.user.id;
    const examId = req.params.id; 

    const exam = await ExamModel.getExamById(examId, instituteId);
    
    if (exam && exam.question_paper_path) {
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

exports.getExamStudents = async (req, res) => {
    try {
        const examId = req.params.id;
        const instituteId = req.user.id;
        const students = await ExamModel.getStudentsForExam(examId, instituteId);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error('[ExamController] Get Students Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

exports.saveResults = async (req, res) => {
    try {
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