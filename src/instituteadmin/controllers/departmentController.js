const DepartmentModel = require('../models/departmentModel');

/**
 * 🛠️ Helper: Sanitize Input Data
 * Converts empty strings to null. Prevents MySQL "Incorrect integer value" errors.
 */
const sanitizeData = (data) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === '' || sanitized[key] === undefined || sanitized[key] === null) {
            sanitized[key] = null;
        }
    });
    return sanitized;
};

const departmentController = {
    // ─── GET ALL DEPARTMENTS ───
    getDepartments: async (req, res) => {
        try {
            // Priority: req.instituteId (from middleware) then req.user.code (from JWT)
            const instituteId = req.instituteId || (req.user && req.user.code);
            
            if (!instituteId) {
                return res.status(400).json({ success: false, message: "Institute context missing. Please re-login." });
            }

            const departments = await DepartmentModel.getAll(instituteId);
            res.json({ success: true, data: departments });
        } catch (error) {
            console.error("❌ Get Departments Error:", error.message);
            res.status(500).json({ success: false, message: "Server error while fetching departments" });
        }
    },

    // ─── CREATE DEPARTMENT ───
    createDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const { name, category } = req.body; 

            if (!instituteId) return res.status(400).json({ success: false, message: "Institute context missing" });
            if (!name || !category) {
                return res.status(400).json({ success: false, message: "Department Name and Category are mandatory." });
            }

            const cleanData = sanitizeData(req.body);
            const insertId = await DepartmentModel.create(instituteId, cleanData);
            
            res.status(201).json({ 
                success: true, 
                message: "Department created successfully", 
                insertId 
            });
        } catch (error) {
            console.error("❌ Create Department Error:", error);
            
            // Handle Duplicate Code Error
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: "A department with this code already exists." });
            }

            res.status(500).json({ success: false, message: `Database Error: ${error.sqlMessage || error.message}` });
        }
    },

    // ─── UPDATE DEPARTMENT (For Inline Editing) ───
    updateDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const departmentId = req.params.id;

            if (!instituteId || !departmentId) {
                return res.status(400).json({ success: false, message: "Missing Department ID or Institute Context" });
            }

            const cleanData = sanitizeData(req.body);
            const affectedRows = await DepartmentModel.update(departmentId, instituteId, cleanData);
            
            // Note: affectedRows might be 0 if the user clicks 'Save' without actually changing any text
            if (affectedRows === 0) {
                return res.json({ success: true, message: "No changes were made." });
            }

            res.json({ success: true, message: "Department updated successfully" });
        } catch (error) {
            console.error("❌ Update Department Error:", error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: "The new department code is already in use." });
            }

            res.status(500).json({ success: false, message: `Database Error: ${error.sqlMessage || error.message}` });
        }
    },

    // ─── DELETE DEPARTMENT ───
    deleteDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const departmentId = req.params.id;

            if (!instituteId || !departmentId) {
                return res.status(400).json({ success: false, message: "Delete parameters missing" });
            }

            const affectedRows = await DepartmentModel.delete(departmentId, instituteId);
            
            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Department not found or already deleted." });
            }
            
            res.json({ success: true, message: "Department deleted successfully" });
        } catch (error) {
            console.error("❌ Delete Department Error:", error.message);

            // Handle Foreign Key constraints (e.g., if department has courses assigned to it)
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ 
                    success: false, 
                    message: "Cannot delete department. It is currently linked to courses or employees." 
                });
            }

            res.status(500).json({ success: false, message: "Server error while deleting department" });
        }
    }
};

module.exports = departmentController;