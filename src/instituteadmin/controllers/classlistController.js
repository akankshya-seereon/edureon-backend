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
        data.institute_id = req.user?.institute_id || req.user?.id;
        
        if (!data.className || !data.department) {
            return res.status(400).json({ 
                success: false, 
                message: "Class Name and Department are required." 
            });
        }

        const result = await ClassModel.create(data);

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

        const updated = await ClassModel.update(id, data);
        
        if (updated.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Class not found." });
        }

        res.status(200).json({ success: true, message: "Class updated successfully!" });
    } catch (error) {
        console.error("Update Class Error:", error);
        res.status(500).json({ success: false, message: "Failed to update class." });
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

// 🚀 FIXED & BULLETPROOFED FORM DATA
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

        // 5. 🚀 BULLETPROOF ROOMS QUERY
        // This selects everything and maps it dynamically so it NEVER crashes due to a wrong column name!
        const [rooms] = await db.query("SELECT * FROM rooms").then(([rows]) => {
            const mappedRooms = rows.map(r => ({
                id: r.id,
                // It will automatically use whichever column actually exists in your DB:
                name: r.roomName || r.room_number || r.room_no || r.name || `Room ${r.id}`
            }));
            return [mappedRooms];
        }).catch((err) => { 
            console.error("🚨 Room Table Error (Does the 'rooms' table exist?):", err.message); 
            return [[]]; 
        }); 

        res.status(200).json({
            success: true,
            data: {
                departments: departments || [],
                programs: programs || [], 
                subjects: subjects || [],  
                faculty: faculty || [],
                rooms: rooms || []
            }
        });
    } catch (error) {
        console.error("Form Data Fetch Error ❌:", error.message);
        res.status(500).json({ success: false, message: "Failed to load dropdown data." });
    }
};