const db = require('../../config/db');

const AcademicProgramModel = {
  // ─── GET FULL NESTED ACADEMIC TREE ───────────────────────────────────────
  getFullPrograms: async (instituteId) => {
    try {
      // 1. Get all courses for this institute
      const [courses] = await db.query(
        'SELECT * FROM courses WHERE institute_id = ? ORDER BY id DESC', 
        [instituteId]
      );
      
      if (!courses || courses.length === 0) return [];

      const courseIds = courses.map(c => c.id);
      // 🚀 Safe array for MySQL 'IN (?)' clause
      const safeCourseIds = courseIds.length > 0 ? courseIds : [0]; 

      // 2. Get all specializations for these courses
      const [specializations] = await db.query(
        'SELECT * FROM specializations WHERE course_id IN (?)', 
        [safeCourseIds]
      );

      // 3. Get all batches for these courses
      const [batches] = await db.query(
        'SELECT * FROM batches WHERE course_id IN (?)', 
        [safeCourseIds]
      );

      // 4. Map them together into the nested structure React expects
      return courses.map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        level: course.level,
        duration: course.duration,
        semSystem: course.sem_system,
        semesters: course.semesters,
        building: course.building,
        evaluation: course.evaluation,
        totalIntake: 0,   // React calculates this dynamically from specializations
        currentIntake: 0, // React calculates this dynamically from specializations
        status: 'Active', // Defaulting to Active as the table doesn't use an is_active column
        
        specializations: specializations
          .filter(s => s.course_id === course.id)
          .map(s => ({
            id: s.id, 
            name: s.name, 
            code: s.code, 
            total: s.total_intake !== undefined ? s.total_intake : (s.total || 0), 
            intake: s.current_intake !== undefined ? s.current_intake : (s.intake || 0), 
            active: s.is_active !== undefined ? (s.is_active === 1) : (s.active === 1 || s.active === true)
          })),
          
        batches: batches
          .filter(b => b.course_id === course.id)
          .map(b => {
            // 🚀 Safe JSON Parsing (prevents crashes from bad DB data)
            let parsedSections = [];
            let parsedSpecs = [];
            
            try {
              parsedSections = typeof b.sections === 'string' ? JSON.parse(b.sections) : b.sections;
            } catch(e) { parsedSections = []; }
            
            try {
              parsedSpecs = typeof b.specs === 'string' ? JSON.parse(b.specs) : b.specs;
            } catch(e) { parsedSpecs = []; }

            return {
              id: b.id, 
              name: b.name, 
              // 🚀 FIXED: Safely maps your database's snake_case to the frontend's camelCase
              startMonth: b.start_month || b.startMonth || '', 
              startYear: b.start_year || b.startYear || '',   
              endMonth: b.end_month || b.endMonth || '',     
              endYear: b.end_year || b.endYear || '',       
              sections: parsedSections || [],
              specs: parsedSpecs || []
            };
          })
      }));
    } catch (error) {
      console.error("🔥 SQL Error in getFullPrograms:", error.message);
      throw error;
    }
  },

  // ─── COURSE CRUD ─────────────────────────────────────────────────────────
  createCourse: async (instituteId, data) => {
    try {
      const semesters = data.semesters ? parseInt(data.semesters, 10) : 0;

      const [result] = await db.query(
        `INSERT INTO courses (institute_id, name, code, level, duration, sem_system, semesters, building, evaluation) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instituteId, 
          data.name || '', 
          data.code || '', 
          data.level || '', 
          data.duration || '', 
          data.semSystem || '', 
          semesters, 
          data.building || '', 
          data.evaluation || ''
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error("🔥 SQL Insert Error (Courses):", error.message);
      throw error;
    }
  },

  updateCourse: async (instituteId, id, data) => {
    try {
      const semesters = data.semesters ? parseInt(data.semesters, 10) : 0;

      const [result] = await db.query(
        `UPDATE courses SET name=?, code=?, level=?, duration=?, sem_system=?, semesters=?, building=?, evaluation=? 
         WHERE id=? AND institute_id=?`,
        [
          data.name || '', 
          data.code || '', 
          data.level || '', 
          data.duration || '', 
          data.semSystem || '', 
          semesters, 
          data.building || '', 
          data.evaluation || '', 
          id, 
          instituteId
        ]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("🔥 SQL Update Error (Courses):", error.message);
      throw error;
    }
  },

  deleteCourse: async (instituteId, id) => {
    try {
      const [result] = await db.query('DELETE FROM courses WHERE id=? AND institute_id=?', [id, instituteId]);
      return result.affectedRows;
    } catch (error) {
      console.error("🔥 SQL Delete Error (Courses):", error.message);
      throw error;
    }
  },

  // ─── SPECIALIZATION CRUD ─────────────────────────────────────────────────
  createSpecialization: async (courseId, data) => {
    try {
      const total = data.total ? parseInt(data.total, 10) : 0;
      const intake = data.intake ? parseInt(data.intake, 10) : 0;

      const [result] = await db.query(
        `INSERT INTO specializations (course_id, name, code, total_intake, current_intake, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [courseId, data.name || '', data.code || '', total, intake, data.active !== false ? 1 : 0]
      );
      return result.insertId;
    } catch (error) {
      console.error("🔥 SQL Insert Error (Specializations):", error.message);
      throw error;
    }
  },

  updateSpecialization: async (id, data) => {
    try {
      const total = data.total ? parseInt(data.total, 10) : 0;
      const intake = data.intake ? parseInt(data.intake, 10) : 0;

      const [result] = await db.query(
        `UPDATE specializations SET name=?, code=?, total_intake=?, current_intake=?, is_active=? WHERE id=?`,
        [data.name || '', data.code || '', total, intake, data.active !== false ? 1 : 0, id]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("🔥 SQL Update Error (Specializations):", error.message);
      throw error;
    }
  },

  deleteSpecialization: async (id) => {
    try {
      const [result] = await db.query('DELETE FROM specializations WHERE id=?', [id]);
      return result.affectedRows;
    } catch (error) {
      console.error("🔥 SQL Delete Error (Specializations):", error.message);
      throw error;
    }
  },

  // ─── BATCH CRUD ──────────────────────────────────────────────────────────
  createBatch: async (data) => {
    try {
      const sections = JSON.stringify(data.sections || []);
      const specs = JSON.stringify(data.specs || []);

      // 🚀 FIXED: Switched back to snake_case and added institute_id & status
      const [result] = await db.query(
        `INSERT INTO batches (institute_id, course_id, name, start_month, start_year, end_month, end_year, status, sections, specs) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.institute_id || 1, // Fallback if undefined
          data.course_id, 
          data.name || '', 
          data.startMonth || '', 
          data.startYear || '', 
          data.endMonth || '', 
          data.endYear || '', 
          data.status || 'Active',
          sections, 
          specs
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error("🔥 SQL Insert Error (Batches):", error.message);
      throw error;
    }
  },

  updateBatch: async (id, data) => {
    try {
      const sections = JSON.stringify(data.sections || []);
      const specs = JSON.stringify(data.specs || []);

      // 🚀 FIXED: Switched back to snake_case and added status
      const [result] = await db.query(
        `UPDATE batches SET name=?, start_month=?, start_year=?, end_month=?, end_year=?, status=?, sections=?, specs=? WHERE id=?`,
        [
          data.name || '', 
          data.startMonth || '', 
          data.startYear || '', 
          data.endMonth || '', 
          data.endYear || '', 
          data.status || 'Active',
          sections, 
          specs, 
          id
        ]
      );
      return result.affectedRows;
    } catch (error) {
      console.error("🔥 SQL Update Error (Batches):", error.message);
      throw error;
    }
  },

  deleteBatch: async (id) => {
    try {
      const [result] = await db.query('DELETE FROM batches WHERE id=?', [id]);
      return result.affectedRows;
    } catch (error) {
      console.error("🔥 SQL Delete Error (Batches):", error.message);
      throw error;
    }
  }
};

module.exports = AcademicProgramModel;