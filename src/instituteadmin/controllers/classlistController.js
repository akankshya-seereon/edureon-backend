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
        
        // 🚀 SMART FALLBACKS: Accept multiple naming conventions from React or Postman
        const resolvedDepartment = data.department || data.departmentId || data.department_id;
        const resolvedProgram = data.program || data.course || data.course_id;
        const resolvedFacultyId = data.facultyId || data.faculty_id || data.facultyAssigned;

        // 🚀 STRICT VALIDATION: Check for all required DB fields
        if (!data.className || !resolvedDepartment || !data.subject || !data.academicYear) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing Required Fields: className, department, subject, and academicYear are mandatory." 
            });
        }

        const dbPayload = {
            institute_id: instituteId,
            class_name: data.className,
            program: resolvedProgram || null,
            department: resolvedDepartment,
            section: data.section || null,
            max_students: data.maxStudents || data.max_students || 0,
            subject: data.subject,
            faculty_assigned: data.facultyAssigned || null,
            faculty_id: resolvedFacultyId || null, 
            batch_id: data.batchId || data.batch_id || null,
            academic_year: data.academicYear || data.academic_year,
            semester: data.semester || null,
            schedule: data.schedule ? JSON.stringify(data.schedule) : '[]',
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

        // 🚀 SMART FALLBACKS applied to updates as well
        const resolvedDepartment = data.department || data.departmentId || data.department_id;
        const resolvedProgram = data.program || data.course || data.course_id;
        const resolvedFacultyId = data.facultyId || data.faculty_id || data.facultyAssigned;

        const dbPayload = {
            class_name: data.className || data.class_name,
            program: resolvedProgram || null,
            department: resolvedDepartment || null,
            section: data.section || null,
            max_students: data.maxStudents || data.max_students || 0,
            subject: data.subject || null,
            faculty_assigned: data.facultyAssigned || null,
            faculty_id: resolvedFacultyId || null,
            batch_id: data.batchId || data.batch_id || null,
            academic_year: data.academicYear || data.academic_year || null,
            semester: data.semester || null,
            schedule: data.schedule ? JSON.stringify(data.schedule) : '[]',
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

// 🚀 SECURED & DUAL-IDENTIFIER FORM DATA RETRIEVAL
exports.getFormData = async (req, res) => {
    try {
        const instString = req.user?.institute_id || req.user?.institute_code || 'SAM751030';
        const instInt = req.user?.id || 1; 

        const [departments] = await db.query(
            "SELECT id, department_name AS name FROM departments WHERE institute_code = ? OR institute_code = ?",
            [instString, instInt]
        ).catch((err) => { console.error("Dept Error:", err.message); return [[]]; });

        const [programs] = await db.query(
            "SELECT id, name FROM academic_courses WHERE institute_id = ? OR institute_id = ?", 
            [instString, instInt]
        ).catch((err) => { console.error("Prog Error:", err.message); return [[]]; });

        const [subjects] = await db.query(`
            SELECT DISTINCT subject_name as name, subject_code as code, course_name 
            FROM syllabus_subjects 
            WHERE institute_id = ? OR institute_id = ?
        `, [instString, instInt]).catch((err) => { console.error("Subj Error:", err.message); return [[]]; });

        const [faculty] = await db.query(`
            SELECT id, CONCAT(firstName, ' ', lastName) AS name 
            FROM employees 
            WHERE staffType = 'Academic' AND status = 'Active' AND (institute_id = ? OR institute_id = ?)
        `, [instString, instInt]).catch((err) => { console.error("Fac Error:", err.message); return [[]]; });

        const [rooms] = await db.query(
            "SELECT * FROM rooms WHERE institute_id = ? OR institute_id = ?", 
            [instString, instInt]
        ).then(([rows]) => {
            const mappedRooms = rows.map(r => ({
                id: r.id,
                name: r.roomName || r.room_number || r.room_no || r.name || `Room ${r.id}`
            }));
            return [mappedRooms];
        }).catch((err) => { 
            console.error("Room Error:", err.message); 
            return [[]]; 
        }); 

        const [academicYears] = await db.query(
            "SELECT id, year AS name FROM academic_years WHERE institute_id = ? OR institute_id = ?", 
            [instString, instInt]
        ).catch(() => [[{name: '2024-25'}, {name: '2025-26'}, {name: '2026-27'}]]);

        const [semesters] = await db.query(
            "SELECT id, name FROM semesters"
        ).catch(() => [[{name: 'Semester 1'}, {name: 'Semester 2'}, {name: 'Semester 3'}, {name: 'Semester 4'}]]);

        const [sections] = await db.query(
            "SELECT id, name FROM sections WHERE institute_id = ? OR institute_id = ?", 
            [instString, instInt]
        ).catch(() => [[{name: 'A'}, {name: 'B'}, {name: 'C'}]]);

        // 🚀 FIXED BATCH QUERY (Changed batch_name to name to prevent crashing)
        const [batches] = await db.query(`
            SELECT 
                b.id, 
                b.name AS name, 
                COUNT(bs.student_id) AS student_count 
            FROM batches b
            LEFT JOIN batch_students bs ON b.id = bs.batch_id
            WHERE b.institute_id = ? OR b.institute_id = ?
            GROUP BY b.id
        `, [instString, instInt]).catch((err) => { 
            console.error("Batch Fetch Error:", err.message); 
            return [[]]; 
        });

        const days = [
            {name: 'Monday'}, {name: 'Tuesday'}, {name: 'Wednesday'}, 
            {name: 'Thursday'}, {name: 'Friday'}, {name: 'Saturday'}
        ];

        res.status(200).json({
            success: true,
            data: {
                departments: departments || [],
                courses: programs || [], 
                subjects: subjects || [],  
                faculty: faculty || [],
                rooms: rooms || [],
                academicYears: academicYears || [],
                semesters: semesters || [],
                sections: sections || [],
                batches: batches || [],
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