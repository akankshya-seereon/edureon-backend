const DepartmentModel = require('../models/departmentModel');
const db = require('../../config/db');

// ─── CONSTANTS (Moved to top to prevent ReferenceErrors) ──────────────────
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

const getInstituteId = (req) =>
    req.user?.code || req.user?.institute_id || req.user?.instituteId || 1;

const resolveBuildingId = async (buildingName) => {
    if (!buildingName || buildingName.trim() === '') return null;
    try {
        const [rows] = await db.query(
            `SELECT id FROM buildings WHERE name = ? LIMIT 1`,
            [buildingName.trim()]
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
            const instituteId = getInstituteId(req);
            const departments = await DepartmentModel.getAll(instituteId);
            
            // 🚀 FIX: Return key as 'data' to match your API config, 
            // but ensure your Frontend handles res.data.data
            res.json({ success: true, data: departments });
        } catch (error) {
            console.error('❌ Get Departments Error:', error.message);
            res.status(500).json({ success: false, message: 'Server error while fetching departments.' });
        }
    },

    // ── GET ALL BUILDINGS ──────────────────────────────────────
    getBuildings: async (req, res) => {
        try {
            const [buildings] = await db.query(`SELECT id, name FROM buildings ORDER BY name ASC`);
            if (!buildings || buildings.length === 0) {
                return res.json({ success: true, data: HARDCODED_BUILDINGS });
            }
            res.json({ success: true, data: buildings });
        } catch (error) {
            // Table might not exist - return hardcoded fallback
            res.json({ success: true, data: HARDCODED_BUILDINGS });
        }
    },

    // ── CREATE DEPARTMENT ──────────────────────────────────────
    createDepartment: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const { name, category } = req.body;

            if (!name || !category) {
                return res.status(400).json({ success: false, message: 'Name and Category are mandatory.' });
            }

            const cleanData = sanitizeData(req.body);
            
            // 🚀 FIX: Map 'noOfRooms' to 'room_number' to match your DESCRIBE output
            cleanData.room_number = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
            // 🚀 FIX: Map 'hodId' to 'head' to match your DESCRIBE output
            cleanData.head = cleanData.hodId ?? null;

            const insertId = await DepartmentModel.create(instituteId, cleanData);
            res.status(201).json({ success: true, message: 'Department created!', insertId });
        } catch (error) {
            console.error('❌ Create Error:', error);
            res.status(500).json({ success: false, message: error.sqlMessage || error.message });
        }
    },

    // ── UPDATE DEPARTMENT ──────────────────────────────────────
    updateDepartment: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const cleanData = sanitizeData(req.body);
            
            // 🚀 FIX: Match snake_case DB columns
            cleanData.room_number = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
            cleanData.head = cleanData.hodId ?? null;

            const affectedRows = await DepartmentModel.update(req.params.id, instituteId, cleanData);
            res.json({ success: true, message: 'Updated successfully.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.sqlMessage || error.message });
        }
    },

    // ── DELETE DEPARTMENT ──────────────────────────────────────
    deleteDepartment: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            await DepartmentModel.delete(req.params.id, instituteId);
            res.json({ success: true, message: 'Deleted successfully.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ── ASSIGN ROOM TO DEPARTMENT ──────────────────────────────
    assignRoom: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const { departmentId, building, block, floor, room, type } = req.body;

            if (!departmentId || !room) {
                return res.status(400).json({ success: false, message: 'Dept ID and Room No are required.' });
            }

            // 1. Verify department exists (Matches your DB col: department_name)
            const [deptRows] = await db.query(
                `SELECT id, department_name FROM departments WHERE id = ? AND institute_code = ? LIMIT 1`,
                [departmentId, instituteId]
            );

            if (deptRows.length === 0) return res.status(404).json({ success: false, message: 'Dept not found.' });

            const deptName = deptRows[0].department_name;
            const buildingId = await resolveBuildingId(building);

            // 2. Check/Update/Insert Rooms table
            const [existingRoom] = await db.query(
                `SELECT id FROM rooms WHERE room_no = ? AND institute_id = ? AND building = ?`,
                [room.trim(), instituteId, building || null]
            );

            if (existingRoom.length > 0) {
                await db.query(
                    `UPDATE rooms SET department = ?, building_id = ?, type = ? WHERE id = ?`,
                    [deptName, buildingId, type || 'Classroom', existingRoom[0].id]
                );
            } else {
                await db.query(
                    `INSERT INTO rooms (room_no, building, building_id, block, floor, department, institute_id, type) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [room.trim(), building, buildingId, block, floor, deptName, instituteId, type || 'Classroom']
                );
            }

            res.json({ success: true, message: `Room ${room} assigned to ${deptName}!` });
        } catch (error) {
            console.error('❌ Room Assignment Error:', error);
            res.status(500).json({ success: false, message: error.sqlMessage || error.message });
        }
    },
};

module.exports = departmentController;