const db = require('../../config/db');

const SyllabusModel = {
    // 🚀 1. Saves the syllabus for ONE specific semester without deleting the others
    saveBulk: async (instituteId, course, spec, batch, semester, subjectsArray) => {
        // Delete ONLY this specific semester to prevent duplicates
        await db.query(
            "DELETE FROM syllabus_subjects WHERE institute_id = ? AND course_name = ? AND specialization = ? AND batch = ? AND semester = ?",
            [instituteId, course, spec, batch, semester]
        );

        if (subjectsArray.length === 0) return true;

        // Insert the new semester subjects (Explicitly including syllabus_code)
        const query = `
            INSERT INTO syllabus_subjects 
            (institute_id, course_name, specialization, batch, semester, syllabus_code, subject_name, subject_code, faculty_name, marking_system, int_marks, uni_marks, lab_marks, pres_marks, is_elective, status) 
            VALUES ?
        `;
        
        const [result] = await db.query(query, [subjectsArray]);
        return result;
    },

    // 🚀 2. Used for showing individual subjects inside the builder
    getByFilter: async (instituteId, course, batch) => {
        const [rows] = await db.query(
            "SELECT * FROM syllabus_subjects WHERE institute_id = ? AND course_name = ? AND batch = ? ORDER BY semester ASC, id ASC", 
            [instituteId, course, batch]
        );
        return rows;
    },

    // 🚀 3. FIXED: The missing 'getAll' function used for the List View screen!
    getAll: async (instituteId) => {
        const [rows] = await db.query(`
            SELECT 
                MAX(id) as id,
                MAX(created_at) as created_at,
                syllabus_code, 
                course_name, 
                specialization as specialization_name, 
                batch as batch_name, 
                semester as semester_number, 
                status
            FROM syllabus_subjects 
            WHERE institute_id = ?
            GROUP BY syllabus_code, course_name, specialization, batch, semester, status
            ORDER BY created_at DESC
        `, [instituteId]);
        return rows;
    }
};

module.exports = SyllabusModel;