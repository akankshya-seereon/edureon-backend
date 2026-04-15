const express = require('express');
const router = express.Router(); //  Must initialize the router
const salaryController = require('../controllers/salaryController');
const { verifyFaculty } = require('../Middlewares/authMiddleware');

//  This defines the endpoint
// If you mount this in facultyRoutes.js as router.use('/salary', salaryRoutes),
// then the path here should just be '/' to avoid having /salary/salary
router.get('/', verifyFaculty, salaryController.getSalaryData);

module.exports = router; //  Must export to use elsewhere