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
            
            cleanData.room_number = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
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

            // 1. Verify department exists to get the friendly name for the success message
            const [deptRows] = await db.query(
                `SELECT id, department_name FROM departments WHERE id = ? AND institute_code = ? LIMIT 1`,
                [departmentId, instituteId]
            );

            if (deptRows.length === 0) return res.status(404).json({ success: false, message: 'Dept not found.' });
            const deptName = deptRows[0].department_name;

            // 2. Resolve building_id safely
            // Because your DB requires building_id to be NOT NULL, we MUST provide an integer.
            let buildingId = await resolveBuildingId(building);
            if (!buildingId) {
                // If building is missing, fallback to 1 so the DB doesn't crash on the NOT NULL constraint
                buildingId = 1; 
            }

            // 3. Check if room already exists for this institute
            const [existingRoom] = await db.query(
                `SELECT id FROM rooms WHERE room_no = ? AND institute_id = ?`,
                [room.trim(), instituteId]
            );

            if (existingRoom.length > 0) {
                // ── Room exists → UPDATE ── (Matches exactly with your DB schema)
                await db.query(
                    `UPDATE rooms 
                     SET building_id = ?, type = ?, block = ?, floor = ?, department_id = ? 
                     WHERE id = ?`,
                    [buildingId, type || 'Classroom', block || null, floor || null, departmentId, existingRoom[0].id]
                );
            } else {
                // ── Room doesn't exist → INSERT ── (Matches exactly with your DB schema)
                await db.query(
                    `INSERT INTO rooms 
                        (room_no, building_id, block, floor, type, institute_id, department_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [room.trim(), buildingId, block || null, floor || null, type || 'Classroom', instituteId, departmentId]
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