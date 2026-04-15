const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');

// Add a subject to a semester
router.post('/subject', syllabusController.addSubject);

// Get all subjects for a specific filter
router.get('/list', syllabusController.getSyllabus);

// Remove a subject
router.delete('/subject/:id', syllabusController.removeSubject);

module.exports = router;