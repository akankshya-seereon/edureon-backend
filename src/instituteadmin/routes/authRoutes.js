// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');

// router.post('/login', authController.instituteLogin);

// // CRITICAL: Make sure this line exists!
// module.exports = router;


const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.instituteLogin);

module.exports = router;