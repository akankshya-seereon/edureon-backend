const db = require('../../config/db');

const DepartmentModel = {

  // ─── GET ALL DEPARTMENTS ───────────────────────────────────────────────────
  getAll: async (instituteId) => {
  const [rows] = await db.query(`
    SELECT
      d.id,
      d.department_name       AS name,
      d.department_code,
      d.head                  AS hodId,
      d.lead_role             AS leadRole,
      d.category,
      d.type,
      d.description,
      d.room_number           AS roomNumber,
      CONCAT(COALESCE(e.firstName,''), ' ', COALESCE(e.lastName,'')) AS hod_name
    FROM departments d
    LEFT JOIN employees e ON d.head = e.id
    WHERE d.institute_code = ?
    ORDER BY d.id DESC
  `, [instituteId]);
  return rows;
},
  // ─── CREATE ────────────────────────────────────────────────────────────────
  create: async (instituteId, data) => {
    const sanitize = (val) => (val === '' || val === undefined ? null : val);

    const [result] = await db.query(`
      INSERT INTO departments
        (institute_code, department_name, department_code, head, lead_role, category, type, description, room_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      instituteId,
      sanitize(data.name),
      sanitize(data.department_code),
      sanitize(data.hodId),
      sanitize(data.leadRole),
      sanitize(data.category),
      data.type || 'Academic',
      sanitize(data.description),
      sanitize(data.roomNumber ?? data.room_number ?? data.noOfRooms),
    ]);

    return result.insertId;
  },

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  update: async (id, instituteId, data) => {
    const sanitize = (val) => (val === '' || val === undefined ? null : val);

    const [result] = await db.query(`
      UPDATE departments
      SET
        department_name = ?,
        department_code = ?,
        head            = ?,
        lead_role       = COALESCE(?, lead_role),
        category        = ?,
        description     = COALESCE(?, description),
        room_number     = ?,
        type            = COALESCE(?, type)
      WHERE id = ? AND institute_code = ?
    `, [
      sanitize(data.name),
      sanitize(data.department_code),
      sanitize(data.hodId),
      sanitize(data.leadRole),
      sanitize(data.category),
      sanitize(data.description),
      sanitize(data.roomNumber ?? data.room_number ?? data.noOfRooms),
      sanitize(data.type),
      id,
      instituteId,
    ]);

    return result.affectedRows;
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  delete: async (id, instituteId) => {
    const [result] = await db.query(
      'DELETE FROM departments WHERE id = ? AND institute_code = ?',
      [id, instituteId]
    );
    return result.affectedRows;
  },
};

module.exports = DepartmentModel;