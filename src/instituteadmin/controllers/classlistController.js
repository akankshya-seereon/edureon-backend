const ClassModel = require('../models/classlistModel');
const db = require('../../config/db');

// ─── Helper: resolve institute identifiers from JWT ───────────────────────────
// JWT payload: { id: 4, role: 'institute_admin', code: 'LIT751030' }
const resolveInstitute = (user) => ({
  instId:   user?.id   || user?.institute_id,   // numeric  → 4
  instCode: user?.code || user?.institute_code, // string   → 'LIT751030'
});

// ─── GET ALL CLASSES ──────────────────────────────────────────────────────────

exports.getAllClasses = async (req, res) => {
  try {
    const { instId } = resolveInstitute(req.user);

    if (!instId) {
      return res.status(400).json({ success: false, message: 'Institute ID is missing.' });
    }
    
    const classes = await ClassModel.findAll(instId); 
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    console.error('Get All Classes Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch classes.' });
  }
};

// ─── CREATE CLASS ─────────────────────────────────────────────────────────────

exports.createClass = async (req, res) => {
  try {
    const data = req.body;
    const { instId } = resolveInstitute(req.user);

    if (!data.className) {
      return res.status(400).json({ success: false, message: 'Class Name is required.' });
    }

    const dbPayload = {
      institute_id:    instId,
      class_name:      data.className,
      program:         data.program         || data.course || null,
      specialization:  data.specialization  || null, 
      department:      data.department      || null,
      section:         data.section         || null,
      max_students:    data.maxStudents     || 0,
      subject:         data.subject         || null,
      faculty_assigned: data.facultyAssigned || null,
      faculty_id:      data.facultyId       || null,
      batch_id:        data.batchId         || null,
      academic_year:   data.academicYear    || null,
      semester:        data.semester        || null,
      schedule:        data.schedule ? JSON.stringify(data.schedule) : '[]',
      description:     data.description     || null,
    };

    const result = await ClassModel.create(dbPayload);
    res.status(201).json({ success: true, message: 'Class created successfully!', classId: result.insertId });
  } catch (error) {
    console.error('Create Class Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create class.' });
  }
};

// ─── UPDATE CLASS ─────────────────────────────────────────────────────────────

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const dbPayload = {
      class_name:      data.className,
      program:         data.program         || data.course || null,
      specialization:  data.specialization  || null,
      department:      data.department      || null,
      section:         data.section         || null,
      max_students:    data.maxStudents     || 0,
      subject:         data.subject         || null,
      faculty_assigned: data.facultyAssigned || null,
      faculty_id:      data.facultyId       || null,
      batch_id:        data.batchId         || null,
      academic_year:   data.academicYear    || null,
      semester:        data.semester        || null,
      schedule:        data.schedule ? JSON.stringify(data.schedule) : '[]',
      description:     data.description     || null,
    };

    const updated = await ClassModel.update(id, dbPayload);

    if (updated.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    res.status(200).json({ success: true, message: 'Class updated successfully!' });
  } catch (error) {
    console.error('Update Class Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update class.' });
  }
};

// ─── DELETE CLASS ─────────────────────────────────────────────────────────────

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ClassModel.delete(id);

    if (deleted.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    res.status(200).json({ success: true, message: 'Class deleted successfully!' });
  } catch (error) {
    console.error('Delete Class Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete class.' });
  }
};

// ─── GET FORM DROPDOWN DATA ───────────────────────────────────────────────────

