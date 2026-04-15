const SalaryModel = require('../models/salaryModel');

exports.getSalaryRecords = async (req, res) => {
  try {
    const records = await SalaryModel.getAll(req.user.code);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching records" });
  }
};

exports.paySalary = async (req, res) => {
  try {
    const data = { ...req.body, institute_code: req.user.code };
    await SalaryModel.create(data);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Payment failed" });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    await SalaryModel.delete(req.params.id, req.user.code);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};