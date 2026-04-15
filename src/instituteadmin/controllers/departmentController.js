const DepartmentModel = require('../models/departmentModel');

/**
 * 🛠️ Helper: Sanitize Input Data
 * Converts empty strings to null. This prevents MySQL "Incorrect integer value" 
 * errors for the 'head' (hodId) column and ensures optional strings are stored as NULL.
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
    /**
     * 🔍 Get all departments
     */
    getDepartments: async (req, res) => {
        try {
            // 🚀 Logic: Checks both req.instituteId and req.user.code for compatibility with your middleware
            const instituteId = req.instituteId || (req.user && req.user.code);
            
            if (!instituteId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Institute context is missing. Please log in again." 
                });
            }

            const departments = await DepartmentModel.getAll(instituteId);
            
            res.json({ 
                success: true, 
                data: departments 
            });
        } catch (error) {
            console.error("❌ Get Departments Error:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Server error while fetching departments" 
            });
        }
    },

    /**
     * ✨ Create a new Department
     */
    createDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const { name, category } = req.body; 

            // 1. Context Validation
            if (!instituteId) {
                return res.status(400).json({ success: false, message: "Institute context missing" });
            }
            
            // 2. Strict DB Field Validation (Required by your Schema)
            if (!name || !category) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Department Name and Category are mandatory." 
                });
            }

            // 3. 🚀 Sanitize req.body (Fixes empty HOD, Code, or Room strings)
            const cleanData = sanitizeData(req.body);

            // 4. Call Model
            const insertId = await DepartmentModel.create(instituteId, cleanData);
            
            res.status(201).json({ 
                success: true, 
                message: "Department created successfully", 
                insertId 
            });
        } catch (error) {
            console.error("❌ Create Department Error:", error);
            // Returns the exact SQL error (e.g., missing column) to the React frontend
            res.status(500).json({ 
                success: false, 
                message: `Database Error: ${error.sqlMessage || error.message}` 
            });
        }
    },

    /**
     * 📝 Update an existing Department
     */
    updateDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const departmentId = req.params.id;

            if (!instituteId || !departmentId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Missing ID or Institute context for update" 
                });
            }

            const cleanData = sanitizeData(req.body);

            const affectedRows = await DepartmentModel.update(departmentId, instituteId, cleanData);
            
            if (affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: "No changes made or department not found" 
                });
            }

            res.json({ 
                success: true, 
                message: "Department updated successfully" 
            });
        } catch (error) {
            console.error("❌ Update Department Error:", error);
            res.status(500).json({ 
                success: false, 
                message: `Database Error: ${error.sqlMessage || error.message}` 
            });
        }
    },

    /**
     * 🗑️ Delete a Department
     */
    deleteDepartment: async (req, res) => {
        try {
            const instituteId = req.instituteId || (req.user && req.user.code);
            const departmentId = req.params.id;

            if (!instituteId || !departmentId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Delete parameters missing" 
                });
            }

            const affectedRows = await DepartmentModel.delete(departmentId, instituteId);
            
            if (affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Delete failed: Department not found" 
                });
            }
            
            res.json({ 
                success: true, 
                message: "Department deleted successfully" 
            });
        } catch (error) {
            console.error("❌ Delete Department Error:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Server error while deleting department" 
            });
        }
    }
};

module.exports = departmentController;