const db = require('../../config/db');

const DepartmentModel = {
    getAll: async (instituteId) => {
        const query = `
            SELECT 
                d.id, 
                d.department_name AS name, 
                d.department_code,
                d.head AS hodId, 
                d.lead_role AS leadRole, 
                d.category, 
                d.type, 
                d.description, 
                d.room_number AS roomNumber,
                CONCAT(e.firstName, ' ', e.lastName) AS hod_name 
            FROM departments d
            LEFT JOIN employees e ON d.head = e.id
            WHERE d.institute_code = ?
            ORDER BY d.id DESC
        `;
        try {
            const [rows] = await db.query(query, [instituteId]);
            return rows;
        } catch (error) {
            console.error("❌ Model Error (getAll):", error.message);
            throw error;
        }
    },

    create: async (instituteId, data) => {
        const query = `
            INSERT INTO departments 
            (institute_code, department_name, department_code, head, lead_role, category, type, description, room_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            instituteId,
            data.name || null,
            data.department_code || null,
            data.hodId || null,      
            data.leadRole || null,   
            data.category,           // 🚀 The field that stops the MySQL crash
            data.type || 'Academic',
            data.description || null,
            data.roomNumber || null  
        ];
        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            console.error("❌ Model Error (create):", error.sqlMessage || error.message);
            throw error;
        }
    },

    update: async (id, instituteId, data) => {
        const query = `
            UPDATE departments 
            SET department_name = ?, department_code = ?, head = ?, lead_role = ?, 
                category = ?, description = ?, room_number = ?, type = ?
            WHERE id = ? AND institute_code = ?
        `;
        const values = [
            data.name || null, data.department_code || null, data.hodId || null, data.leadRole || null,
            data.category || null, data.description || null, data.roomNumber || null, data.type || 'Academic',
            id, instituteId
        ];
        try {
            const [result] = await db.query(query, values);
            return result.affectedRows;
        } catch (error) {
            console.error("❌ Model Error (update):", error.sqlMessage || error.message);
            throw error;
        }
    },

    delete: async (id, instituteId) => {
        try {
            const [result] = await db.query(
                'DELETE FROM departments WHERE id = ? AND institute_code = ?',
                [id, instituteId]
            );
            return result.affectedRows;
        } catch (error) {
            console.error("❌ Model Error (delete):", error.message);
            throw error;
        }
    }
};

module.exports = DepartmentModel;