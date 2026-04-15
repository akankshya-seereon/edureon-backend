const db = require('../../config/db');

const SuperAdmin = {
  // ==========================================
  // 📊 GLOBAL DASHBOARD STATS
  // ==========================================
  // 1. Fetch Aggregated Stats
  getDashboardStats: async () => {
    try {
      const queries = [
        db.query(`SELECT COUNT(*) as count FROM institutes`),
        db.query(`SELECT COUNT(*) as count FROM institutes WHERE status = 'Active'`),
        db.query(`SELECT COUNT(*) as count FROM institutes WHERE status = 'Suspended'`),
        db.query(`SELECT COUNT(*) as count FROM faculties`), // 🚀 Updated to 'faculties'
        db.query(`SELECT COUNT(*) as count FROM students`)
      ];

      const results = await Promise.all(queries);

      return {
        totalInstitutes: results[0][0][0].count || 0,
        activeInstitutes: results[1][0][0].count || 0,
        suspendedInstitutes: results[2][0][0].count || 0,
        totalTeachers: results[3][0][0].count || 0,
        totalStudents: results[4][0][0].count || 0,
      };
    } catch (err) {
      throw new Error("Database Stats Error: " + err.message);
    }
  },

  // 2. Fetch All Institutes (Selecting JSON columns)
  getAllInstitutes: async () => {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, 
          organisation, 
          status, 
          plan, 
          institute_code, 
          admin_email, 
          admin_phone,
          DATE_FORMAT(created_at, '%b %Y') as joinedDate
         FROM institutes 
         ORDER BY created_at DESC`
      );
      return rows;
    } catch (err) {
      throw new Error("Database Institute Fetch Error: " + err.message);
    }
  },

  // ==========================================
  // 🔍 DEEP INSTITUTE DETAILS (FOR MODAL/DASHBOARD)
  // ==========================================

  // 3. Get the base institute info by ID
  getInstituteById: async (instituteId) => {
    try {
      const query = `SELECT * FROM institutes WHERE id = ?`;
      const [rows] = await db.query(query, [instituteId]);
      return rows[0];
    } catch (err) {
      throw new Error("Error fetching institute by ID: " + err.message);
    }
  },

  // 4. Count the total records dynamically for a specific institute
  getInstituteCounts: async (instituteId) => {
    try {
      const queries = [
        db.query(`SELECT COUNT(*) as count FROM students WHERE institute_id = ?`, [instituteId]),
        db.query(`SELECT COUNT(*) as count FROM faculties WHERE institute_id = ?`, [instituteId]),
        db.query(`SELECT COUNT(*) as count FROM batches WHERE institute_id = ?`, [instituteId]),
        db.query(`SELECT SUM(amount) as total FROM fees WHERE institute_id = ? AND status = 'paid'`, [instituteId])
      ];

      const results = await Promise.all(queries);

      return {
        total_students: results[0][0][0].count || 0,
        total_faculty: results[1][0][0].count || 0,
        total_batches: results[2][0][0].count || 0,
        total_collections: results[3][0][0].total || 0
      };
    } catch (err) {
      console.error("Count Error:", err.message);
      // Return 0s if something fails so it doesn't crash the whole dashboard
      return { total_students: 0, total_faculty: 0, total_batches: 0, total_collections: 0 };
    }
  },

  // 5. Get recent students for the UI Table
  getRecentStudents: async (instituteId) => {
    try {
      const query = `
        SELECT 
          CONCAT(first_name, ' ', last_name) AS name, 
          roll_no, 
          course AS batch, 
          status 
        FROM students 
        WHERE institute_id = ? 
        ORDER BY id DESC 
        LIMIT 5
      `;
      const [rows] = await db.query(query, [instituteId]);
      return rows;
    } catch (err) {
      console.error("Recent Students Error:", err.message);
      return [];
    }
  },

  // 6. Get recent faculty for the UI Table
  // 6. Get recent faculty for the UI Table
  getRecentFaculty: async (instituteId) => {
    try {
      const query = `
        SELECT 
          CONCAT(first_name, ' ', last_name) AS name, 
          designation,     /* 🚀 Pulling the real designation */
          department,      /* 🚀 Pulling the real department */
          status 
        FROM faculties 
        WHERE institute_id = ? 
        ORDER BY id DESC 
        LIMIT 5
      `;
      const [rows] = await db.query(query, [instituteId]);
      return rows;
    } catch (err) {
      console.error("Recent Faculty Error:", err.message);
      return [];
    }
  },

  // 7. Get recent batches for the UI Table
  getRecentBatches: async (instituteId) => {
    try {
      const query = `
        SELECT * FROM batches 
        WHERE institute_id = ? 
        ORDER BY id DESC
        LIMIT 5
      `;
      const [rows] = await db.query(query, [instituteId]);
      return rows;
    } catch (err) {
      console.error("Recent Batches Error:", err.message);
      return [];
    }
  }
};

module.exports = SuperAdmin;