const InfraModel = require('../models/infrastructureModel');
 
// Helper function to extract the correct ID from your Auth setup
const getInstituteId = (req) => {
  return req.instituteId || (req.user && req.user.institute_id) || (req.user && req.user.id);
};
 
// 1. Get All Infrastructure Data
exports.getInfrastructure = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });
 
    const [campuses, rooms] = await Promise.all([
      InfraModel.getCampusesWithBuildings(instId),
      InfraModel.getAllRooms(instId)
    ]);
 
    res.status(200).json({ success: true, campuses, rooms });
  } catch (error) {
    console.error("🔥 GET INFRASTRUCTURE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// 2. Create Methods
exports.createCampus = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });
 
    await InfraModel.createCampus(instId, req.body);
    res.status(201).json({ success: true, message: 'Campus created' });
  } catch (error) {
    console.error("🔥 CREATE CAMPUS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.createBuilding = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });
 
    await InfraModel.createBuilding(instId, req.body);
    res.status(201).json({ success: true, message: 'Building created' });
  } catch (error) {
    console.error("🔥 CREATE BUILDING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.createRoom = async (req, res) => {
  try {
    // ✅ FIXED: Using the helper function instead of req.instituteId directly
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });
 
    await InfraModel.createRoom(instId, req.body);
    res.status(201).json({ success: true, message: 'Room created' });
  } catch (error) {
    console.error("🔥 CREATE ROOM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// 3. Status Toggle
exports.toggleStatus = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });
 
    const { type, id } = req.params;
    const { active } = req.body;
   
    await InfraModel.toggleStatus(type, id, instId, active);
    res.status(200).json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error("🔥 TOGGLE STATUS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// 🚀 4. DELETE METHODS (Fixes the 404 errors)
exports.deleteCampus = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.deleteCampus(instId, id);
    res.status(200).json({ success: true, message: 'Campus deleted' });
  } catch (error) {
    console.error("🔥 DELETE CAMPUS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.deleteBuilding = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.deleteBuilding(instId, id);
    res.status(200).json({ success: true, message: 'Building deleted' });
  } catch (error) {
    console.error("🔥 DELETE BUILDING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.deleteRoom = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.deleteRoom(instId, id);
    res.status(200).json({ success: true, message: 'Room deleted' });
  } catch (error) {
    console.error("🔥 DELETE ROOM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
// 📝 5. UPDATE METHODS (For the Edit buttons)
exports.updateCampus = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.updateCampus(instId, id, req.body);
    res.status(200).json({ success: true, message: 'Campus updated' });
  } catch (error) {
    console.error("🔥 UPDATE CAMPUS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.updateBuilding = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.updateBuilding(instId, id, req.body);
    res.status(200).json({ success: true, message: 'Building updated' });
  } catch (error) {
    console.error("🔥 UPDATE BUILDING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
exports.updateRoom = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.updateRoom(instId, id, req.body);
    res.status(200).json({ success: true, message: 'Room updated' });
  } catch (error) {
    console.error("🔥 UPDATE ROOM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};