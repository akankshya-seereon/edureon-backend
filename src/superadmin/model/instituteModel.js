const db = require('../../config/db');

const InstituteModel = {
  // Fetch all institutes
  async getAll() {
    const [rows] = await db.query(
      `SELECT id, organisation, status, plan, created_at, institute_code, admin_email 
       FROM institutes ORDER BY created_at DESC`
    );
    // Parse the JSON string from DB to Object for the frontend
    return rows.map(row => ({
      ...row,
      organisation: typeof row.organisation === 'string' ? JSON.parse(row.organisation) : row.organisation
    }));
  },

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
      return data; // Already an object
    };

    return {
      ...inst,
      organisation: safeParse(inst.organisation),
      directors: safeParse(inst.directors),
      legal: safeParse(inst.legal),
      branches: safeParse(inst.branches)
    };
  },

  async emailExists(email) {
    const [rows] = await db.query('SELECT id FROM institutes WHERE admin_email = ?', [email]);
    return rows.length > 0;
  },

  async create({ organisation, directors, legal, branches, institute_code, admin_email, password_hash }) {
    const [result] = await db.query(
      // 🚀 FIXED: Changed 'admin_password_hash' to 'password_hash' below
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
        password_hash // Maps perfectly to the updated column
      ]
    );
    return result.insertId;
  },

  async toggleStatus(id, status) {
    const dbStatus = status ? 'Active' : 'Suspended';
    await db.query(`UPDATE institutes SET status = ? WHERE id = ?`, [dbStatus, id]);
  },

  async delete(id) {
    await db.query(`DELETE FROM institutes WHERE id = ?`, [id]);
  }
};

module.exports = InstituteModel;