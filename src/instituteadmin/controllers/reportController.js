const ReportModel = require('../models/reportModel');

/**
 * 📊 1. GENERATE REPORT CONTROLLER
 * Path: GET /api/admin/reports/generate
 */
exports.generateReport = async (req, res) => {
  try {
    // 🚀 THE DUAL-ID FIX: Grab BOTH identifiers from the token
    const instituteCode = req.user.institute_code || req.user.instituteCode; 
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id; 

    const { reportId } = req.query;

    if (!reportId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing reportId parameter in query string" 
      });
    }

    let data = [];
    const reportType = parseInt(reportId);

    // 🚀 Route the correct ID type to the correct database table!
    switch (reportType) {
      case 1:
        // Attendance (Students table) uses numeric ID
        data = await ReportModel.getAttendanceReport(instituteId, req.query);
        break;
      case 2:
        // Fees (fee_structures table) uses numeric ID
        data = await ReportModel.getFeesReport(instituteId, req.query);
        break;
      case 3:
        // Students Enrollment uses numeric ID
        data = await ReportModel.getStudentReport(instituteId, req.query);
        break;
      case 4:
        // Faculty (Employees table) uses the string code (e.g., SAM751030)
        data = await ReportModel.getFacultyReport(instituteCode, req.query);
        break;
      default:
        return res.status(400).json({ 
            success: false, 
            message: "Invalid report type selected" 
        });
    }

    // Send the result back to the React Table
    res.json({ 
        success: true, 
        reportType: reportType, 
        data: data || [] 
    });

  } catch (err) {
    console.error("❌ SQL ERROR in generateReport Controller:", err.message);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error while generating report.",
        error: err.message
    });
  }
};

/**
 * 📊 2. GET FILTER OPTIONS (NEW)
 * Path: GET /api/admin/reports/filters
 * Fetches dynamic courses and departments for the React dropdowns.
 */
exports.getFilterOptions = async (req, res) => {
  try {
    // 🚀 Grab BOTH identifiers here too
    const instituteCode = req.user.institute_code || req.user.instituteCode;
    const instituteId = req.user.institute_id || req.user.instituteId || req.user.id;
    
    // Pass BOTH to the model so it can query students (ID) and departments (Code)
    const options = await ReportModel.getFilterOptions(instituteCode, instituteId);

    res.status(200).json({
      success: true,
      data: {
        // Inject "All" options at the top of the arrays
        courses: ["All Courses", ...options.courses],
        departments: ["All Departments", ...options.departments]
      }
    });

  } catch (err) {
    console.error("❌ SQL ERROR in getFilterOptions:", err.message);
    res.status(500).json({ success: false, message: "Failed to load dynamic filters" });
  }
};