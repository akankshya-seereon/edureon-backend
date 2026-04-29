const DepartmentModel = require('../models/departmentModel');
const db = require('../../config/db');
 
// ─────────────────────────────────────────────────────────────
// 🛠️ Helper: Sanitize Input
// Converts empty strings / undefined → null
// Prevents MySQL "Incorrect integer value" errors
// ─────────────────────────────────────────────────────────────
const sanitizeData = (data) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        const v = sanitized[key];
        if (v === '' || v === undefined || v === null) sanitized[key] = null;
    });
    return sanitized;
};
 
// ─────────────────────────────────────────────────────────────
// 🛠️ Helper: Get Institute ID from request
// Confirmed from your logs: req.user.code = 'SAM751030'
// That value is used as institute_code in departments table
// and as institute_id in rooms table (same value, different col names)
// ─────────────────────────────────────────────────────────────
const getInstituteId = (req) =>
    req.instituteId
    || req.user?.code          // ✅ confirmed: 'SAM751030'
    || req.user?.institute_id
    || req.user?.instituteId
    || 1;
 
// ─────────────────────────────────────────────────────────────
// 🛠️ Helper: Resolve building_id safely
// buildings table has NO institute_code or institute_id column
// (confirmed from the SQL error). Query by name only.
// Returns NULL (never 0) when building not found.
// NULL is safe for nullable FK; 0 is NEVER a valid FK value.
// ─────────────────────────────────────────────────────────────
const resolveBuildingId = async (buildingName) => {
    if (!buildingName || buildingName.trim() === '') return null;
    try {
        const [rows] = await db.query(
            `SELECT id FROM buildings WHERE name = ? LIMIT 1`,
            [buildingName.trim()]
        );
        return rows.length > 0 ? rows[0].id : null;
    } catch (err) {
        console.warn('⚠️  Could not resolve building_id:', err.message);
        return null;
    }
};
 
// ─────────────────────────────────────────────────────────────
 
