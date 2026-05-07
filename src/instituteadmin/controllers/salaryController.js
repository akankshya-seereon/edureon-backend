const SalaryModel = require('../models/salaryModel');

exports.getSalaryRecords = async (req, res) => {
  try {
    // 🚀 REVERTED: Using req.user.code (e.g., 'SAM751030')
    const records = await SalaryModel.getAll(req.user.code);
    res.json({ success: true, records });
  } catch (err) {
    console.error("Get Salary Error:", err);
    res.status(500).json({ success: false, message: "Error fetching records" });
  }
};

exports.paySalary = async (req, res) => {
  try {
    // 🚀 STILL SAFE: Strictly destructuring the frontend payload
    const { 
      faculty_id, faculty_name, designation, department, 
      month, amount, method, online_provider, txn_id, note, payment_date 
    } = req.body;

    const safeData = {
      institute_code: req.user.code, // 🚀 REVERTED: Saving as institute_code
      faculty_id,
      faculty_name,
      designation,
      department,
      month,
      amount,
      method,
      online_provider,
      txn_id,
      note,
      payment_date
    };

    await SalaryModel.create(safeData);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Pay Salary Error:", err);
    res.status(500).json({ success: false, message: "Payment failed" });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    // 🚀 REVERTED: Using req.user.code
    await SalaryModel.delete(req.params.id, req.user.code);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Salary Error:", err);
    res.status(500).json({ success: false });
  }
};