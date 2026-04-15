const db = require('../../config/db');

const AcademicProgramModel = {
  // ─── GET FULL NESTED ACADEMIC TREE ───────────────────────────────────────
  getFullPrograms: async (instituteId) => {
    // 1. Get all courses
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
    const [batches] = await db.query(
      'SELECT * FROM batches WHERE course_id IN (?) AND institute_id = ?', 
      [safeCourseIds, instituteId]
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
      totalIntake: course.total_intake || 0,
      currentIntake: course.current_intake || 0,
      status: course.is_active ? 'Active' : 'Inactive',
      specializations: specializations
        .filter(s => s.course_id === course.id)
        .map(s => ({
          id: s.id, 
          name: s.name, 
          code: s.code, 
          total: s.total_intake || 0, 
          intake: s.current_intake || 0, 
          active: s.is_active === 1 || s.is_active === true
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
            startMonth: b.start_month, 
            startYear: b.start_year, 
            endMonth: b.end_month, 
            endYear: b.end_year, 
            status: b.status,
            sections: parsedSections || [],
            specs: parsedSpecs || []
          };
        })
    }));
  },

  // ─── COURSE CRUD ─────────────────────────────────────────────────────────
  createCourse: async (instituteId, data) => {
    const semesters = data.semesters ? parseInt(data.semesters, 10) : 0;

    // 🚀 FIXED: Added fallback values || '' so MySQL never receives undefined
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

    const [result] = await db.query(
      `INSERT INTO specializations (course_id, name, code, total_intake, current_intake, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [courseId, data.name || '', data.code || '', total, intake, data.active !== false]
    );
    return result.insertId;
  },

  updateSpecialization: async (id, data) => {
    const total = data.total ? parseInt(data.total, 10) : 0;
    const intake = data.intake ? parseInt(data.intake, 10) : 0;

    const [result] = await db.query(
      `UPDATE specializations SET name=?, code=?, total_intake=?, current_intake=?, is_active=? WHERE id=?`,
      [data.name || '', data.code || '', total, intake, data.active, id]
    );
    return result.affectedRows;
  },

  deleteSpecialization: async (id) => {
    const [result] = await db.query('DELETE FROM specializations WHERE id=?', [id]);
    return result.affectedRows;
  },

  // ─── BATCH CRUD ──────────────────────────────────────────────────────────
  createBatch: async (data) => {
    // Safely parse arrays into JSON strings for MySQL
    const sections = JSON.stringify(data.sections || []);
    const specs = JSON.stringify(data.specs || []);

    const [result] = await db.query(
      `INSERT INTO batches (institute_id, course_id, name, start_month, start_year, end_month, end_year, status, sections, specs) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.institute_id, data.course_id, data.name || '', 
        data.startMonth || '', data.startYear || '', 
        data.endMonth || '', data.endYear || '', 
        data.status || 'Active', sections, specs
      ]
    );
    return result.insertId;
  },

  updateBatch: async (id, data) => {
    const sections = JSON.stringify(data.sections || []);
    const specs = JSON.stringify(data.specs || []);

    const [result] = await db.query(
      `UPDATE batches SET name=?, start_month=?, start_year=?, end_month=?, end_year=?, status=?, sections=?, specs=? WHERE id=?`,
      [
        data.name || '', data.startMonth || '', data.startYear || '', 
        data.endMonth || '', data.endYear || '', data.status || 'Active', 
        sections, specs, id
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