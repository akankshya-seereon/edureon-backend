const ExpenseModel = require('../models/expenseModel');

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await ExpenseModel.getAll(req.user.code);
    res.json({ success: true, expenses });
  } catch (err) {
    console.error(" SQL ERROR:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const data = { ...req.body, institute_code: req.user.code };
    const id = await ExpenseModel.create(data);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add expense" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await ExpenseModel.delete(req.params.id, req.user.code);
    res.json({ success: true, message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};