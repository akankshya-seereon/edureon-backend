const AcademicProgramModel = require('../models/academicprogramModel');
const db = require('../../config/db');

// 🛡️ HELPER: Securely get Institute ID
const getInstituteId = (req) => {
  // Checks for Passport/JWT user object first
  if (req.user) {
    return req.user.institute_id || req.user.id;
  }
  // Default to 1 for development/testing if middleware is not active
  return 1; 
};

// ─── 🏢 INFRASTRUCTURE (BUILDINGS) ───────────────────────────────────────

exports.getBuildings = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    
    // 🚀 FIXED: Uses 'name' instead of 'building_name' to match your actual DB
    const [buildings] = await db.query(
      `SELECT id, name FROM buildings WHERE institute_id = ?`, 
      [instId]
    );

    res.status(200).json({ 
      success: true, 
      data: buildings 
    });
  } catch (error) {
    console.error("🔥 DB Error [getBuildings]:", error.message);
    // Return empty data instead of crashing 500 so frontend doesn't break
    res.status(200).json({ success: false, data: [], message: error.message });
  }
};

// ─── 🎓 ACADEMIC PROGRAMS (TREE) ─────────────────────────────────────────

exports.getPrograms = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const programs = await AcademicProgramModel.getFullPrograms(instId);
    
    res.status(200).json({ 
      success: true, 
      data: programs 
    });
  } catch (error) {
    console.error("🔥 DB Error [getPrograms]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch programs.' });
  }
};

// ─── 📚 COURSES ──────────────────────────────────────────────────────────

exports.createCourse = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const id = await AcademicProgramModel.createCourse(instId, req.body);
    
    res.status(201).json({ 
      success: true, 
      message: 'Course created successfully', 
      id 
    });
  } catch (error) {
    console.error("🔥 DB Error [createCourse]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to create course.' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    await AcademicProgramModel.updateCourse(instId, req.params.id, req.body);
    
    res.status(200).json({ 
      success: true, 
      message: 'Course updated successfully' 
    });
  } catch (error) {
    console.error("🔥 DB Error [updateCourse]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to update course.' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    await AcademicProgramModel.deleteCourse(instId, req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    console.error("🔥 DB Error [deleteCourse]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to delete course.' });
  }
};

// ─── 🎯 SPECIALIZATIONS ──────────────────────────────────────────────────

exports.createSpecialization = async (req, res) => {
  try {
    const courseId = req.body.courseId || req.body.course_id;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const id = await AcademicProgramModel.createSpecialization(courseId, req.body);
    
    res.status(201).json({ 
      success: true, 
      message: 'Specialization created successfully', 
      id 
    });
  } catch (error) {
    console.error("🔥 DB Error [createSpecialization]:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSpecialization = async (req, res) => {
  try {
    await AcademicProgramModel.updateSpecialization(req.params.id, req.body);
    
    res.status(200).json({ 
      success: true, 
      message: 'Specialization updated successfully' 
    });
  } catch (error) {
    console.error("🔥 DB Error [updateSpecialization]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to update specialization.' });
  }
};

exports.deleteSpecialization = async (req, res) => {
  try {
    await AcademicProgramModel.deleteSpecialization(req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Specialization deleted successfully' 
    });
  } catch (error) {
    console.error("🔥 DB Error [deleteSpecialization]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to delete specialization.' });
  }
};

// ─── 📅 BATCHES ──────────────────────────────────────────────────────────

exports.createBatch = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    // Merge batch data with the secure institute ID
    const batchData = { ...req.body, institute_id: instId };

    if (!batchData.course_id) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const id = await AcademicProgramModel.createBatch(batchData);
    res.status(201).json({ success: true, message: 'Batch created successfully', id });
  } catch (error) {
    console.error("🔥 DB Error [createBatch]:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBatch = async (req, res) => {
  try {
    await AcademicProgramModel.updateBatch(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Batch updated successfully' });
  } catch (error) {
    console.error("🔥 DB Error [updateBatch]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to update batch.' });
  }
};

exports.deleteBatch = async (req, res) => {
  try {
    await AcademicProgramModel.deleteBatch(req.params.id);
    res.status(200).json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    console.error("🔥 DB Error [deleteBatch]:", error.message);
    res.status(500).json({ success: false, message: 'Failed to delete batch.' });
  }
};