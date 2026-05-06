const SyllabusModel = require('../models/syllabusModel');
const db = require('../../config/db');

// 🛡️ HELPER: Securely get Institute ID
const getInstituteId = (req) => {
    if (req.user) return req.user.institute_id || req.user.id;
    return 1; // Default for UI testing
};

// 🚀 POST /api/admin/syllabus (AND ALSO USED FOR PUT UPDATES)
exports.saveSyllabus = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);
        
        const { course_id, specialization_id, batch_id, status, semester_number, syllabus_code } = req.body;
        
        // 🚀 CRITICAL FIX: FormData sends arrays as strings. We MUST parse it back into an array!
        let subjects = req.body.subjects;
        if (typeof subjects === 'string') {
            try {
                subjects = JSON.parse(subjects);
            } catch (e) {
                subjects = [];
            }
        }

        if (!course_id || !batch_id || !subjects || !Array.isArray(subjects)) {
            return res.status(400).json({ success: false, message: "Course, Batch, and valid Subjects are required." });
        }

        // 1. Fetch Real Names from IDs
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

        // 🚀 Capture the uploaded file path
        const filePath = req.file ? `/uploads/syllabus/${req.file.filename}` : null;

        // 2. Prepare 2D array for MySQL Bulk Insert (Must be exactly 17 values to match the Model)
        const allSubjects = [];
        subjects.forEach(sub => {
            allSubjects.push([
                instituteId, 
                course_name, 
                spec_name, 
                batch_name, 
                semNum,
                code, 
                sub.name || 'Untitled Subject', 
                sub.code || 'PENDING', 
                sub.faculty || 'Unassigned', 
                sub.markingSystem || 'Percentage (100%)',
                parseInt(sub.internal) || 0,  
                parseInt(sub.university) || 0,  
                parseInt(sub.laboratory) || 0,  
                parseInt(sub.presentation) || 0, 
                sub.elective ? 1 : 0,         
                dbStatus,
                filePath // 17th Value!
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

// 🚀 Alias the update function to saveSyllabus. 
exports.updateSyllabus = exports.saveSyllabus;

// ── GET /api/admin/syllabus/form-data ──
exports.getFormData = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);

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

        // 🚀 NEW: Fetch the master subject list from the database
        const [subjectMaster] = await db.query(`
            SELECT id, name, code FROM subjects WHERE institute_id = ?
        `, [instituteId]).catch(() => [[]]);

        res.status(200).json({
            success: true,
            data: { 
                courses: courses || [], 
                specializations: specializations || [], 
                batches: batches || [], 
                faculty: faculty || [],
                subjectMaster: subjectMaster || [] // 🚀 Sent to frontend!
            }
        });
    } catch (error) {
        console.error("Syllabus Form Data Error :", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

// ── GET /api/admin/syllabus ──
exports.getSyllabus = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);
        // 🚀 UPDATED: Includes specialization and syllabus_code checks for Edit functionality
        const { course, batch, specialization, syllabus_code } = req.query;
        
        let results;
        if (syllabus_code) {
            results = await SyllabusModel.getByCode(instituteId, syllabus_code);
        } else if (course && batch) {
            results = await SyllabusModel.getByFilter(instituteId, course, batch, specialization);
        } else {
            results = await SyllabusModel.getAll(instituteId);
        }
        
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error("Get Syllabus Error :", error);
        res.status(500).json({ success: false, message: "Error fetching syllabus." });
    }
};

// ── DELETE /api/admin/syllabus/:id ──
exports.deleteSyllabus = async (req, res) => {
    try {
        const instituteId = getInstituteId(req);
        const syllabusCode = req.params.id; // 🚀 UPDATED: We pass the syllabus_code from frontend to delete the entire group
        
        await SyllabusModel.deleteByCode(instituteId, syllabusCode);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false });
    }
};