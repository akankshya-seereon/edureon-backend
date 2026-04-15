const db = require('../../config/db');

exports.getProfile = async (req, res) => {
  try {
    // 1. Get student ID from the verified token (attached by middleware)
    const studentId = req.user.id;

    // 2. Fetch all student details
    const [rows] = await db.query(
      `SELECT 
        first_name, 
        last_name, 
        email, 
        phone, 
        dob, 
        gender, 
        aadhar, 
        pan, 
        student_code as rollNo, 
        type, 
        course, 
        standard_name as standard, 
        section, 
        academic_year as year,
        address, 
        documents, 
        status
      FROM students 
      WHERE id = ?`, 
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }

    const profile = rows[0];

    // 3. Helper to parse JSON fields safely
    const parseJSON = (field) => {
      if (!field) return {};
      if (typeof field === 'object') return field;
      try { return JSON.parse(field); } catch (e) { return {}; }
    };

    // 4. Format the response
    const formattedData = {
      ...profile,
      address: parseJSON(profile.address),
      documents: parseJSON(profile.documents)
    };

    res.status(200).json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error("Profile Controller Error:", error);
    res.status(500).json({ success: false, message: "Internal server error fetching profile." });
  }
};