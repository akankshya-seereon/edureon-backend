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
    getDepartments: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            if (!instituteId) return res.status(400).json({ success: false, message: "Institute context missing" });

            const departments = await DepartmentModel.getAll(instituteId);
            res.json({ success: true, data: departments });
        } catch (error) {
            console.error("❌ Get Departments Error:", error.message);
            res.status(500).json({ success: false, message: "Server error while fetching departments" });
        }
    },

    createDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const { name, category } = req.body; 

            if (!instituteId) return res.status(400).json({ success: false, message: "Institute context missing" });
            if (!name || !category) return res.status(400).json({ success: false, message: "Department Name and Category are mandatory." });

            const cleanData = sanitizeData(req.body);
            const insertId = await DepartmentModel.create(instituteId, cleanData);
            
            res.status(201).json({ success: true, message: "Department created successfully", insertId });
        } catch (error) {
            console.error("❌ Create Department Error:", error);
            res.status(500).json({ success: false, message: `Database Error: ${error.sqlMessage || error.message}` });
        }
    },

    updateDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const departmentId = req.params.id;

            if (!instituteId || !departmentId) return res.status(400).json({ success: false, message: "Missing ID or Context" });

            const cleanData = sanitizeData(req.body);
            const affectedRows = await DepartmentModel.update(departmentId, instituteId, cleanData);
            
            if (affectedRows === 0) return res.status(404).json({ success: false, message: "No changes made or department not found" });

            res.json({ success: true, message: "Department updated successfully" });
        } catch (error) {
            console.error("❌ Update Department Error:", error);
            res.status(500).json({ success: false, message: `Database Error: ${error.sqlMessage || error.message}` });
        }
    },

    deleteDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const departmentId = req.params.id;

            if (!instituteId || !departmentId) return res.status(400).json({ success: false, message: "Delete parameters missing" });

            const affectedRows = await DepartmentModel.delete(departmentId, instituteId);
            if (affectedRows === 0) return res.status(404).json({ success: false, message: "Department not found" });
            
            res.json({ success: true, message: "Department deleted successfully" });
        } catch (error) {
            console.error("❌ Delete Department Error:", error.message);
            res.status(500).json({ success: false, message: "Server error while deleting department" });
        }
    }
};

module.exports = departmentController;