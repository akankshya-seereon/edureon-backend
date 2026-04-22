const ClassModel = require('../models/classlistModel');
// 🚀 REQUIRED: We need the db connection to fetch the dropdown lists!
const db = require('../../config/db'); 

exports.getAllClasses = async (req, res) => {
    try {
        const instituteId = req.user.institute_id || req.user.id;
        
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
    console.log("Data Received from Frontend (CREATE):", req.body);
    
    try {
        const data = req.body;
        data.institute_id = req.user.institute_id || req.user.id;
        
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
    console.log("Data Received from Frontend (UPDATE):", req.body);
    
    try {
        const { id } = req.params;
        const data = req.body;

        if (!data.className || !data.department) {
            return res.status(400).json({ 
                success: false, 
                message: "Class Name and Department are required." 
            });
        }

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

// 🚀 NEW: Fetch real dropdown data for the frontend modal
exports.getFormData = async (req, res) => {
    try {
        const [departments] = await db.query("SELECT * FROM departments");
        const [subjects] = await db.query("SELECT * FROM subjects"); 
        const [rooms] = await db.query("SELECT * FROM rooms"); 
        
        // 🚀 THE FIX: Pulling faculty correctly from the employees master table
        // We concatenate firstName and lastName so the React frontend receives a single "name" field to display
        const [faculty] = await db.query(`
            SELECT id, CONCAT(firstName, ' ', lastName) AS name 
            FROM employees 
            WHERE staffType = 'Academic' AND status = 'Active'
        `); 

        res.status(200).json({
            success: true,
            data: {
                departments,
                subjects,
                faculty,
                rooms
            }
        });
    } catch (error) {
        // If it STILL crashes, this will print the EXACT reason in your terminal
        console.error("Form Data Fetch Error ❌:", error.message);
        res.status(500).json({ success: false, message: "Failed to load dropdown data." });
    }
};