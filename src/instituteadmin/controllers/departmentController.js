const DepartmentModel = require('../models/departmentModel');
const db = require('../../config/db');

// ─── CONSTANTS ────────────────────────────────────────────────────────────
const HARDCODED_BUILDINGS = [
    { id: 1, name: 'Main Block' },
    { id: 2, name: 'East Block' },
    { id: 3, name: 'West Block' },
    { id: 4, name: 'North Block' },
    { id: 5, name: 'South Block' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────
const sanitizeData = (data) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        const v = sanitized[key];
        if (v === '' || v === undefined || v === null) sanitized[key] = null;
    });
    return sanitized;
};

// Get the STRING code (e.g., SAM751030) for departments table
const getInstituteCode = (req) =>
    req.user?.code || 'DEFAULT_CODE';

// Get the INTEGER id (e.g., 1) for rooms and buildings tables
const getInstituteId = (req) =>
    req.user?.institute_id || req.user?.id || 1;

// 🚀 FIXED: Now securely checks for the building INSIDE the specific institute
const resolveBuildingId = async (buildingName, instituteId) => {
    if (!buildingName || buildingName.trim() === '') return null;
    try {
        const [rows] = await db.query(
            `SELECT id FROM buildings WHERE name = ? AND institute_id = ? LIMIT 1`,
            [buildingName.trim(), instituteId]
        );
        return rows.length > 0 ? rows[0].id : null;
    } catch (err) {
        console.warn('⚠️ Could not resolve building_id:', err.message);
        return null;
    }
};

// ─── CONTROLLER ──────────────────────────────────────────────────────────

const departmentController = {

    // ── GET ALL DEPARTMENTS ────────────────────────────────────
    getDepartments: async (req, res) => {
        try {
            const instituteCode = getInstituteCode(req);
            const departments = await DepartmentModel.getAll(instituteCode);
            res.json({ success: true, data: departments });
        } catch (error) {
            console.error('❌ Get Departments Error:', error.message);
            res.status(500).json({ success: false, message: 'Server error while fetching departments.' });
        }
    },

    // ── GET ALL BUILDINGS (Fallback) ───────────────────────────
    getBuildings: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            // 🚀 FIXED: Only fetch buildings assigned to this institute
            const [buildings] = await db.query(
                `SELECT id, name FROM buildings WHERE institute_id = ? ORDER BY name ASC`,
                [instituteId]
            );
            if (!buildings || buildings.length === 0) {
                return res.json({ success: true, data: [] });
            }
            res.json({ success: true, data: buildings });
        } catch (error) {
            res.json({ success: true, data: [] });
        }
    },

    // ── 🚀 NEW: GET INFRASTRUCTURE (Buildings + Rooms) ─────────
    getInfrastructureData: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            
            // 🚀 FIXED: Only fetch buildings for this specific institute
            const [buildings] = await db.query(
                `SELECT id, name FROM buildings WHERE institute_id = ? ORDER BY name ASC`,
                [instituteId]
            );
            
            // Fetch Rooms with their associated Blocks and Floors
            const [rooms] = await db.query(`
              SELECT 
                r.id, 
                r.room_no as name, 
                b.name as building, 
                r.block, 
                r.floor 
              FROM rooms r 
              LEFT JOIN buildings b ON r.building_id = b.id 
              WHERE r.institute_id = ?
            `, [instituteId]);

            res.json({ 
                success: true, 
                data: { buildings, rooms } 
            });
        } catch (error) {
            console.error('❌ Get Infrastructure Error:', error.message);
            res.status(500).json({ success: false, message: 'Server error while fetching infrastructure.' });
        }
    },

    // ── CREATE DEPARTMENT ──────────────────────────────────────
    createDepartment: async (req, res) => {
        try {
            const instituteCode = getInstituteCode(req);
            const { name, category } = req.body;

            if (!name || !category) {
                return res.status(400).json({ success: false, message: 'Name and Category are mandatory.' });
            }

            const cleanData = sanitizeData(req.body);
            
            cleanData.room_number = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
            cleanData.head = cleanData.hodId ?? null;

            const insertId = await DepartmentModel.create(instituteCode, cleanData);
            res.status(201).json({ success: true, message: 'Department created!', insertId });
        } catch (error) {
            console.error('❌ Create Error:', error);
            res.status(500).json({ success: false, message: error.sqlMessage || error.message });
        }
    },

    // ── UPDATE DEPARTMENT ──────────────────────────────────────
    updateDepartment: async (req, res) => {
        try {
            const instituteCode = getInstituteCode(req);
            const cleanData = sanitizeData(req.body);
            
            cleanData.room_number = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
            cleanData.head = cleanData.hodId ?? null;

            const affectedRows = await DepartmentModel.update(req.params.id, instituteCode, cleanData);
            res.json({ success: true, message: 'Updated successfully.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.sqlMessage || error.message });
        }
    },

    // ── DELETE DEPARTMENT ──────────────────────────────────────
    deleteDepartment: async (req, res) => {
        try {
            const instituteCode = getInstituteCode(req);
            await DepartmentModel.delete(req.params.id, instituteCode);
            res.json({ success: true, message: 'Deleted successfully.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ── ASSIGN ROOM TO DEPARTMENT ──────────────────────────────
    assignRoom: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const instituteCode = getInstituteCode(req);
            
            const { departmentId, building, block, floor, room, type } = req.body;

            if (!departmentId || !room) {
                return res.status(400).json({ success: false, message: 'Dept ID and Room No are required.' });
            }

            // 1. Verify department exists using institute_code
            const [deptRows] = await db.query(
                `SELECT id, department_name FROM departments WHERE id = ? AND institute_code = ? LIMIT 1`,
                [departmentId, instituteCode]
            );

            if (deptRows.length === 0) return res.status(404).json({ success: false, message: 'Dept not found.' });
            const deptName = deptRows[0].department_name;

            // 2. Safely resolve or create the building for this specific institute
            let buildingId = await resolveBuildingId(building, instituteId);
            
            // 🚀 FIXED: If the building doesn't exist for this institute, create it dynamically!
            if (!buildingId && building && building.trim() !== '') {
                const [newBldg] = await db.query(
                    `INSERT INTO buildings (name, institute_id) VALUES (?, ?)`, 
                    [building.trim(), instituteId]
                );
                buildingId = newBldg.insertId;
            }

            // 3. Check if room already exists for this institute (using integer institute_id)
            const [existingRoom] = await db.query(
                `SELECT id FROM rooms WHERE room_no = ? AND institute_id = ?`,
                [room.trim(), instituteId]
            );

            if (existingRoom.length > 0) {
                // ── Room exists → UPDATE ── 
                await db.query(
                    `UPDATE rooms 
                     SET building_id = ?, type = ?, block = ?, floor = ?, department_id = ? 
                     WHERE id = ? AND institute_id = ?`,
                    [buildingId || null, type || 'Classroom', block || null, floor || null, departmentId, existingRoom[0].id, instituteId]
                );
            } else {
                // ── Room doesn't exist → INSERT ── 
                await db.query(
                    `INSERT INTO rooms 
                        (room_no, building_id, block, floor, type, institute_id, department_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [room.trim(), buildingId || null, block || null, floor || null, type || 'Classroom', instituteId, departmentId]
                );
            }

            res.json({ success: true, message: `Room ${room.trim()} assigned to ${deptName}!` });
        } catch (error) {
            console.error('❌ Room Assignment Error:', error);
            res.status(500).json({ success: false, message: error.sqlMessage || error.message });
        }
    },
};

module.exports = departmentController;