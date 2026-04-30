const db = require('../../config/db');

const DepartmentModel = {
    // ── GET ALL ──────────────────────────────────────────────────
    getAll: async (instituteCode) => {
        const query = `
            SELECT 
                d.id,
                d.institute_code,
                d.department_name,
                d.department_name AS name, -- Alias for frontend compatibility
                d.department_code,
                d.head AS hodId,           -- Map 'head' to 'hodId'
                d.category,
                d.type,
                d.room_number,
                CONCAT(e.firstName, ' ', e.lastName) AS hod_name,
                (SELECT COUNT(*) FROM rooms r WHERE r.department = d.department_name AND r.institute_id = d.institute_code) AS calculated_room_count
            FROM departments d
            LEFT JOIN employees e ON d.head = e.id
            WHERE d.institute_code = ?
            ORDER BY d.department_name ASC
        `;
        const [rows] = await db.query(query, [instituteCode]);
        return rows;
    },

    // ── CREATE ──────────────────────────────────────────────────
    create: async (instituteCode, data) => {
        const query = `
            INSERT INTO departments 
                (institute_code, department_name, department_code, head, category, type, room_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            instituteCode,
            data.name,
            data.department_code,
            data.hodId, // Maps to 'head'
            data.category,
            data.type || 'Academic',
            data.room_number
        ];
        const [result] = await db.query(query, params);
        return result.insertId;
    },

    // ── UPDATE ──────────────────────────────────────────────────
    update: async (id, instituteCode, data) => {
        const query = `
            UPDATE departments SET 
                department_name = ?, 
                department_code = ?, 
                head = ?, 
                category = ?, 
                type = ?, 
                room_number = ?
            WHERE id = ? AND institute_code = ?
        `;
        const params = [
            data.name,
            data.department_code,
            data.hodId,
            data.category,
            data.type,
            data.room_number,
            id,
            instituteCode
        ];
        const [result] = await db.query(query, params);
        return result.affectedRows;
    },

    // ── DELETE ──────────────────────────────────────────────────
    delete: async (id, instituteCode) => {
        const [result] = await db.query(
            'DELETE FROM departments WHERE id = ? AND institute_code = ?',
            [id, instituteCode]
        );
        return result.affectedRows;
    }
};

module.exports = DepartmentModel;