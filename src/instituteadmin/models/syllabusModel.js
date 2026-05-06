const db = require('../../config/db');

const SyllabusModel = {
    // 🚀 1. Saves the syllabus for ONE specific semester
    saveBulk: async (instituteId, course, spec, batch, semester, subjectsArray) => {
        // Delete ONLY this specific semester to prevent duplicates
        await db.query(
            "DELETE FROM syllabus_subjects WHERE institute_id = ? AND course_name = ? AND specialization = ? AND batch = ? AND semester = ?",
            [instituteId, course, spec, batch, semester]
        );

        if (subjectsArray.length === 0) return true;

        const query = `
            INSERT INTO syllabus_subjects 
            (institute_id, course_name, specialization, batch, semester, syllabus_code, subject_name, subject_code, faculty_name, marking_system, int_marks, uni_marks, lab_marks, pres_marks, is_elective, status, file_path) 
            VALUES ?
        `;
        
        const [result] = await db.query(query, [subjectsArray]);
        return result;
    },

    // 🚀 2. Used for the "View Syllabus" screen filters
    getByFilter: async (instituteId, course, batch, spec) => {
        let query = "SELECT * FROM syllabus_subjects WHERE institute_id = ? AND course_name = ? AND batch = ?";
        let params = [instituteId, course, batch];
        
        if (spec) {
            query += " AND specialization = ?";
            params.push(spec);
        }
        query += " ORDER BY semester ASC, id ASC";

        const [rows] = await db.query(query, params);
        return rows;
    },

    // 🚀 3. Used when clicking "Edit" to load a specific syllabus
    getByCode: async (instituteId, syllabusCode) => {
        const [rows] = await db.query(
            "SELECT * FROM syllabus_subjects WHERE institute_id = ? AND syllabus_code = ? ORDER BY semester ASC, id ASC", 
            [instituteId, syllabusCode]
        );
        return rows;
    },

    // 🚀 4. Used for the List View screen
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
                status,
                MAX(file_path) as file_path
            FROM syllabus_subjects 
            WHERE institute_id = ?
            GROUP BY syllabus_code, course_name, specialization, batch, semester, status
            ORDER BY created_at DESC
        `, [instituteId]);
        return rows;
    },

    // 🚀 5. Safely delete an entire syllabus by its code
    deleteByCode: async (instituteId, syllabusCode) => {
        const [result] = await db.query(
            "DELETE FROM syllabus_subjects WHERE institute_id = ? AND syllabus_code = ?", 
            [instituteId, syllabusCode]
        );
        return result;
    }
};

module.exports = SyllabusModel;