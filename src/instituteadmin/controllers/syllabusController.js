const SyllabusModel = require('../models/syllabusModel');
const db = require('../../config/db');

// 🚀 POST /api/admin/syllabus
// Saves the entire multi-semester syllabus in one bulk operation
exports.saveSyllabus = async (req, res) => {
    try {
        const instituteId = req.user?.institute_id || req.user?.id;
        const { course, specialization, batch, status, semestersData } = req.body;

        if (!instituteId) {
            return res.status(401).json({ success: false, message: "Unauthorized. Institute ID missing." });
        }

        if (!course || !specialization || !batch || !semestersData) {
            return res.status(400).json({ success: false, message: "Course, Specialization, Batch, and Syllabus Data are required." });
        }

        // 🛠️ TRANSLATE STATUS: Convert React's terminology to the Database ENUM ('Upcoming', 'Ongoing', 'Completed')
        let dbStatus = 'Ongoing'; // Default
        if (status === 'In-Progress') dbStatus = 'Ongoing';
        if (status === 'Finalized') dbStatus = 'Completed';

        // 1. Flatten the nested "semestersData" from React into a 2D array for MySQL Bulk Insert
        const allSubjects = [];
        
        for (const [semester, subjects] of Object.entries(semestersData)) {
            if (!Array.isArray(subjects)) continue;
            
            subjects.forEach(sub => {
                // 🛠️ DATA SANITIZATION: Safely fall back to 0 or default strings to prevent SQL crashes
                allSubjects.push([
                    instituteId, 
                    course, 
                    specialization, 
                    batch, 
                    parseInt(semester) || 1,
                    sub.name || 'Untitled Subject', 
                    sub.code || 'PENDING', 
                    sub.faculty || 'Unassigned', 
                    sub.markingSystem || 'Percentage (100%)',
                    parseInt(sub.int) || 0,   // Prevents "" from breaking the INT column
                    parseInt(sub.uni) || 0,   // Prevents "" from breaking the INT column
                    parseInt(sub.lab) || 0,   // Prevents "" from breaking the INT column
                    parseInt(sub.pres) || 0,  // Prevents "" from breaking the INT column
                    sub.elec ? 1 : 0,         // Converts Boolean to MySQL TinyInt
                    dbStatus                  // 🚀 Uses the translated ENUM status!
                ]);
            });
        }

        if (allSubjects.length === 0) {
            return res.status(400).json({ success: false, message: "No subjects provided to save." });
        }

        // 2. Save to Database via Model
        await SyllabusModel.saveBulk(instituteId, course, specialization, batch, allSubjects);

        res.status(201).json({ success: true, message: "Syllabus saved successfully!" });
    } catch (error) {
        console.error("Save Syllabus Error ❌:", error);
        res.status(500).json({ success: false, message: "Failed to save syllabus to database. Check console." });
    }
};

// 🚀 GET /api/admin/syllabus/form-data
exports.getFormData = async (req, res) => {
    try {
        const instituteId = req.user?.institute_id || req.user?.id;

        if (!instituteId) {
            return res.status(401).json({ success: false, message: "Institute context missing." });
        }

        // 1. Fetch Courses for this specific institute
        const [courses] = await db.query(
            "SELECT id, name, code FROM academic_courses WHERE institute_id = ?", 
            [instituteId]
        ).catch(() => [[]]);

        // 2. Fetch Batches for this specific institute
        const [batches] = await db.query(
            "SELECT id, name FROM batches WHERE institute_id = ?", 
            [instituteId]
        ).catch(() => [[]]);

        // 3. Fetch Specializations linked to this institute's courses
        const [specializations] = await db.query(`
            SELECT id, name, course_id FROM specializations 
            WHERE course_id IN (SELECT id FROM academic_courses WHERE institute_id = ?)
        `, [instituteId]).catch(() => [[]]);
        
        // 4. Fetch Academic Faculty
        const [faculty] = await db.query(`
            SELECT id, CONCAT(firstName, ' ', lastName) AS name 
            FROM employees 
            WHERE staffType = 'Academic' AND status = 'Active'
        `).catch((err) => {
            console.error("Faculty Fetch Error:", err.message);
            return [[]];
        });

        res.status(200).json({
            success: true,
            data: { 
                courses: courses || [], 
                specializations: specializations || [], 
                batches: batches || [], 
                faculty: faculty || [] 
            }
        });
    } catch (error) {
        console.error("Syllabus Form Data Critical Error ❌:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error while loading form data." });
    }
};

// 🚀 GET /api/admin/syllabus
exports.getSyllabus = async (req, res) => {
    try {
        const instituteId = req.user?.institute_id || req.user?.id;
        const { course, batch } = req.query;
        
        if (!course || !batch) {
            return res.status(400).json({ success: false, message: "Course and Batch are required filters." });
        }

        const results = await SyllabusModel.getByFilter(instituteId, course, batch);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error("Get Syllabus Error ❌:", error);
        res.status(500).json({ success: false, message: "Error fetching syllabus." });
    }
};