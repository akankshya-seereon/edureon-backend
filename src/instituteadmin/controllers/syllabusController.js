const SyllabusModel = require('../models/syllabusModel');
const db = require('../../config/db');

// 🛡️ HELPER: Securely get Institute ID
const getInstituteId = (req) => {
    if (req.user) return req.user.institute_id || req.user.id;
    return 1; // Default for UI testing
};

//  POST /api/admin/syllabus
exports.saveSyllabus = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);
        
        //  ALIGNED WITH NEW FRONTEND PAYLOAD
        const { course_id, specialization_id, batch_id, status, semester_number, syllabus_code, subjects } = req.body;

        if (!course_id || !batch_id || !subjects) {
            return res.status(400).json({ success: false, message: "Course, Batch, and Subjects are required." });
        }

        // 1. Fetch Real Names from IDs (Matches DB Table schema safely)
        const [cRows] = await db.query("SELECT name FROM courses WHERE id = ?", [course_id]);
        const course_name = cRows[0]?.name || 'Unknown Course';

        const [bRows] = await db.query("SELECT name FROM batches WHERE id = ?", [batch_id]);
        const batch_name = bRows[0]?.name || 'Unknown Batch';

        let spec_name = 'General';
        if (specialization_id) {
            const [sRows] = await db.query("SELECT name FROM specializations WHERE id = ?", [specialization_id]);
            if (sRows.length > 0) spec_name = sRows[0].name;
        }

        let dbStatus = status === 'Finalized' ? 'Completed' : 'Ongoing';
        const semNum = parseInt(semester_number) || 1;
        const code = syllabus_code || 'AUTO-GEN';

        // 2. Prepare 2D array for MySQL Bulk Insert
        const allSubjects = [];
        subjects.forEach(sub => {
            allSubjects.push([
                instituteId, 
                course_name, 
                spec_name, 
                batch_name, 
                semNum,
                code, // The new Auto-Generated Code
                sub.name || 'Untitled Subject', 
                sub.code || 'PENDING', 
                sub.faculty || 'Unassigned', 
                sub.markingSystem || 'Percentage (100%)',
                parseInt(sub.internal) || 0,  
                parseInt(sub.university) || 0,  
                parseInt(sub.laboratory) || 0,  
                parseInt(sub.presentation) || 0, 
                sub.elective ? 1 : 0,         
                dbStatus                  
            ]);
        });

        if (allSubjects.length === 0) {
            return res.status(400).json({ success: false, message: "No subjects provided to save." });
        }

        await SyllabusModel.saveBulk(instituteId, course_name, spec_name, batch_name, semNum, allSubjects);
        res.status(201).json({ success: true, message: "Syllabus saved successfully!" });

    } catch (error) {
        console.error("Save Syllabus Error :", error);
        res.status(500).json({ success: false, message: "Failed to save syllabus." });
    }
};

//  GET /api/admin/syllabus/form-data
exports.getFormData = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);

        // FIXED: Using 'courses' instead of 'academic_courses' to match your earlier schema
        const [courses] = await db.query("SELECT id, name, code FROM courses WHERE institute_id = ?", [instituteId]).catch(() => [[]]);
        const [batches] = await db.query("SELECT id, name FROM batches WHERE institute_id = ?", [instituteId]).catch(() => [[]]);
        
        const [specializations] = await db.query(`
            SELECT id, name, course_id FROM specializations 
            WHERE course_id IN (SELECT id FROM courses WHERE institute_id = ?)
        `, [instituteId]).catch(() => [[]]);
        
        const [faculty] = await db.query(`
            SELECT id, CONCAT(firstName, ' ', lastName) AS name 
            FROM employees WHERE staffType = 'Academic' AND status = 'Active'
        `).catch(() => [[]]);

        res.status(200).json({
            success: true,
            data: { courses: courses || [], specializations: specializations || [], batches: batches || [], faculty: faculty || [] }
        });
    } catch (error) {
        console.error("Syllabus Form Data Error :", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

//  GET /api/admin/syllabus
exports.getSyllabus = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);
        const { course, batch } = req.query;
        
        let results;
        if (course && batch) {
            // Filter specific subjects
            results = await SyllabusModel.getByFilter(instituteId, course, batch);
        } else {
            //  FIXED: Fetch all for the List View
            results = await SyllabusModel.getAll(instituteId);
        }
        
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error("Get Syllabus Error :", error);
        res.status(500).json({ success: false, message: "Error fetching syllabus." });
    }
};

exports.deleteSyllabus = async (req, res) => {
    try {
        await db.query("DELETE FROM syllabus_subjects WHERE id = ?", [req.params.id]);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};