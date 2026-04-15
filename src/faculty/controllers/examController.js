const ExamModel = require('../model/examModel'); // Make sure path is correct!
const db = require('../../config/db');

// ---------------------------------------------------------
// 1. CREATE EXAM (With Question Builder)
// ---------------------------------------------------------
exports.addExam = async (req, res) => {
  try {
    // React sends { examDetails, questions }
    const { examDetails, questions } = req.body;

    if (!examDetails) {
      return res.status(400).json({ success: false, message: "Missing exam details payload" });
    }

    const instituteId = req.user?.institute_id || req.user?.id; 
    const instituteCode = req.user?.institute_code || 'INST001'; 
    const facultyId = req.user?.role === 'faculty' ? req.user.id : null;
    
    // Parse duration to minutes safely
    let durationInt = 0;
    if (examDetails.duration && examDetails.duration.includes('min')) {
      durationInt = parseInt(examDetails.duration);
    } else if (examDetails.duration && examDetails.duration.includes('hour')) {
      durationInt = parseFloat(examDetails.duration) * 60;
    }

    // 1. Save the Exam Header
    const newExamId = await ExamModel.addExam({
      instituteId,
      instituteCode,
      assignedFaculty: examDetails.assignedFaculty || facultyId, // Save the teacher!
      title: examDetails.examTitle,
      subject: examDetails.subject || examDetails.courseId,
      examType: examDetails.examType,
      semester: parseInt((examDetails.semester || '').replace(/\D/g, '')) || 1,
      batch: examDetails.batch,
      year: examDetails.year,
      examDate: examDetails.date,
      startTime: examDetails.time,
      duration: durationInt,
      totalMarks: parseInt(examDetails.totalMarks) || null,
      passingMarks: parseInt(examDetails.passingMarks) || null,
      venue: examDetails.venue,
      question_paper_path: req.file ? `/uploads/exams/${req.file.filename}` : null
    });

    // 2. Save Questions (If a questions table exists)
    if (questions && questions.length > 0) {
      try {
        const qValues = questions.map(q => [
          newExamId,
          q.text || q.question || '', 
          q.type || 'MCQ',
          parseInt(q.marks) || 0,
          JSON.stringify(q.options || []), 
          q.answer || ''
        ]);
        
        // Quick raw query to insert questions if you have a questions table
        await db.query(
          `INSERT INTO questions (exam_id, question_text, question_type, marks, options, correct_answer) VALUES ?`, 
          [qValues]
        );
      } catch (qErr) {
        console.log("Note: Questions skipped. Ensure a 'questions' table exists in your DB.");
      }
    }

    res.status(201).json({ success: true, id: newExamId, message: "Exam scheduled successfully!" });

  } catch (error) {
    console.error("Add Exam Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------------------------------------------------
// 2. GET FACULTY EXAMS
// ---------------------------------------------------------
exports.getExams = async (req, res) => {
  try {
    const instituteId = req.user?.institute_id || req.user?.id; 
    const facultyId = req.user?.role === 'faculty' ? req.user.id : null;
    
    // Uses the model we updated to filter by faculty_id
    const exams = await ExamModel.getExams(instituteId, facultyId);
    
    res.status(200).json({ success: true, data: exams });
  } catch (error) {
    console.error("Get Exams Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching exams" });
  }
};

// ---------------------------------------------------------
// 3. GET EXAM STUDENTS
// ---------------------------------------------------------
exports.getExamStudents = async (req, res) => {
  try {
    const examId = req.params.id;
    const instituteId = req.user?.institute_id || req.user?.id;
    
    // Uses the model we updated to properly JOIN students and academic_year
    const students = await ExamModel.getStudentsForExam(examId, instituteId);
    
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error("Get Students Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching students" });
  }
};

// ---------------------------------------------------------
// 4. SUBMIT MARKS
// ---------------------------------------------------------
exports.saveResults = async (req, res) => {
  try {
    const examId = req.params.id;
    const { students } = req.body; 

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    // Process each student asynchronously
    await Promise.all(students.map(async (student) => {
      // Calculate total from theory + practical
      const theory = parseFloat(student.theory) || 0;
      const practical = parseFloat(student.practical) || 0;
      const total = theory + practical;
      
      // Calculate Grade securely on the server
      let grade = 'F';
      if (total >= 75) grade = 'A';
      else if (total >= 60) grade = 'B';
      else if (total >= 40) grade = 'C';

      const studentId = student.id || student.studentId;
      
      // Save it using the model
      await ExamModel.saveStudentMarks(examId, studentId, total, grade);
    }));

    res.status(200).json({ success: true, message: "Marks submitted successfully!" });
  } catch (error) {
    console.error("Save Marks Error:", error);
    res.status(500).json({ success: false, message: "Server error saving marks" });
  }
};

// ---------------------------------------------------------
// 5. DELETE EXAM (Optional safety route)
// ---------------------------------------------------------
exports.deleteExam = async (req, res) => {
  try {
    const instituteId = req.user?.institute_id || req.user?.id;
    const deleted = await ExamModel.deleteExam(req.params.id, instituteId);
    if (!deleted) return res.status(404).json({ success: false, message: "Exam not found" });
    res.status(200).json({ success: true, message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};