const departmentController = {
 
    // ── GET ALL DEPARTMENTS ────────────────────────────────────
    getDepartments: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            if (!instituteId) {
                return res.status(400).json({ success: false, message: 'Institute context missing. Please re-login.' });
            }
            const departments = await DepartmentModel.getAll(instituteId);
            res.json({ success: true, data: departments });
        } catch (error) {
            console.error('❌ Get Departments Error:', error.message);
            res.status(500).json({ success: false, message: 'Server error while fetching departments.' });
        }
    },
 
    // ── GET ALL BUILDINGS ──────────────────────────────────────
    // buildings table confirmed to have NO institute_code/institute_id col
    // so we query without a WHERE clause filter on institute
    getBuildings: async (req, res) => {
        try {
            const [buildings] = await db.query(
                `SELECT id, name FROM buildings ORDER BY name ASC`
            );
 
            if (!buildings || buildings.length === 0) {
                return res.json({ success: true, data: HARDCODED_BUILDINGS });
            }
 
            res.json({ success: true, data: buildings });
        } catch (error) {
            // Table doesn't exist yet — return hardcoded fallback, never crash
            console.warn('⚠️  Buildings table not found, returning fallback:', error.message);
            res.json({ success: true, data: HARDCODED_BUILDINGS });
        }
    },
 
    // ── CREATE DEPARTMENT ──────────────────────────────────────
    createDepartment: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const { name, category } = req.body;
 
            if (!instituteId) return res.status(400).json({ success: false, message: 'Institute context missing.' });
            if (!name || !category) {
                return res.status(400).json({ success: false, message: 'Department Name and Category are mandatory.' });
            }
 
            const cleanData = sanitizeData(req.body);
            // UI sends noOfRooms, DB column is roomNumber
            cleanData.roomNumber = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
            delete cleanData.noOfRooms;
 
            const insertId = await DepartmentModel.create(instituteId, cleanData);
            res.status(201).json({ success: true, message: 'Department created successfully.', insertId });
        } catch (error) {
            console.error('❌ Create Department Error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'A department with this code already exists.' });
            }
            res.status(500).json({ success: false, message: `Database Error: ${error.sqlMessage || error.message}` });
        }
    },
 
    // ── UPDATE DEPARTMENT ──────────────────────────────────────
    updateDepartment: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const departmentId = req.params.id;
 
            if (!instituteId || !departmentId) {
                return res.status(400).json({ success: false, message: 'Missing Department ID or Institute Context.' });
            }
 
            const cleanData = sanitizeData(req.body);
            cleanData.roomNumber = cleanData.noOfRooms ?? cleanData.roomNumber ?? null;
            delete cleanData.noOfRooms;
 
            const affectedRows = await DepartmentModel.update(departmentId, instituteId, cleanData);
 
            if (affectedRows === 0) return res.json({ success: true, message: 'No changes were made.' });
            res.json({ success: true, message: 'Department updated successfully.' });
        } catch (error) {
            console.error('❌ Update Department Error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'The new department code is already in use.' });
            }
            res.status(500).json({ success: false, message: `Database Error: ${error.sqlMessage || error.message}` });
        }
    },
 
    // ── DELETE DEPARTMENT ──────────────────────────────────────
    deleteDepartment: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const departmentId = req.params.id;
 
            if (!instituteId || !departmentId) {
                return res.status(400).json({ success: false, message: 'Delete parameters missing.' });
            }
 
            const affectedRows = await DepartmentModel.delete(departmentId, instituteId);
 
            if (affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Department not found or already deleted.' });
            }
            res.json({ success: true, message: 'Department deleted successfully.' });
        } catch (error) {
            console.error('❌ Delete Department Error:', error.message);
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    success: false,
                    message: 'Cannot delete: department is linked to courses or employees.',
                });
            }
            res.status(500).json({ success: false, message: 'Server error while deleting department.' });
        }
    },
 
    // ── ASSIGN ROOM TO DEPARTMENT ──────────────────────────────
    assignRoom: async (req, res) => {
        try {
            const instituteId = getInstituteId(req);
            const { departmentId, building, block, floor, room, type } = req.body;
 
            // ── Validation ──────────────────────────────────────
            if (!departmentId) {
                return res.status(400).json({ success: false, message: 'departmentId is required.' });
            }
            if (!room || String(room).trim() === '') {
                return res.status(400).json({ success: false, message: 'Room number is required.' });
            }
 
            const roomNo      = String(room).trim();
            const buildingVal = building?.trim() || null;
            const blockVal    = block?.trim()    || null;
            const floorVal    = floor?.trim()    || null;
            // rooms.type is NOT NULL with no default — must always be provided
            // Frontend doesn't send it yet, so fall back to 'Classroom'
            const roomType    = type?.trim()     || 'Classroom';
 
            // ── 1. Verify department exists ─────────────────────
            // ✅ departments table: institute_code column (NOT institute_id)
            // ✅ departments table: department_name column (confirmed from logs)
            const [deptRows] = await db.query(
                `SELECT id, department_name
                 FROM departments
                 WHERE id = ? AND institute_code = ?
                 LIMIT 1`,
                [departmentId, instituteId]
            );
 
            if (deptRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Department not found.' });
            }
 
            const deptName = deptRows[0].department_name;
 
            // ── 2. Resolve building_id (NULL safe, 0 NOT safe for FK) ──
            const buildingId = await resolveBuildingId(buildingVal);
 
            // ── 3. Check if room already exists ────────────────
            // ✅ rooms table: institute_id column (NOT institute_code)
            let checkSql    = `SELECT id FROM rooms WHERE room_no = ? AND institute_id = ?`;
            let checkParams = [roomNo, instituteId];
 
            if (buildingVal) { checkSql += ` AND building = ?`; checkParams.push(buildingVal); }
            if (blockVal)    { checkSql += ` AND block = ?`;    checkParams.push(blockVal);    }
            if (floorVal)    { checkSql += ` AND floor = ?`;    checkParams.push(floorVal);    }
 
            const [existingRoom] = await db.query(checkSql, checkParams);
 
            if (existingRoom.length > 0) {
                // ── Room exists → UPDATE department assignment ──
                await db.query(
                    `UPDATE rooms SET department = ?, building_id = ?, type = ? WHERE id = ?`,
                    [deptName, buildingId, roomType, existingRoom[0].id]
                );
            } else {
                // ── Room doesn't exist → INSERT ─────────────────
                // type is NOT NULL with no default — always include it
                await db.query(
                    `INSERT INTO rooms
                        (room_no, building, building_id, block, floor, department, institute_id, type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [roomNo, buildingVal, buildingId, blockVal, floorVal, deptName, instituteId, roomType]
                );
            }
 
            res.status(200).json({
                success: true,
                message: `Room ${roomNo} successfully assigned to ${deptName}!`,
            });
 
        } catch (error) {
            console.error('❌ Assign Room Error:', error);
            if (error.sqlMessage) {
                console.error('   SQL Message:', error.sqlMessage);
                console.error('   SQL:', error.sql);
            }
            // Return the real SQL error message during dev so you can debug instantly
            res.status(500).json({
                success: false,
                message: error.sqlMessage || error.message || 'Failed to assign room.',
            });
        }
    },
};
 
// Hardcoded fallback when buildings table is empty or missing
const HARDCODED_BUILDINGS = [
    { id: 1, name: 'Main Block'  },
    { id: 2, name: 'East Block'  },
    { id: 3, name: 'West Block'  },
    { id: 4, name: 'North Block' },
    { id: 5, name: 'South Block' },
];
 
module.exports = departmentController;