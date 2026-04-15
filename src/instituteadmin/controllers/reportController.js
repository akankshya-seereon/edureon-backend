const ReportModel = require('../models/reportModel');

exports.generateReport = async (req, res) => {
  try {
    // 1. Get the real ID from the token (matches your institute_id column)
    // If your token stores it as 'id' or 'instituteId', update accordingly
    const instituteId = req.user.id || req.user.instituteId; 

    const { reportId } = req.query;

    // 2. Safety Check: If Postman doesn't send reportId, stop here
    if (!reportId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing reportId parameter in query string" 
      });
    }

    let data = [];

    // 3. Switch based on which Report Card the user selected in React
    // We pass instituteId and the entire query (for dateFrom, course, etc.)
    switch (parseInt(reportId)) {
      case 1:
        data = await ReportModel.getAttendanceReport(instituteId, req.query);
        break;
      case 2:
        data = await ReportModel.getFeesReport(instituteId, req.query);
        break;
      case 3:
        data = await ReportModel.getStudentReport(instituteId, req.query);
        break;
      case 4:
        data = await ReportModel.getFacultyReport(instituteId, req.query);
        break;
      default:
        return res.status(400).json({ 
            success: false, 
            message: "Invalid report type selected" 
        });
    }

    // 4. Send the result back to the React Table
    res.json({ 
        success: true, 
        reportType: reportId, 
        data 
    });

  } catch (err) {
    console.error("SQL ERROR in generateReport Controller:", err);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error while generating report." 
    });
  }
};