const ClassModel = require('../models/classlistModel');
const db = require('../../config/db'); 

exports.getAllClasses = async (req, res) => {
    try {
        const instituteId = req.user?.institute_id || req.user?.id;
        
        if (!instituteId) {
            return res.status(400).json({ success: false, message: "Institute ID is missing." });
        }

        const classes = await ClassModel.findAll(instituteId);
        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        console.error("Get All Classes Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch classes." });
    }
};

exports.createClass = async (req, res) => {
    try {
        const data = req.body;
        const instituteId = req.user?.institute_id || req.user?.id;
        
        if (!data.className || !data.department) {
            return res.status(400).json({ 
                success: false, 
                message: "Class Name and Department are required." 
            });
        }

        // 🚀 FIXED: Added batch_id to be saved in the database
        const dbPayload = {
            institute_id: instituteId,
            class_name: data.className,
            program: data.program || null,
            department: data.department || null,
            section: data.section || null,
            max_students: data.maxStudents || 0,
            subject: data.subject || null,
            faculty_assigned: data.facultyAssigned || null,
            faculty_id: data.facultyId || null, 
            batch_id: data.batchId || null, // 👈 Captures the selected batch
            academic_year: data.academicYear || null,
            semester: data.semester || null,
            schedule: data.schedule ? JSON.stringify(data.schedule) : null,
            description: data.description || null
        };

        const result = await ClassModel.create(dbPayload);

        res.status(201).json({ 
            success: true, 
            message: "Class created successfully!", 
            classId: result.insertId 
        });
    } catch (error) {
        console.error("Create Class Error:", error);
        res.status(500).json({ success: false, message: "Failed to create class." });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // 🚀 FIXED: Added batch_id for updates too
        const dbPayload = {
            class_name: data.className,
            program: data.program || null,
            department: data.department || null,
            section: data.section || null,
            max_students: data.maxStudents || 0,
            subject: data.subject || null,
            faculty_assigned: data.facultyAssigned || null,
            faculty_id: data.facultyId || null,
            batch_id: data.batchId || null, // 👈 Updates the selected batch
            academic_year: data.academicYear || null,
            semester: data.semester || null,
            schedule: data.schedule ? JSON.stringify(data.schedule) : null,
            description: data.description || null
        };

        const updated = await ClassModel.update(id, dbPayload);
        
        if (updated.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }

        res.status(200).json({ success: true, message: "Class updated successfully!" });
    } catch (error) {
        console.error("Update Class Error:", error);
        res.status(500).json({ success: false, message: "Failed to update class." });
    }
};

// 🚀 FULLY UPDATED FORM DATA WITH SAFE DATABASE QUERIES
exports.getFormData = async (req, res) => {
    try {
        const instituteId = req.user?.institute_id || req.user?.id || 1;

        // 1. Fetch Departments
        const [departments] = await db.query(
            "SELECT id, department_name AS name FROM departments"
        ).catch((err) => { console.error("Dept Error:", err.message); return [[]]; });

        // 2. Fetch Programs (Course)
        const [programs] = await db.query(
            "SELECT id, name FROM academic_courses WHERE institute_id = ?", 
            [instituteId]
        ).catch((err) => { console.error("Prog Error:", err.message); return [[]]; });

        // 3. Fetch Subjects
        const [subjects] = await db.query(`
            SELECT DISTINCT subject_name as name, subject_code as code, course_name 
            FROM syllabus_subjects 
            WHERE institute_id = ?
        `, [instituteId]).catch((err) => { console.error("Subj Error:", err.message); return [[]]; });

        // 4. Fetch Faculty
        const [faculty] = await db.query(`
            SELECT id, CONCAT(firstName, ' ', lastName) AS name 
            FROM employees 
            WHERE staffType = 'Academic' AND status = 'Active'
        `).catch((err) => { console.error("Fac Error:", err.message); return [[]]; });

        // 5. Fetch Rooms
        const [rooms] = await db.query("SELECT * FROM rooms").then(([rows]) => {
            const mappedRooms = rows.map(r => ({
                id: r.id,
                name: r.roomName || r.room_number || r.room_no || r.name || `Room ${r.id}`
            }));
            return [mappedRooms];
        }).catch((err) => { 
            console.error("Room Error:", err.message); 
            return [[]]; 
        }); 

        // 6. Fetch Academic Years
        const [academicYears] = await db.query(
            "SELECT id, year AS name FROM academic_years WHERE institute_id = ?", [instituteId]
        ).catch(() => [[{name: '2024-25'}, {name: '2025-26'}, {name: '2026-27'}]]);

        // 7. Fetch Semesters
        const [semesters] = await db.query(
            "SELECT id, name FROM semesters"
        ).catch(() => [[{name: 'Semester 1'}, {name: 'Semester 2'}, {name: 'Semester 3'}, {name: 'Semester 4'}, {name: 'Semester 5'}, {name: 'Semester 6'}, {name: 'Semester 7'}, {name: 'Semester 8'}]]);

        // 8. Fetch Sections
        const [sections] = await db.query(
            "SELECT id, name FROM sections WHERE institute_id = ?", [instituteId]
        ).catch(() => [[{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}, {name: 'E'}]]);

        // 9. 🚀 NEW: Fetch Batches and count their students dynamically!
        const [batches] = await db.query(`
            SELECT 
                b.id, 
                b.batch_name AS name, 
                COUNT(bs.student_id) AS student_count 
            FROM batches b
            LEFT JOIN batch_students bs ON b.id = bs.batch_id
            WHERE b.institute_id = ?
            GROUP BY b.id
        `, [instituteId]).catch((err) => { 
            console.error("Batch Fetch Error:", err.message); 
            return [[]]; // Fallback if tables don't exist yet
        });

        // Days of the week are universally static, no DB query needed
        const days = [
            {name: 'Monday'}, {name: 'Tuesday'}, {name: 'Wednesday'}, 
            {name: 'Thursday'}, {name: 'Friday'}, {name: 'Saturday'}
        ];

        // Send EVERYTHING back to React
        res.status(200).json({
            success: true,
            data: {
                departments: departments || [],
                programs: programs || [], 
                subjects: subjects || [],  
                faculty: faculty || [],
                rooms: rooms || [],
                academicYears: academicYears || [],
                semesters: semesters || [],
                sections: sections || [],
                batches: batches || [], // 👈 Sending the batches data to React!
                days: days
            }
        });
    } catch (error) {
        console.error("Form Data Fetch Error ❌:", error.message);
        res.status(500).json({ success: false, message: "Failed to load dropdown data." });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ClassModel.delete(id);

        if (deleted.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }

        res.status(200).json({ success: true, message: "Class deleted successfully!" });
    } catch (error) {
        console.error("Delete Class Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete class." });
    }
};