const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, salaryController.getSalaryRecords);
router.post('/', verifyToken, salaryController.paySalary);
router.delete('/:id', verifyToken, salaryController.deleteRecord);

module.exports = router;