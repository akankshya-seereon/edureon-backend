const db = require('../../config/db');

const PrincipalModel = {
  // 1. Get Aggregated Dashboard Stats
  getDashboardStats: async (instituteId) => {
    try {
      // These are example queries. Adjust table names to your actual DB schema.
      const queries = [
        db.query(`SELECT COUNT(*) as pending FROM leave_requests WHERE institute_id = ? AND status = 'Pending'`, [instituteId]),
        db.query(`SELECT AVG(attendance_percentage) as avg_attendance FROM batches WHERE institute_id = ?`, [instituteId]),
        db.query(`SELECT AVG(pass_percentage) as pass_rate FROM exams WHERE institute_id = ?`, [instituteId])
      ];

      const results = await Promise.all(queries);

      return {
        pendingApprovals: results[0][0][0]?.pending || 0,
        attendanceRate: Math.round(results[1][0][0]?.avg_attendance || 82), // Fallback to 82 if null
        passRate: Math.round(results[2][0][0]?.pass_rate || 91),
        workload: 94 // Example static calculation, replace with real logic if needed
      };
    } catch (err) {
      throw new Error("Error fetching stats: " + err.message);
    }
  },

  // 2. Get Today's Meetings
  getTodayMeetings: async (instituteId) => {
    try {
      const query = `
        SELECT id, time, duration, title, description as 'desc', status, type 
        FROM meetings 
        WHERE institute_id = ? AND DATE(meeting_date) = CURDATE()
        ORDER BY time ASC
      `;
      const [rows] = await db.query(query, [instituteId]);
      return rows;
    } catch (err) {
      console.error("Meetings Error:", err.message);
      return []; // Return empty array so frontend doesn't crash
    }
  },

  // 3. Get Pending Approvals (Leaves, NOCs)
  getPendingApprovals: async (instituteId) => {
    try {
      const query = `
        SELECT id, type, details, status 
        FROM approvals 
        WHERE institute_id = ? AND status = 'Pending'
        LIMIT 10
      `;
      const [rows] = await db.query(query, [instituteId]);
      return rows;
    } catch (err) {
      console.error("Approvals Error:", err.message);
      return [];
    }
  },

  // 4. Update Approval Status (Approve/Reject)
  updateApprovalStatus: async (approvalId, instituteId, status) => {
    try {
      const query = `UPDATE approvals SET status = ? WHERE id = ? AND institute_id = ?`;
      const [result] = await db.query(query, [status, approvalId, instituteId]);
      return result.affectedRows > 0;
    } catch (err) {
      throw new Error("Error updating approval: " + err.message);
    }
  }
};

module.exports = PrincipalModel;