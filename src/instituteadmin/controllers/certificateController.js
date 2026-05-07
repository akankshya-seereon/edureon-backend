const CertificateModel = require('../models/certificateModel');
const pdfService = require('../../utils/pdfService');
const fs = require('fs');
const path = require('path');

// 1. Generate a new Marksheet (Saved as Draft)
exports.generateMarksheet = async (req, res) => {
  try {
    const { studentId, courseId, batch, semester, studentName, instituteName, courseName, marks } = req.body;
    const instituteId = req.user.id || req.user.institute_id; // Added fallback just in case

    // --- 🚀 DIRECTORY GUARD ---
    const uploadDir = path.join(__dirname, '../../../../uploads/certificates'); // Adjusted path to sit in root/uploads
    if (!fs.existsSync(uploadDir)) {
      console.log('📂 Creating missing directory:', uploadDir);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Check for duplicates in DB
    const exists = await CertificateModel.checkExists(studentId, semester);
    if (exists) {
      return res.status(400).json({ success: false, message: 'Marksheet already generated for this semester.' });
    }

    // Generate the physical PDF via the utility service
    const fileUrl = await pdfService.generateMarksheetPDF({
      studentId, studentName, instituteName, courseName, batch, semester, marks
    });

    // Save record to DB
    const documentId = await CertificateModel.create({
      instituteId, studentId, courseId, batch, semester, documentType: 'Marksheet', fileUrl
    });

    res.status(201).json({ 
      success: true, 
      message: 'Marksheet generated successfully as Draft.', 
      documentId, 
      fileUrl 
    });

  } catch (error) {
    console.error('[CertificateController] Generate Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate marksheet' });
  }
};

// 2. Fetch all documents for the Admin UI Table
exports.getDocuments = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.institute_id;
    const { courseId, batch, semester, status } = req.query;

    const documents = await CertificateModel.getAllByInstitute(instituteId, { courseId, batch, semester, status });
    
    res.status(200).json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    console.error('[CertificateController] Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

// 3. Publish Documents (Make them visible to students)
exports.publishDocuments = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.institute_id;
    const { documentIds } = req.body; 

    if (!documentIds || !documentIds.length) {
      return res.status(400).json({ success: false, message: 'No documents selected for publishing.' });
    }

    const updatedCount = await CertificateModel.publish(documentIds, instituteId);

    res.status(200).json({ success: true, message: `Successfully published ${updatedCount} documents.` });
  } catch (error) {
    console.error('[CertificateController] Publish Error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish documents' });
  }
};

// 4. Delete a Draft Document
exports.deleteDocument = async (req, res) => {
  try {
    const instituteId = req.user.id || req.user.institute_id;
    const { id } = req.params;

    const deletedCount = await CertificateModel.delete(id, instituteId);
    
    if (deletedCount === 0) {
      return res.status(400).json({ success: false, message: 'Document not found or already published.' });
    }

    res.status(200).json({ success: true, message: 'Draft document deleted successfully.' });
  } catch (error) {
    console.error('[CertificateController] Delete Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};