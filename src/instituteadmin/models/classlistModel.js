const db = require('../../config/db');

const ClassList = {
    findAll: async (instituteId) => {
        const [rows] = await db.query(`
            SELECT * FROM classes WHERE institute_id = ? ORDER BY id DESC
        `, [instituteId]);

        // Map the database snake_case columns back to camelCase for your React frontend
        return rows.map(row => {
            
            // 🚀 CRITICAL FIX: Safe JSON parsing. If the database has corrupted schedule data, 
            // this prevents the entire GET request from crashing with a 500 error.
            let parsedSchedule = [];
            try {
                parsedSchedule = typeof row.schedule === 'string' ? JSON.parse(row.schedule) : (row.schedule || []);
            } catch (error) {
                console.error(`Failed to parse schedule JSON for class ID: ${row.id}`);
                parsedSchedule = []; 
            }

            return {
                id: row.id,
                className: row.class_name,
                program: row.program,
                specialization: row.specialization, // 🚀 ADDED: Map specialization back to frontend
                department: row.department,
                section: row.section,
                maxStudents: row.max_students,
                subject: row.subject,
                facultyAssigned: row.faculty_assigned,
                facultyId: row.faculty_id, 
                batchId: row.batch_id, 
                academicYear: row.academic_year,
                semester: row.semester,
                schedule: parsedSchedule, 
                description: row.description,
                students: row.enrolled_students || 0
            };
        });
    },

    create: async (data) => {
        // Safe fallback for schedule
        const scheduleJson = data.schedule ? (typeof data.schedule === 'string' ? data.schedule : JSON.stringify(data.schedule)) : '[]';

        // Smart mapping catches the data whether the controller uses camelCase OR snake_case
        const className = data.class_name || data.className;
        const maxStudents = data.max_students || data.maxStudents || 0;
        const facultyAssigned = data.faculty_assigned || data.facultyAssigned || null;
        const facultyId = data.faculty_id || data.facultyId || null;
        const batchId = data.batch_id || data.batchId || null; 
        const academicYear = data.academic_year || data.academicYear || null;
        const specialization = data.specialization || null; // 🚀 ADDED

        const [result] = await db.query(
            `INSERT INTO classes 
            (institute_id, class_name, program, specialization, department, section, max_students, subject, faculty_assigned, faculty_id, batch_id, academic_year, semester, schedule, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // 👈 15 placeholders
            [
                data.institute_id, className, data.program, specialization, data.department, 
                data.section, maxStudents, data.subject, facultyAssigned, facultyId, batchId, 
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
        const batchId = data.batch_id || data.batchId || null; 
        const academicYear = data.academic_year || data.academicYear || null;
        const specialization = data.specialization || null; // 🚀 ADDED

        const [result] = await db.query(
            `UPDATE classes 
            SET class_name=?, program=?, specialization=?, department=?, section=?, max_students=?, subject=?, faculty_assigned=?, faculty_id=?, batch_id=?, academic_year=?, semester=?, schedule=?, description=? 
            WHERE id=?`, 
            [
                className, data.program, specialization, data.department, data.section, 
                maxStudents, data.subject, facultyAssigned, facultyId, batchId, 
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