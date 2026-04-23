const db = require('../../config/db');

const AcademicProgramModel = {
  // ─── GET FULL NESTED ACADEMIC TREE ───────────────────────────────────────
  getFullPrograms: async (instituteId) => {
    // 1. Get all courses for this institute
    const [courses] = await db.query(
      'SELECT * FROM courses WHERE institute_id = ? ORDER BY id DESC', 
      [instituteId]
    );
    
    if (!courses || courses.length === 0) return [];

    const courseIds = courses.map(c => c.id);
    // 🚀 FIXED: Ensure array is never perfectly empty for MySQL 'IN (?)' clause
    const safeCourseIds = courseIds.length > 0 ? courseIds : [0]; 

    // 2. Get all specializations for these courses
    const [specializations] = await db.query(
      'SELECT * FROM specializations WHERE course_id IN (?)', 
      [safeCourseIds]
    );

    // 3. Get all batches for these courses
    // 🚀 FIXED: Removed 'institute_id' filter here since 'course_id' already scopes it to the right institute
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
      
      specializations: specializations
        .filter(s => s.course_id === course.id)
        .map(s => ({
          id: s.id, 
          name: s.name, 
          code: s.code, 
          total: s.total || 0, // 🚀 Aligned with DB schema
          intake: s.intake || 0, // 🚀 Aligned with DB schema
          active: s.active === 1 || s.active === true // 🚀 Aligned with DB schema
        })),
        
      batches: batches
        .filter(b => b.course_id === course.id)
        .map(b => {
          // 🚀 FIXED: Safe JSON Parsing (prevents crashes from bad DB data)
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
            startMonth: b.startMonth, // 🚀 Aligned with DB schema
            startYear: b.startYear,   // 🚀 Aligned with DB schema
            endMonth: b.endMonth,     // 🚀 Aligned with DB schema
            endYear: b.endYear,       // 🚀 Aligned with DB schema
            sections: parsedSections || [],
            specs: parsedSpecs || []
          };
        })
    }));
  },

  // ─── COURSE CRUD ─────────────────────────────────────────────────────────
  createCourse: async (instituteId, data) => {
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
  },

  updateCourse: async (instituteId, id, data) => {
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
  },

  deleteCourse: async (instituteId, id) => {
    const [result] = await db.query('DELETE FROM courses WHERE id=? AND institute_id=?', [id, instituteId]);
    return result.affectedRows;
  },

  // ─── SPECIALIZATION CRUD ─────────────────────────────────────────────────
  createSpecialization: async (courseId, data) => {
    const total = data.total ? parseInt(data.total, 10) : 0;
    const intake = data.intake ? parseInt(data.intake, 10) : 0;

    // 🚀 FIXED: Column names match exactly what was created in the DB schema
    const [result] = await db.query(
      `INSERT INTO specializations (course_id, name, code, total, intake, active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [courseId, data.name || '', data.code || '', total, intake, data.active !== false]
    );
    return result.insertId;
  },

  updateSpecialization: async (id, data) => {
    const total = data.total ? parseInt(data.total, 10) : 0;
    const intake = data.intake ? parseInt(data.intake, 10) : 0;

    // 🚀 FIXED: Column names matched to DB schema
    const [result] = await db.query(
      `UPDATE specializations SET name=?, code=?, total=?, intake=?, active=? WHERE id=?`,
      [data.name || '', data.code || '', total, intake, data.active !== false, id]
    );
    return result.affectedRows;
  },

  deleteSpecialization: async (id) => {
    const [result] = await db.query('DELETE FROM specializations WHERE id=?', [id]);
    return result.affectedRows;
  },

  // ─── BATCH CRUD ──────────────────────────────────────────────────────────
  createBatch: async (data) => {
    const sections = JSON.stringify(data.sections || []);
    const specs = JSON.stringify(data.specs || []);

    // 🚀 FIXED: Removed 'institute_id' and 'status' (they aren't in the batches schema). 
    // Uses correct camelCase database columns.
    const [result] = await db.query(
      `INSERT INTO batches (course_id, name, startMonth, startYear, endMonth, endYear, sections, specs) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.course_id, 
        data.name || '', 
        data.startMonth || '', 
        data.startYear || '', 
        data.endMonth || '', 
        data.endYear || '', 
        sections, 
        specs
      ]
    );
    return result.insertId;
  },

  updateBatch: async (id, data) => {
    const sections = JSON.stringify(data.sections || []);
    const specs = JSON.stringify(data.specs || []);

    // 🚀 FIXED: Uses correct camelCase database columns.
    const [result] = await db.query(
      `UPDATE batches SET name=?, startMonth=?, startYear=?, endMonth=?, endYear=?, sections=?, specs=? WHERE id=?`,
      [
        data.name || '', 
        data.startMonth || '', 
        data.startYear || '', 
        data.endMonth || '', 
        data.endYear || '', 
        sections, 
        specs, 
        id
      ]
    );
    return result.affectedRows;
  },

  deleteBatch: async (id) => {
    const [result] = await db.query('DELETE FROM batches WHERE id=?', [id]);
    return result.affectedRows;
  }
};

module.exports = AcademicProgramModel;