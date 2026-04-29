const db = require('../../config/db');
 
const InfrastructureModel = {
  // --- FETCHING ALL NESTED DATA FOR THE UI ---
  getCampusesWithBuildings: async (instituteId) => {
    // 1. Get Campuses
    const [campuses] = await db.query(
      'SELECT * FROM campuses WHERE institute_id = ? ORDER BY name ASC',
      [instituteId]
    );
 
    // 2. Get Buildings
    const [buildings] = await db.query(
      'SELECT * FROM buildings WHERE institute_id = ? ORDER BY name ASC',
      [instituteId]
    );
 
    // Map buildings into their respective campuses to match React state structure
    return campuses.map(campus => ({
      id: campus.id,
      name: campus.name,
      address: campus.address, // ✅ Fixed: Added address so the frontend receives it
      property: campus.property_type,
      active: campus.is_active,
      buildings: buildings
        .filter(b => b.campus_id === campus.id)
        .map(b => ({
          id: b.id,
          name: b.name,
          floors: b.floors,
          block: b.block,
          rooms: b.rooms_count,
          active: b.is_active
        }))
    }));
  },
 
  getAllRooms: async (instituteId) => {
    const [rows] = await db.query(`
      SELECT
        r.id, r.room_no AS roomNo, r.type, r.capacity AS cap, r.floor, r.block, r.is_active AS active,
        b.name AS building,
        COALESCE(SUM(e.quantity), 0) AS eq
      FROM rooms r
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN equipment e ON r.id = e.room_id
      WHERE r.institute_id = ?
      GROUP BY r.id
      ORDER BY r.room_no ASC
    `, [instituteId]);
    return rows;
  },
 
  // --- CREATION QUERIES ---
  createCampus: async (instituteId, data) => {
    const [result] = await db.query(
      'INSERT INTO campuses (institute_id, name, address, property_type) VALUES (?, ?, ?, ?)',
      [instituteId, data.name, data.address, data.property]
    );
    return result.insertId;
  },
 
  createBuilding: async (instituteId, data) => {
    const [result] = await db.query(
      'INSERT INTO buildings (institute_id, campus_id, name, floors, block, rooms_count) VALUES (?, ?, ?, ?, ?, ?)',
      [instituteId, data.campus_id, data.name, data.floors, data.block, data.rooms]
    );
    return result.insertId;
  },
 
  createRoom: async (instituteId, data) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
 
      // Insert Room
      const [roomResult] = await connection.query(
        'INSERT INTO rooms (institute_id, building_id, room_no, type, capacity, floor, block) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [instituteId, data.building_id, data.roomNo, data.type, data.capacity, data.floor, data.block]
      );
      const roomId = roomResult.insertId;
 
      // Insert Equipment if provided
      if (data.equipment && data.equipment.length > 0) {
        const eqValues = data.equipment.map(eq => [
          instituteId, roomId, eq.name, eq.asset_id || null, eq.quantity || 1
        ]);
        await connection.query(
          'INSERT INTO equipment (institute_id, room_id, name, asset_id, quantity) VALUES ?',
          [eqValues]
        );
      }
 
      await connection.commit();
      return roomId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      if (connection) connection.release();
    }
  },
 
  // --- TOGGLE ACTIVE STATUS ---
  toggleStatus: async (tableName, id, instituteId, status) => {
    // Whitelist tables to prevent SQL injection
    const allowedTables = ['campuses', 'buildings', 'rooms'];
    if (!allowedTables.includes(tableName)) throw new Error('Invalid table');
 
    const [result] = await db.query(
      `UPDATE ${tableName} SET is_active = ? WHERE id = ? AND institute_id = ?`,
      [status, id, instituteId]
    );
    return result.affectedRows;
  },
 
  // 🚀 --- DELETE QUERIES ---
  deleteCampus: async (instituteId, id) => {
    const [result] = await db.query(
      'DELETE FROM campuses WHERE id = ? AND institute_id = ?',
      [id, instituteId]
    );
    return result.affectedRows;
  },
 
  deleteBuilding: async (instituteId, id) => {
    const [result] = await db.query(
      'DELETE FROM buildings WHERE id = ? AND institute_id = ?',
      [id, instituteId]
    );
    return result.affectedRows;
  },
 
  deleteRoom: async (instituteId, id) => {
    const [result] = await db.query(
      'DELETE FROM rooms WHERE id = ? AND institute_id = ?',
      [id, instituteId]
    );
    return result.affectedRows;
  },
 
  // 📝 --- UPDATE QUERIES ---
  updateCampus: async (instituteId, id, data) => {
    const [result] = await db.query(
      'UPDATE campuses SET name = ?, address = ?, property_type = ? WHERE id = ? AND institute_id = ?',
      [data.name, data.address, data.property, id, instituteId]
    );
    return result.affectedRows;
  },
 
  updateBuilding: async (instituteId, id, data) => {
    const [result] = await db.query(
      'UPDATE buildings SET name = ?, floors = ?, block = ?, rooms_count = ? WHERE id = ? AND institute_id = ?',
      [data.name, data.floors, data.block, data.rooms, id, instituteId]
    );
    return result.affectedRows;
  },
 
  updateRoom: async (instituteId, id, data) => {
    const [result] = await db.query(
      'UPDATE rooms SET room_no = ?, type = ?, capacity = ?, floor = ?, block = ?, building_id = ? WHERE id = ? AND institute_id = ?',
      [data.roomNo, data.type, data.capacity, data.floor, data.block, data.building_id, id, instituteId]
    );
    return result.affectedRows;
  }
};
 
module.exports = InfrastructureModel;