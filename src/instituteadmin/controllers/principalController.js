const PrincipalModel = require('../models/principalModel');

// Fetch EVERYTHING for the dashboard in one single API call
exports.getPrincipalDashboard = async (req, res) => {
  try {
    // Extracted from your auth middleware
    const instituteId = req.instituteId; 

    // Fetch data in parallel for high performance
    const [stats, meetings, approvals] = await Promise.all([
      PrincipalModel.getDashboardStats(instituteId),
      PrincipalModel.getTodayMeetings(instituteId),
      PrincipalModel.getPendingApprovals(instituteId)
    ]);

    // Format the response exactly how the React UI expects it
    const dashboardData = {
      stats: {
        attendance: `${stats.attendanceRate}%`,
        workload: `${stats.workload}%`,
        passRate: `${stats.passRate}%`,
        pendingApprovals: stats.pendingApprovals
      },
      meetings: meetings.length > 0 ? meetings : [
        // Fallback dummy data if table is empty just to show UI
        { id: 1, time: '9:30', duration: '1hr', title: 'Academic Council Meeting', desc: 'All HODs, Dean · Senate Hall', status: 'In Progress', type: 'progress' }
      ],
      approvals: approvals,
      
      // Chart Data (You can replace this with real DB queries later)
      charts: {
        attendanceData: [
          { name: 'CSE', val: 85 }, { name: 'ECE', val: 80 }, { name: 'ME', val: 74 },
          { name: 'CE', val: 90 }, { name: 'IT', val: 88 }
        ],
        workloadData: [
          { name: 'Active', value: stats.workload },
          { name: 'Free', value: 100 - stats.workload }
        ]
      }
    };

    res.status(200).json({ success: true, data: dashboardData });

  } catch (err) {
    console.error("Principal Dashboard Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load dashboard data." });
  }
};

// Handle Approve/Reject actions from the table
exports.handleApproval = async (req, res) => {
  try {
    const instituteId = req.instituteId;
    const { id } = req.params;
    const { status } = req.body; // Expects 'Approved' or 'Rejected'

    const success = await PrincipalModel.updateApprovalStatus(id, instituteId, status);
    
    if (success) {
      res.status(200).json({ success: true, message: `Request successfully ${status}` });
    } else {
      res.status(404).json({ success: false, message: "Approval record not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};