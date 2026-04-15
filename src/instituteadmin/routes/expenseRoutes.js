const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, expenseController.getExpenses);
router.post('/', verifyToken, expenseController.addExpense);
router.delete('/:id', verifyToken, expenseController.deleteExpense);

module.exports = router;