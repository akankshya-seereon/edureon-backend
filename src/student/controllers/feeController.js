// src/student/controllers/feeController.js
const db = require('../../config/db');

exports.getStudentFees = async (req, res) => {
  try {
    const studentId = req.user.id;

    //  UPDATED: Added fee_title to the query
    const [fees] = await db.query(`
      SELECT 
        id, 
        fee_title, 
        total_amount, 
        paid_amount, 
        DATE_FORMAT(due_date, '%b %d, %Y') as dueDate,
        due_date as raw_due_date,
        status 
      FROM fees 
      WHERE student_id = ?
      ORDER BY raw_due_date ASC
    `, [studentId]);

    res.status(200).json({ success: true, fees });
  } catch (error) {
    console.error(" Error fetching student fees:", error);
    res.status(500).json({ success: false, message: "Failed to load fees" });
  }
};

exports.payFee = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { feeId, amountToPay } = req.body;

    // 1. Fetch current fee to make sure they aren't overpaying
    const [feeRows] = await db.query('SELECT total_amount, paid_amount FROM fees WHERE id = ? AND student_id = ?', [feeId, studentId]);
    
    if (feeRows.length === 0) {
      return res.status(404).json({ success: false, message: "Fee record not found." });
    }

    const fee = feeRows[0];
    const newPaidAmount = parseFloat(fee.paid_amount) + parseFloat(amountToPay);
    
    // 2. Determine new status (Paid vs Partial)
    let newStatus = 'Unpaid';
    if (newPaidAmount >= parseFloat(fee.total_amount)) {
      newStatus = 'Paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'Partial';
    }

    // 3. Update the database
    await db.query('UPDATE fees SET paid_amount = ?, status = ? WHERE id = ?', [newPaidAmount, newStatus, feeId]);

    res.status(200).json({ 
      success: true, 
      message: "Payment processed successfully!",
      newStatus,
      newPaidAmount
    });

  } catch (error) {
    console.error(" Error processing payment:", error);
    res.status(500).json({ success: false, message: "Payment failed to process." });
  }
};