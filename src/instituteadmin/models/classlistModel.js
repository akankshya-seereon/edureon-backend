const db = require('../../config/db');

const ClassList = {
    findAll: async (instituteId) => {
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
            facultyId: row.faculty_id, 
            batchId: row.batch_id, // 🚀 ADDED: Send batch ID back to React
            academicYear: row.academic_year,
            semester: row.semester,
            schedule: typeof row.schedule === 'string' ? JSON.parse(row.schedule) : (row.schedule || []),
            description: row.description,
            students: row.enrolled_students || 0
        }));
    },

    create: async (data) => {
        // Safe fallback for schedule
        const scheduleJson = data.schedule ? (typeof data.schedule === 'string' ? data.schedule : JSON.stringify(data.schedule)) : '[]';

        // Smart mapping catches the data whether the controller uses camelCase OR snake_case
        const className = data.class_name || data.className;
        const maxStudents = data.max_students || data.maxStudents || 0;
        const facultyAssigned = data.faculty_assigned || data.facultyAssigned || null;
        const facultyId = data.faculty_id || data.facultyId || null;
        const batchId = data.batch_id || data.batchId || null; // 🚀 ADDED: Capture Batch ID
        const academicYear = data.academic_year || data.academicYear || null;

        const [result] = await db.query(
            `INSERT INTO classes 
            (institute_id, class_name, program, department, section, max_students, subject, faculty_assigned, faculty_id, batch_id, academic_year, semester, schedule, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // 👈 Added extra ? for batch_id
            [
                data.institute_id, className, data.program, data.department, 
                data.section, maxStudents, data.subject, facultyAssigned, facultyId, batchId, // 👈 Added batchId
                academicYear, data.semester, scheduleJson, data.description
            ]
        );
        return result;
    },

    update: async (id, data) => {
        const scheduleJson = data.schedule ? (typeof data.schedule === 'string' ? data.schedule : JSON.stringify(data.schedule)) : '[]';

        const className = data.class_name || data.className;
        const maxStudents = data.max_students || data.maxStudents || 0;
        const facultyAssigned = data.faculty_assigned || data.facultyAssigned || null;
        const facultyId = data.faculty_id || data.facultyId || null;
        const batchId = data.batch_id || data.batchId || null; // 🚀 ADDED: Capture Batch ID
        const academicYear = data.academic_year || data.academicYear || null;

        const [result] = await db.query(
            `UPDATE classes 
            SET class_name=?, program=?, department=?, section=?, max_students=?, subject=?, faculty_assigned=?, faculty_id=?, batch_id=?, academic_year=?, semester=?, schedule=?, description=? 
            WHERE id=?`, // 👈 Added batch_id=?
            [
                className, data.program, data.department, data.section, 
                maxStudents, data.subject, facultyAssigned, facultyId, batchId, // 👈 Added batchId
                academicYear, data.semester, scheduleJson, data.description, id
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