const db = require('../../config/db');
const bcrypt = require('bcrypt');

const InstituteModel = {

  // ─── 1. FETCH ALL ─────────────────────────────────────────────────────────
  // Returns a consistent flat+nested shape that the frontend normalise() understands
  async getAll() {
    const [rows] = await db.query(
      `SELECT 
         id, 
         organisation, 
         status, 
         IFNULL(plan, 'Premium') AS plan, 
         created_at, 
         institute_code, 
         admin_email 
       FROM institutes 
       ORDER BY created_at DESC`
    );

    return rows.map(row => {
      // Safely parse JSON organisation blob
      let org = row.organisation;
      if (typeof org === 'string') {
        try { org = JSON.parse(org); } catch { org = {}; }
      }
      org = org || {};

      return {
        id:             row.id,
        status:         row.status         || 'Active',
        plan:           row.plan           || 'Premium',
        created_at:     row.created_at,
        institute_code: row.institute_code,
        admin_email:    row.admin_email,

        // ✅ Flat fields — so normalise() can read dbInst.name directly
        name:  org.name  || '',
        email: org.email || row.admin_email || '',
        phone: org.phone || '',
        city:  org.city  || '',
        state: org.state || '',
        type:  org.type  || 'Institute',

        // ✅ Also keep nested object — for any code that reads inst.organisation.name
        organisation: org,
      };
    });
  },

  // ─── 2. FETCH BY ID OR CODE ───────────────────────────────────────────────
  async findById(identifier) {
    // 🚀 FIXED: Smart search! Checks BOTH numeric 'id' OR string 'institute_code'
    const [rows] = await db.query(
      `SELECT * FROM institutes WHERE id = ? OR institute_code = ? LIMIT 1`, 
      [identifier, identifier]
    );
    if (!rows[0]) return null;

    const inst = rows[0];

    const safeParse = (data) => {
      if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return {}; }
      }
      return data || {};
    };

    const org = safeParse(inst.organisation);

    return {
      ...inst,
      organisation: org,
      directors:    safeParse(inst.directors),
      legal:        safeParse(inst.legal),
      branches:     safeParse(inst.branches),

      // ✅ Flat fields mirrored here too — controller's getFullInstituteDetails needs them
      name:  org.name  || '',
      email: org.email || inst.admin_email || '',
      city:  org.city  || '',
      state: org.state || '',
      type:  org.type  || 'Institute',
      plan:  inst.plan || 'Premium',
    };
  },

  // ─── 3. DUPLICATE CHECK ───────────────────────────────────────────────────
  async emailExists(email, excludeId = null) {
    let query = 'SELECT id FROM institutes WHERE admin_email = ?';
    const params = [email];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await db.query(query, params);
    return rows.length > 0;
  },

  // ─── 4. CREATE ────────────────────────────────────────────────────────────
  async create({ organisation, directors, legal, branches, institute_code, admin_email, password_hash }) {
    const [result] = await db.query(
      `INSERT INTO institutes 
         (organisation, directors, legal, branches, 
          institute_code, admin_email, password_hash, 
          status, plan, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', 'Premium', NOW())`,
      [
        JSON.stringify(organisation),
        JSON.stringify(directors  || []),
        JSON.stringify(legal      || {}),
        JSON.stringify(branches   || []),
        institute_code,
        admin_email,
        password_hash,
      ]
    );
    return result.insertId;
  },

  // ─── 5. UPDATE ────────────────────────────────────────────────────────────
  async update(id, data) {
    const updates = [];
    const params  = [];

    if (data.organisation) {
      updates.push('organisation = ?');
      params.push(JSON.stringify(data.organisation));
      if (data.organisation.email) {
        updates.push('admin_email = ?');
        params.push(data.organisation.email);
      }
    }
    if (data.directors) { updates.push('directors = ?'); params.push(JSON.stringify(data.directors)); }
    if (data.legal)     { updates.push('legal = ?');     params.push(JSON.stringify(data.legal));     }
    if (data.branches)  { updates.push('branches = ?');  params.push(JSON.stringify(data.branches));  }

    if (updates.length === 0) return 0;

    params.push(id);
    const [result] = await db.query(
      `UPDATE institutes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows;
  },

  // ─── 6. TOGGLE STATUS ─────────────────────────────────────────────────────
  async toggleStatus(id, status) {
    const dbStatus = status ? 'Active' : 'Suspended';
    const [result] = await db.query(`UPDATE institutes SET status = ? WHERE id = ?`, [dbStatus, id]);
    return result.affectedRows;
  },

  // ─── 7. DELETE ────────────────────────────────────────────────────────────
  async delete(id) {
    const [result] = await db.query(`DELETE FROM institutes WHERE id = ?`, [id]);
    return result.affectedRows;
  },
};

module.exports = InstituteModel;