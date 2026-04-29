const InfraModel = require('../models/infrastructureModel');

/**
 * 🛠️ Helper: Standardized Institute Context Extraction
 * Ensures it grabs the correct ID whether your token uses 'code', 'institute_id', or 'id'.
 */
const getInstituteId = (req) => {
  return req.instituteId || req.user?.institute_code || req.user?.code || req.user?.institute_id || req.user?.id || 1;
};

// ─── 1. FETCH DATA ──────────────────────────────────────────────────────────

/**
 * 🚀 GET BUILDINGS ONLY (CRITICAL FOR DEPARTMENT DROPDOWN)
 * Do not delete this! It fixes the 404 error on the Departments page.
 */
exports.getAllBuildings = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Institute ID missing' });

    const data = await InfraModel.getCampusesWithBuildings(instId);
    
    // Safety check before flattening
    if (!data || !Array.isArray(data)) {
        return res.status(200).json({ success: true, data: [] });
    }

    // Flatten buildings from all campuses into a single array for the dropdown
    const allBuildings = data.flatMap(campus => campus.buildings || []);

    res.status(200).json({ success: true, data: allBuildings });
  } catch (error) {
    console.error("🔥 GET BUILDINGS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch buildings list" });
  }
};

/**
 * 📊 GET FULL INFRASTRUCTURE (For the main Dashboard)
 */
exports.getInfrastructure = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });

    const [campuses, rooms] = await Promise.all([
      InfraModel.getCampusesWithBuildings(instId),
      InfraModel.getAllRooms(instId)
    ]);

    res.status(200).json({ success: true, campuses: campuses || [], rooms: rooms || [] });
  } catch (error) {
    console.error("🔥 GET INFRASTRUCTURE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 2. CREATE METHODS ────────────────────────────────────────────────────────

exports.createCampus = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Campus name required' });

    await InfraModel.createCampus(instId, req.body);
    res.status(201).json({ success: true, message: 'Campus created successfully' });
  } catch (error) {
    console.error("🔥 CREATE CAMPUS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBuilding = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });

    // 🚀 NEW: Backend Duplicate Validation
    const exists = await InfraModel.checkBuildingExists(instId, req.body.campus_id, req.body.name);
    if (exists) {
      return res.status(400).json({ success: false, message: `Building "${req.body.name}" already exists in this campus.` });
    }

    await InfraModel.createBuilding(instId, req.body);
    res.status(201).json({ success: true, message: 'Building created successfully' });
  } catch (error) {
    console.error("🔥 CREATE BUILDING ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    // ✅ Using the helper function instead of req.instituteId directly
    const instId = getInstituteId(req);
    if (!instId) return res.status(400).json({ success: false, message: 'Auth token missing ID' });

    await InfraModel.createRoom(instId, req.body);
    res.status(201).json({ success: true, message: 'Room created' });
  } catch (error) {
    console.error("🔥 CREATE ROOM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 3. STATUS & UPDATES ─────────────────────────────────────────────────────

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

    // 🚀 NEW: Backend Duplicate Validation for Edits (Ignores current building ID)
    const exists = await InfraModel.checkBuildingExists(instId, req.body.campus_id, req.body.name, id);
    if (exists) {
      return res.status(400).json({ success: false, message: `Building "${req.body.name}" already exists in this campus.` });
    }

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

// ─── 4. DELETE METHODS ────────────────────────────────────────────────────────

exports.deleteCampus = async (req, res) => {
  try {
    const instId = getInstituteId(req);
    const { id } = req.params;
    await InfraModel.deleteCampus(instId, id);
    res.status(200).json({ success: true, message: 'Campus deleted' });
  } catch (error) {
    console.error("🔥 DELETE CAMPUS ERROR:", error);
    res.status(500).json({ success: false, message: "Cannot delete campus (it may contain buildings)" });
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
    res.status(500).json({ success: false, message: "Cannot delete building (it may contain rooms)" });
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
    res.status(500).json({ success: false, message: "Failed to delete room" });
  }
};