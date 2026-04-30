const db = require('../../config/db');

const InfrastructureModel = {

  // ─── FETCH ────────────────────────────────────────────────────────────────

  getCampusesWithBuildings: async (instituteId) => {
    const [campuses] = await db.query(
      'SELECT * FROM campuses WHERE institute_id = ? ORDER BY name ASC',
      [instituteId]
    );

    if (!campuses.length) return [];

    const [buildings] = await db.query(
      'SELECT * FROM buildings WHERE institute_id = ? ORDER BY name ASC',
      [instituteId]
    );

    return campuses.map(campus => ({
      id: campus.id,
      name: campus.name,
      address: campus.address,
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
        r.id,
        r.room_no     AS roomNo,
        r.type,
        r.capacity    AS cap,
        r.floor,
        r.block,
        r.is_active   AS active,
        b.name        AS building,
        COALESCE(SUM(e.quantity), 0) AS eq
      FROM rooms r
      LEFT JOIN buildings b ON r.building_id = b.id
      LEFT JOIN equipment e ON r.id = e.room_id
      WHERE r.institute_id = ?
      GROUP BY r.id, r.room_no, r.type, r.capacity, r.floor, r.block, r.is_active, b.name
      ORDER BY r.room_no ASC
    `, [instituteId]);
    return rows;
  },

  /**
   * 🚀 THIS WAS MISSING — caused the 500 error.
   * Called by createBuilding and updateBuilding in the controller.
   * @param {number} instituteId
   * @param {number} campusId
   * @param {string} name
   * @param {number|null} excludeId - pass building id when editing so we don't flag itself as duplicate
   */
  checkBuildingExists: async (instituteId, campusId, name, excludeId = null) => {
    let query = `
      SELECT id FROM buildings
      WHERE institute_id = ? AND campus_id = ? AND LOWER(TRIM(name)) = LOWER(TRIM(?))
    `;
    const params = [instituteId, campusId, name];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows.length > 0;
  },

  // ─── CREATE ───────────────────────────────────────────────────────────────

  createCampus: async (instituteId, data) => {
    const [result] = await db.query(
      'INSERT INTO campuses (institute_id, name, address, property_type) VALUES (?, ?, ?, ?)',
      [instituteId, data.name, data.address || '', data.property]
    );
    return result.insertId;
  },

  createBuilding: async (instituteId, data) => {
    const [result] = await db.query(
      'INSERT INTO buildings (institute_id, campus_id, name, floors, block, rooms_count) VALUES (?, ?, ?, ?, ?, ?)',
      [instituteId, data.campus_id, data.name, data.floors || 1, data.block || '', data.rooms || 0]
    );
    return result.insertId;
  },

  createRoom: async (instituteId, data) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [roomResult] = await connection.query(
        'INSERT INTO rooms (institute_id, building_id, room_no, type, capacity, floor, block) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          instituteId,
          data.building_id,
          data.roomNo,
          data.type,
          data.capacity || 0,
          data.floor || '',
          data.block || ''
        ]
      );
      const roomId = roomResult.insertId;

      if (data.equipment && data.equipment.length > 0) {
        const eqValues = data.equipment
          .filter(eq => eq.name && eq.name.trim())
          .map(eq => [instituteId, roomId, eq.name.trim(), eq.asset_id || null, eq.quantity || 1]);

        if (eqValues.length > 0) {
          await connection.query(
            'INSERT INTO equipment (institute_id, room_id, name, asset_id, quantity) VALUES ?',
            [eqValues]
          );
        }
      }

      await connection.commit();
      return roomId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  updateCampus: async (instituteId, id, data) => {
    const [result] = await db.query(
      'UPDATE campuses SET name = ?, address = ?, property_type = ? WHERE id = ? AND institute_id = ?',
      [data.name, data.address || '', data.property, id, instituteId]
    );
    return result.affectedRows;
  },

  updateBuilding: async (instituteId, id, data) => {
    const [result] = await db.query(
      'UPDATE buildings SET name = ?, floors = ?, block = ?, rooms_count = ? WHERE id = ? AND institute_id = ?',
      [data.name, data.floors || 1, data.block || '', data.rooms || 0, id, instituteId]
    );
    return result.affectedRows;
  },

  updateRoom: async (instituteId, id, data) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE rooms SET room_no = ?, type = ?, capacity = ?, floor = ?, block = ?, building_id = ? WHERE id = ? AND institute_id = ?',
        [
          data.roomNo,
          data.type,
          data.capacity || 0,
          data.floor || '',
          data.block || '',
          data.building_id,
          id,
          instituteId
        ]
      );

      // Full replace of equipment: delete old, insert new
      await connection.query(
        'DELETE FROM equipment WHERE room_id = ? AND institute_id = ?',
        [id, instituteId]
      );

      if (data.equipment && data.equipment.length > 0) {
        const eqValues = data.equipment
          .filter(eq => eq.name && eq.name.trim())
          .map(eq => [instituteId, id, eq.name.trim(), eq.asset_id || null, eq.quantity || 1]);

        if (eqValues.length > 0) {
          await connection.query(
            'INSERT INTO equipment (institute_id, room_id, name, asset_id, quantity) VALUES ?',
            [eqValues]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // ─── TOGGLE STATUS ────────────────────────────────────────────────────────

  toggleStatus: async (tableName, id, instituteId, status) => {
    const allowedTables = ['campuses', 'buildings', 'rooms'];
    if (!allowedTables.includes(tableName)) throw new Error('Invalid table name');

    const [result] = await db.query(
      `UPDATE ${tableName} SET is_active = ? WHERE id = ? AND institute_id = ?`,
      [status, id, instituteId]
    );
    return result.affectedRows;
  },

  // ─── DELETE ───────────────────────────────────────────────────────────────

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

};

module.exports = InfrastructureModel;