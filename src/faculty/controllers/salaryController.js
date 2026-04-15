const db = require('../../config/db');

exports.getSalaryData = async (req, res) => {
    try {
        // This ID comes from the decoded JWT cookie (verifyFaculty middleware)
        // It ensures the faculty only sees THEIR OWN data.
        const facultyId = req.user.id; 

        if (!facultyId) {
            return res.status(401).json({ success: false, message: "User not identified" });
        }

        // 1. Fetch Salary History for this specific faculty
        const [history] = await db.execute(
            `SELECT * FROM faculty_salaries WHERE faculty_id = ? ORDER BY id DESC`,
            [facultyId]
        );

        // 2. Fetch Faculty Profile Info (Bank details, etc.)
        const [profile] = await db.execute(
            `SELECT name, employee_id, department, designation, bank_account, ifsc, joining_date 
             FROM faculty WHERE id = ?`,
            [facultyId]
        );

        // If for some reason the profile is missing in the faculty table
        if (profile.length === 0) {
            return res.status(404).json({ success: false, message: "Faculty profile record not found" });
        }

        // 3. Calculate Summary Stats
        // We use Number() to prevent math errors if the DB returns strings
        const paidSalaries = history.filter(s => s.status === 'Paid');
        const pendingSalaries = history.filter(s => s.status === 'Pending');
        const upcomingSalaries = history.filter(s => s.status === 'Upcoming');

        const summary = {
            totalEarned: paidSalaries.reduce((acc, s) => acc + Number(s.net || 0), 0),
            pendingAmount: pendingSalaries.reduce((acc, s) => acc + Number(s.gross || 0), 0),
            upcomingAmount: upcomingSalaries.length > 0 ? Number(upcomingSalaries[0].gross || 0) : 0,
            lastPaidDate: paidSalaries.length > 0 ? paidSalaries[0].paid_on : "N/A"
        };

        // 4. Send Clean Response
        // The keys 'faculty', 'history', and 'summary' must match your Frontend state setters
        res.json({
            success: true,
            faculty: profile[0],
            history: history,
            summary: summary
        });

    } catch (err) {
        console.error("Salary Fetch Error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error while fetching salary data",
            error: err.message 
        });
    }
};