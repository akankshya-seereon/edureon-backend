const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { verifyToken } = require('../middlewares/authMiddleware');

// GET request to fetch the list
router.get('/', verifyToken, facultyController.getAllFaculty);

// POST request to add a new faculty member
router.post('/', verifyToken, facultyController.addFaculty);

// PUT request to update an existing faculty member
router.put('/:id', verifyToken, facultyController.updateFaculty);

// DELETE request to remove a faculty member
router.delete('/:id', verifyToken, facultyController.deleteFaculty);

module.exports = router;