const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');

// 🚀 FIX: Import 'verifyToken' exactly as it is named in your middleware file
const { verifyToken } = require('../middlewares/authMiddleware');

// Secure all routes so only logged-in Institute Admins can use them
router.use(verifyToken);

// Endpoint to fetch documents for the table
router.get('/', certificateController.getDocuments);

// Endpoint to trigger the Puppeteer PDF generation
router.post('/generate', certificateController.generateMarksheet);

// Endpoint to publish multiple drafts at once
router.put('/publish', certificateController.publishDocuments);

// Endpoint to delete a specific draft
router.delete('/:id', certificateController.deleteDocument);

module.exports = router;