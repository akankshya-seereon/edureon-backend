const SuperAdmin = require('../model/superAdminModel');

// Helper function to safely parse JSON without crashing the app
const safeParseJSON = (data) => {
  if (!data) return null;
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return null;
  }
};

exports.getInstitutes = async (req, res) => {
  try {
    const rawRows = await SuperAdmin.getAllInstitutes();

    const formattedInstitutes = rawRows.map(row => {
      // 1. Bulletproof JSON Parsing using our helper
      const org = safeParseJSON(row.organisation) || {};

      return {
        id: row.id,
        institute_code: row.institute_code,
        name: org.name || "N/A", 
        type: org.type || "Institute", 
        city: org.city || "N/A",
        state: org.state || "N/A",
        address: org.address1 || "No Address Provided",
        status: row.status || "Active",
        plan: row.plan || "Premium",
        email: org.email || row.admin_email || "N/A",
        phone: org.phone || row.admin_phone || "N/A",
        joined: row.joinedDate || "-",
        
        // These are fine as 0 for the lightweight list. 
        // The real data is fetched in getInstituteFullDetails when they click the row!
        students: 0,
        teachers: 0,
      };
    });

    res.json({ success: true, data: formattedInstitutes });
  } catch (err) {
    console.error("Format Error:", err.message);
    res.status(500).json({ success: false, message: "Error parsing institute data." });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await SuperAdmin.getDashboardStats();
    res.json({ 
      success: true, 
      data: { ...stats, monthlyRevenue: 0, expiringSubscriptions: 0 } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 🚀 NEW: FETCH DYNAMIC DEEP DETAILS
// ==========================================
exports.getInstituteFullDetails = async (req, res) => {
  try {
    const instituteId = req.params.id;

    // Fetch everything in parallel to make the dashboard load instantly
    const [
      instituteBase,
      counts,
      recentStudents,
      recentFaculty,
      recentBatches
    ] = await Promise.all([
      SuperAdmin.getInstituteById(instituteId),        // Get base info
      SuperAdmin.getInstituteCounts(instituteId),      // Get Total Numbers
      SuperAdmin.getRecentStudents(instituteId),       // Get top 5 students
      SuperAdmin.getRecentFaculty(instituteId),        // Get top 5 faculty
      SuperAdmin.getRecentBatches(instituteId)         // Get batches
    ]);

    if (!instituteBase) {
      return res.status(404).json({ success: false, message: "Institute not found" });
    }

    // Safely parse ALL JSON columns for the Info & Legal Tab
    const org = safeParseJSON(instituteBase.organisation) || {};
    const directors = safeParseJSON(instituteBase.directors) || [];
    const legal = safeParseJSON(instituteBase.legal) || null;
    const branches = safeParseJSON(instituteBase.branches) || [];

    // Construct the massive object the React UI expects!
    const fullDetails = {
      id: instituteBase.id,
      institute_code: instituteBase.institute_code,
      name: org.name || "N/A",
      city: org.city || "N/A",
      email: org.email || instituteBase.admin_email,
      phone: org.phone || instituteBase.admin_phone,
      admin_name: instituteBase.admin_name || "N/A", // 🚀 Added Admin Name!
      status: instituteBase.status || "Active",
      plan: instituteBase.plan || "Premium",
      
      // 🚀 Added Parsed JSON Arrays so the "Info & Legal" tab populates
      directors,
      legal,
      branches,
      
      // 📊 DYNAMIC COUNTS
      totalStudents: counts.total_students || 0,
      totalFaculty: counts.total_faculty || 0, // Maps to total_faculty from model
      totalBatches: counts.total_batches || 0,
      totalCollections: counts.total_collections || 0,
      
      // 📋 DYNAMIC LISTS FOR THE TABLES
      studentsList: recentStudents || [],
      facultyList: recentFaculty || [],
      batchesList: recentBatches || []
    };

    res.json({ success: true, data: fullDetails });

  } catch (err) {
    console.error("Full Details Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching deep institute details." });
  }
};