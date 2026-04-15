const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { verifyStudent } = require('../middlewares/authMiddleware');

router.get('/enrolled', verifyStudent, courseController.getMyCourses);

module.exports = router;