exports.getFormData = async (req, res) => {
  try {
    const { instId, instCode } = resolveInstitute(req.user);

    // 1. Fetch Basic Data
    const [departments] = await db.query(`SELECT id, department_name AS name FROM departments WHERE institute_code = ?`, [instCode]).catch(() => [[]]);
    const [courses] = await db.query(`SELECT id, name FROM courses WHERE institute_id = ?`, [instId]).catch(() => [[]]);
    const [specializations] = await db.query(`SELECT id, name FROM specializations WHERE institute_id = ?`, [instId]).catch(() => [[]]);
    const [subjects] = await db.query(`SELECT DISTINCT subject_name AS name, subject_code AS code FROM syllabus_subjects WHERE institute_id = ?`, [instId]).catch(() => [[]]);
    const [faculty] = await db.query(`SELECT id, name FROM faculty WHERE institute_id = ?`, [instId]).catch(() => [[]]);
    const [batches] = await db.query(`SELECT id, name, students_count AS student_count FROM batches WHERE institute_id = ?`, [instId]).catch(() => [[]]);

    // 🚀 2. ROBUST INFRASTRUCTURE FETCH (SQL JOIN FIX)
    
    // Step A: Fetch all Buildings (Ensures empty buildings still show up)
    const [buildingRows] = await db.query(
      `SELECT b.id, b.name as building_name, c.name as campus_name 
       FROM buildings b 
       LEFT JOIN campuses c ON b.campus_id = c.id 
       WHERE b.institute_id = ? OR b.institute_id = ?`, 
      [instId, instCode]
    ).catch(() => [[]]);

    // Step B: Fetch all Rooms WITH their building names directly from SQL
    const [roomRows] = await db.query(
      `SELECT r.id, r.room_no, r.block, r.floor, b.name as building_name, c.name as campus_name 
       FROM rooms r 
       LEFT JOIN buildings b ON r.building_id = b.id 
       LEFT JOIN campuses c ON b.campus_id = c.id 
       WHERE r.institute_id = ? OR r.institute_id = ?`, 
      [instId, instCode]
    ).catch(() => [[]]);

    const infraMap = {};
    const flatRooms = [];

    // Initialize Map with all Buildings (So they show up even if they have 0 rooms)
    if (Array.isArray(buildingRows)) {
      buildingRows.forEach(b => {
        const campus = b.campus_name || 'Main Campus';
        const bldg = b.building_name || 'Unnamed Building';

        if (!infraMap[campus]) infraMap[campus] = { name: campus, buildings: {} };
        if (!infraMap[campus].buildings[bldg]) {
          infraMap[campus].buildings[bldg] = { name: bldg, blocks: {} };
        }
      });
    }

    // Inject Rooms directly into the Map (No strict Javascript ID matching required)
    if (Array.isArray(roomRows)) {
      roomRows.forEach(r => {
        flatRooms.push({ id: r.id, name: r.room_no });

        // Safely extract names (SQL JOIN guarantees we have these now)
        const campus = r.campus_name || 'Main Campus';
        const bldg = r.building_name || 'Unnamed Building';
        const block = (r.block && r.block.trim() !== '') ? r.block.trim() : 'Main Block';
        const floor = (r.floor && r.floor.trim() !== '') ? r.floor.trim() : 'Ground Floor';

        // Ensure the path exists before adding the room
        if (!infraMap[campus]) infraMap[campus] = { name: campus, buildings: {} };
        if (!infraMap[campus].buildings[bldg]) infraMap[campus].buildings[bldg] = { name: bldg, blocks: {} };
        if (!infraMap[campus].buildings[bldg].blocks[block]) infraMap[campus].buildings[bldg].blocks[block] = { name: block, floors: {} };
        if (!infraMap[campus].buildings[bldg].blocks[block].floors[floor]) infraMap[campus].buildings[bldg].blocks[block].floors[floor] = { name: floor, rooms: [] };

        // Push the room
        infraMap[campus].buildings[bldg].blocks[block].floors[floor].rooms.push({
          id: r.id,
          name: r.room_no
        });
      });
    }

    // Step C: Convert Map to Nested Array for Frontend
    const infrastructureHierarchy = Object.values(infraMap).map(camp => ({
      name: camp.name,
      buildings: Object.values(camp.buildings).map(bldg => ({
        name: bldg.name,
        blocks: Object.values(bldg.blocks).map(blk => ({
          name: blk.name,
          floors: Object.values(blk.floors).map(flr => ({
            name: flr.name,
            rooms: flr.rooms
          }))
        }))
      }))
    }));

    // 3. Static & Supplementary Data
    const [academicYears] = await db.query(`SELECT id, year AS name FROM academic_years WHERE institute_id = ?`, [instId]).catch(() => [[{ name: '2024-25' }, { name: '2025-26' }, { name: '2026-27' }]]);
    const [sections] = await db.query(`SELECT id, name FROM sections WHERE institute_id = ?`, [instId]).catch(() => [[{ name: 'A' }, { name: 'B' }, { name: 'C' }]]);
    
    const semesters = [{ name: 'Semester 1' }, { name: 'Semester 2' }, { name: 'Semester 3' }, { name: 'Semester 4' }, { name: 'Semester 5' }, { name: 'Semester 6' }, { name: 'Semester 7' }, { name: 'Semester 8' }];
    const days = [{ name: 'Monday' }, { name: 'Tuesday' }, { name: 'Wednesday' }, { name: 'Thursday' }, { name: 'Friday' }, { name: 'Saturday' }];

    res.status(200).json({
      success: true,
      data: {
        departments,
        courses,
        specializations,
        subjects,
        faculty,
        batches,
        rooms: flatRooms, 
        infrastructure: infrastructureHierarchy,
        academicYears: academicYears.length ? academicYears : [{ name: '2024-25' }, { name: '2025-26' }, { name: '2026-27' }],
        sections: sections.length ? sections : [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        semesters,
        days,
      },
    });

  } catch (error) {
    console.error('Form Data Fetch Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load dropdown data.' });
  }
};