const db = require('../../config/db');

const InstituteModel = {
  // ─── 1. FETCH ALL ─────────────────────────────────────────────────────────
  async getAll() {
    const [rows] = await db.query(
      `SELECT id, organisation, status, plan, created_at, institute_code, admin_email 
       FROM institutes ORDER BY created_at DESC`
    );
    // Parse the JSON string from DB to Object for the frontend list view
    return rows.map(row => ({
      ...row,
      organisation: typeof row.organisation === 'string' ? JSON.parse(row.organisation) : row.organisation
    }));
  },

  // ─── 2. FETCH BY ID ───────────────────────────────────────────────────────
  async findById(id) {
    const [rows] = await db.query(`SELECT * FROM institutes WHERE id = ? LIMIT 1`, [id]);
    if (!rows[0]) return null;
    
    const inst = rows[0];

    // Helper to safely parse JSON only if it's a string
    const safeParse = (data) => {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data; // Return as is if it fails
        }
      }
      return data || {}; // Return empty object instead of null if empty
    };

    return {
      ...inst,
      organisation: safeParse(inst.organisation),
      directors: safeParse(inst.directors),
      legal: safeParse(inst.legal),
      branches: safeParse(inst.branches)
    };
  },

  // ─── 3. DUPLICATE CHECK ───────────────────────────────────────────────────
  // 🚀 FIXED: Added `excludeId` so an institute can update without flagging its own email
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
       (organisation, directors, legal, branches, institute_code, admin_email, password_hash, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        JSON.stringify(organisation), 
        JSON.stringify(directors), 
        JSON.stringify(legal), 
        JSON.stringify(branches),
        institute_code,
        admin_email,
        password_hash
      ]
    );
    return result.insertId;
  },

  // ─── 5. UPDATE (NEW) ──────────────────────────────────────────────────────
  // 🚀 NEW: Dynamically builds the update query based on what data was sent
  async update(id, data) {
    const updates = [];
    const params = [];

    if (data.organisation) {
      updates.push('organisation = ?');
      params.push(JSON.stringify(data.organisation));
      
      // Keep the searchable admin_email column synced with the JSON data
      if (data.organisation.email) {
        updates.push('admin_email = ?');
        params.push(data.organisation.email);
      }
    }
    if (data.directors) {
      updates.push('directors = ?');
      params.push(JSON.stringify(data.directors));
    }
    if (data.legal) {
      updates.push('legal = ?');
      params.push(JSON.stringify(data.legal));
    }
    if (data.branches) {
      updates.push('branches = ?');
      params.push(JSON.stringify(data.branches));
    }

    if (updates.length === 0) return 0; // Nothing to update

    const query = `UPDATE institutes SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    const [result] = await db.query(query, params);
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
  }
};

module.exports = InstituteModel;