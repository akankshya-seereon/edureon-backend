const db = require('../../config/db');

const ClassList = {
    findAll: async (instituteId) => {
        // No JOIN needed because 'department' is stored as text in your table
        const [rows] = await db.query(`
            SELECT * FROM classes WHERE institute_id = ? ORDER BY id DESC
        `, [instituteId]);

        // Map the database snake_case columns back to camelCase for your React frontend
        return rows.map(row => ({
            id: row.id,
            className: row.class_name,
            program: row.program,
            department: row.department,
            section: row.section,
            maxStudents: row.max_students,
            subject: row.subject,
            facultyAssigned: row.faculty_assigned,
            academicYear: row.academic_year,
            semester: row.semester,
            schedule: typeof row.schedule === 'string' ? JSON.parse(row.schedule) : (row.schedule || []),
            description: row.description,
            students: row.enrolled_students || 0
        }));
    },

    create: async (data) => {
        // Convert schedule array to JSON string for MySQL
        const scheduleJson = data.schedule ? JSON.stringify(data.schedule) : '[]';

        const [result] = await db.query(
            `INSERT INTO classes 
            (institute_id, class_name, program, department, section, max_students, subject, faculty_assigned, academic_year, semester, schedule, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.institute_id, data.className, data.program, data.department, 
                data.section, data.maxStudents, data.subject, data.facultyAssigned, 
                data.academicYear, data.semester, scheduleJson, data.description
            ]
        );
        return result;
    },

    update: async (id, data) => {
        const scheduleJson = data.schedule ? JSON.stringify(data.schedule) : '[]';

        const [result] = await db.query(
            `UPDATE classes 
            SET class_name=?, program=?, department=?, section=?, max_students=?, subject=?, faculty_assigned=?, academic_year=?, semester=?, schedule=?, description=? 
            WHERE id=?`,
            [
                data.className, data.program, data.department, data.section, 
                data.maxStudents, data.subject, data.facultyAssigned, 
                data.academicYear, data.semester, scheduleJson, data.description, id
            ]
        );
        return result;
    },

    delete: async (id) => {
        const [result] = await db.query("DELETE FROM classes WHERE id = ?", [id]);
        return result;
    }
};

module.exports = ClassList;