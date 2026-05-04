const InstituteModel = require('../model/instituteModel');
const bcrypt         = require('bcrypt');
const db             = require('../../config/db');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');

// ─── Multer Setup ─────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/institutes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

exports.upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed'));
    }
  },
});

// ─── GET ALL ──────────────────────────────────────────────────────────────────

exports.getAllInstitutes = async (req, res) => {
  try {
    const institutes = await InstituteModel.getAll();
    res.status(200).json({ success: true, count: institutes.length, data: institutes });
  } catch (err) {
    console.error('[InstituteController] getAllInstitutes:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

exports.getInstituteById = async (req, res) => {
  try {
    const institute = await InstituteModel.findById(req.params.id);
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });
    res.status(200).json({ success: true, data: institute });
  } catch (err) {
    console.error('[InstituteController] getInstituteById:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADD INSTITUTE ────────────────────────────────────────────────────────────
// Accepts multipart/form-data with JSON fields + file uploads

exports.addInstitute = async (req, res) => {
  try {
    // Parse JSON strings sent via FormData
    let organisation = req.body.organisation;
    let directors    = req.body.directors;
    let legal        = req.body.legal;
    let branches     = req.body.branches;

    if (typeof organisation === 'string') organisation = JSON.parse(organisation);
    if (typeof directors    === 'string') directors    = JSON.parse(directors);
    if (typeof legal        === 'string') legal        = JSON.parse(legal);
    if (typeof branches     === 'string') branches     = JSON.parse(branches);

    if (!organisation || !organisation.name || !organisation.email) {
      return res.status(400).json({ success: false, message: 'Organisation name and email are required' });
    }

    if (await InstituteModel.emailExists(organisation.email)) {
      return res.status(409).json({ success: false, message: 'Institute with this email already exists' });
    }

    // ── Map uploaded files into legal and directors objects ──────────────────
    // Each file field name tells us where to store the path.
    // Convention:
    //   legal_panNoDoc          → legal.panNoDoc
    //   director_0_panDoc       → directors[0].documents.panDoc
    //   director_0_aadhaarDoc   → directors[0].documents.aadhaarDoc

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const savedPath = `/uploads/institutes/${file.filename}`;
        const fieldname = file.fieldname;

        if (fieldname.startsWith('legal_')) {
          // e.g. "legal_panNoDoc" → legal.panNoDoc
          const key = fieldname.replace('legal_', '');
          legal[key] = savedPath;

        } else if (fieldname.startsWith('director_')) {
          // e.g. "director_0_panDoc" → directors[0].documents.panDoc
          const parts = fieldname.split('_'); // ['director', '0', 'panDoc']
          const idx   = parseInt(parts[1], 10);
          const key   = parts[2]; // 'panDoc' or 'aadhaarDoc'
          if (directors[idx] && directors[idx].documents) {
            directors[idx].documents[key] = savedPath;
          }
        }
      });
    }

    const instituteCode = organisation.name.substring(0, 3).toUpperCase() + (organisation.pin || '000');
    const salt          = await bcrypt.genSalt(10);
    const passwordHash  = await bcrypt.hash('password123', salt);

    const id = await InstituteModel.create({
      organisation,
      directors:      directors || [],
      legal:          legal     || {},
      branches:       branches  || [],
      institute_code: instituteCode,
      admin_email:    organisation.email,
      password_hash:  passwordHash,
    });

    const doc = await InstituteModel.findById(id);
    res.status(201).json({ success: true, message: 'Institute added successfully', data: doc });

  } catch (err) {
    console.error('[InstituteController] addInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// ─── UPDATE INSTITUTE ─────────────────────────────────────────────────────────

exports.updateInstitute = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await InstituteModel.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Institute not found' });

    let { organisation, directors, legal, branches } = req.body;
    if (typeof organisation === 'string') organisation = JSON.parse(organisation);
    if (typeof directors    === 'string') directors    = JSON.parse(directors);
    if (typeof legal        === 'string') legal        = JSON.parse(legal);
    if (typeof branches     === 'string') branches     = JSON.parse(branches);

    // Map uploaded files if any
    // Replace this block in addInstitute AND updateInstitute:
if (req.files && req.files.length > 0) {
  req.files.forEach(file => {
    const savedPath = `/uploads/institutes/${file.filename}`;
    const fieldname = file.fieldname;

    if (fieldname.startsWith('legal_')) {
      // e.g. "legal_panDoc" → key = "panDoc"
      const key = fieldname.slice(6); // removes "legal_" prefix exactly
      legal[key] = savedPath;

    } else if (fieldname.startsWith('director_')) {
      // e.g. "director_0_panDoc" or "director_0_aadhaarDoc"
      // Split only on first two underscores, rest is the key
      const firstUnderscore  = fieldname.indexOf('_');
      const secondUnderscore = fieldname.indexOf('_', firstUnderscore + 1);
      const idx = parseInt(fieldname.slice(firstUnderscore + 1, secondUnderscore), 10);
      const key = fieldname.slice(secondUnderscore + 1); // everything after "director_N_"
      if (directors[idx] && directors[idx].documents) {
        directors[idx].documents[key] = savedPath;
      }
    }
  });
}

    await InstituteModel.update(id, { organisation, directors, legal, branches });
    const updated = await InstituteModel.findById(id);
    res.status(200).json({ success: true, message: 'Institute updated successfully', data: updated });

  } catch (err) {
    console.error('[InstituteController] updateInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ success: false, message: 'is_active is required' });
    if (!await InstituteModel.findById(id)) return res.status(404).json({ success: false, message: 'Institute not found' });
    await InstituteModel.toggleStatus(id, is_active);
    res.status(200).json({ success: true, message: `Institute ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error('[InstituteController] toggleStatus:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

exports.deleteInstitute = async (req, res) => {
  try {
    if (!await InstituteModel.findById(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }
    await InstituteModel.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Institute deleted successfully' });
  } catch (err) {
    console.error('[InstituteController] deleteInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── FULL DETAILS (InstituteAdmin view) ──────────────────────────────────────

exports.getFullInstituteDetails = async (req, res) => {
  const identifier = req.params.id;

  try {
    const base = await InstituteModel.findById(identifier);
    if (!base) return res.status(404).json({ success: false, message: 'Institute not found' });

    const instId = base.id;

    const [[studentRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM students WHERE institute_id = ?`, [instId]
    ).catch(() => [[{ total: 0 }]]);

    const [[facultyRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM faculty WHERE institute_id = ?`, [instId]
    ).catch(() => [[{ total: 0 }]]);

    const [[batchRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM classes WHERE institute_id = ?`, [instId]
    ).catch(() => [[{ total: 0 }]]);

    res.json({
      success: true,
      data: {
        id:             base.id,
        institute_code: base.institute_code,
        admin_email:    base.admin_email,
        status:         base.status   || 'Active',
        plan:           base.plan     || 'Premium',
        created_at:     base.created_at,

        // All JSON blobs — already parsed objects/arrays from the model
        organisation: base.organisation || {},
        directors:    Array.isArray(base.directors) ? base.directors : [],
        legal:        base.legal        || {},
        branches:     Array.isArray(base.branches)  ? base.branches  : [],

        totalStudents: studentRow?.total || 0,
        totalFaculty:  facultyRow?.total || 0,
        totalBatches:  batchRow?.total   || 0,
      },
    });

  } catch (err) {
    console.error('[InstituteController] getFullInstituteDetails:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load institute details.' });
  }
};