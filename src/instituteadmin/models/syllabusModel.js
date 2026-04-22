const db = require('../../config/db');

const SyllabusModel = {
    // 🚀 Saves the entire syllabus (all semesters and subjects) at once
    saveBulk: async (instituteId, course, spec, batch, subjectsArray) => {
        // 1. Delete the existing syllabus for this specific batch to prevent duplicates
        await db.query(
            "DELETE FROM syllabus_subjects WHERE institute_id = ? AND course_name = ? AND specialization = ? AND batch = ?",
            [instituteId, course, spec, batch]
        );

        // 2. If the user cleared all subjects, stop here
        if (subjectsArray.length === 0) return true;

        // 3. Bulk insert all new subjects across all semesters
        // Must match exactly 15 columns from the Controller!
        const query = `
            INSERT INTO syllabus_subjects 
            (institute_id, course_name, specialization, batch, semester, subject_name, subject_code, faculty_name, marking_system, int_marks, uni_marks, lab_marks, pres_marks, is_elective, status) 
            VALUES ?
        `;
        
        const [result] = await db.query(query, [subjectsArray]);
        return result;
    },

    // Fetch existing syllabus
    getByFilter: async (instituteId, course, batch) => {
        const [rows] = await db.query(
            "SELECT * FROM syllabus_subjects WHERE institute_id = ? AND course_name = ? AND batch = ? ORDER BY semester ASC, id ASC", 
            [instituteId, course, batch]
        );
        return rows;
    }
};

module.exports = SyllabusModel;