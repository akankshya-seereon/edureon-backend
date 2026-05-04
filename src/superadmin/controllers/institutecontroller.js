const InstituteModel = require('../model/instituteModel');
const bcrypt         = require('bcrypt');
const db             = require('../../config/db');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');

// ─── HELPER: Smart ID Resolver ────────────────────────────────────────────────
// Fixes the MySQL "Truncated incorrect DOUBLE" error globally.
// This allows frontend to pass EITHER a numeric ID (4) OR a code (LIT751030)
const resolveInstitute = async (identifier) => {
  const isNumeric = !isNaN(identifier) && !isNaN(parseFloat(identifier));
  const query = isNumeric 
    ? 'SELECT * FROM institutes WHERE id = ?' 
    : 'SELECT * FROM institutes WHERE institute_code = ?';
    
  const [rows] = await db.query(query, [identifier]);
  return rows[0]; // Returns the full row or undefined
};

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
    // 🚀 Uses smart resolver
    const institute = await resolveInstitute(req.params.id);
    if (!institute) return res.status(404).json({ success: false, message: 'Institute not found' });
    
    res.status(200).json({ success: true, data: institute });
  } catch (err) {
    console.error('[InstituteController] getInstituteById:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── ADD INSTITUTE ────────────────────────────────────────────────────────────

// ─── ADD INSTITUTE ────────────────────────────────────────────────────────────

exports.addInstitute = async (req, res) => {
  try {
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

    // 🚀 1. Check if frontend sent the password
    if (!organisation.password) {
      return res.status(400).json({ success: false, message: 'Admin password is required' });
    }

    if (await InstituteModel.emailExists(organisation.email)) {
      return res.status(409).json({ success: false, message: 'Institute with this email already exists' });
    }

    // ── Map uploaded files (Synchronized Logic) ──
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const savedPath = `/uploads/institutes/${file.filename}`;
        const fieldname = file.fieldname;

        if (fieldname.startsWith('legal_')) {
          const key = fieldname.slice(6); // removes "legal_" prefix
          legal[key] = savedPath;
        } else if (fieldname.startsWith('director_')) {
          const firstUnderscore  = fieldname.indexOf('_');
          const secondUnderscore = fieldname.indexOf('_', firstUnderscore + 1);
          const idx = parseInt(fieldname.slice(firstUnderscore + 1, secondUnderscore), 10);
          const key = fieldname.slice(secondUnderscore + 1);
          
          if (directors[idx] && directors[idx].documents) {
            directors[idx].documents[key] = savedPath;
          }
        }
      });
    }

    const instituteCode = organisation.name.substring(0, 3).toUpperCase() + (organisation.pin || '000');
    
    // 🚀 2. Hash the manual password from the frontend
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(organisation.password, salt);

    // 🔒 3. SECURITY: Delete the plaintext password from the JSON object
    // so it doesn't get saved in the database's `organisation` text column!
    delete organisation.password;

    const id = await InstituteModel.create({
      organisation,
      directors:      directors || [],
      legal:          legal     || {},
      branches:       branches  || [],
      institute_code: instituteCode,
      admin_email:    organisation.email,
      password_hash:  passwordHash, // Uses the newly hashed manual password
    });

    const doc = await resolveInstitute(id);
    res.status(201).json({ success: true, message: 'Institute added successfully', data: doc });

  } catch (err) {
    console.error('[InstituteController] addInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// ─── UPDATE INSTITUTE ─────────────────────────────────────────────────────────

exports.updateInstitute = async (req, res) => {
  try {
    // 🚀 Uses smart resolver to find the true numeric ID safely
    const existing = await resolveInstitute(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Institute not found' });
    
    const numericId = existing.id; // Extract safe integer ID

    let { organisation, directors, legal, branches } = req.body;
    if (typeof organisation === 'string') organisation = JSON.parse(organisation);
    if (typeof directors    === 'string') directors    = JSON.parse(directors);
    if (typeof legal        === 'string') legal        = JSON.parse(legal);
    if (typeof branches     === 'string') branches     = JSON.parse(branches);

    // ── Map uploaded files (Synchronized Logic) ──
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const savedPath = `/uploads/institutes/${file.filename}`;
        const fieldname = file.fieldname;

        if (fieldname.startsWith('legal_')) {
          const key = fieldname.slice(6);
          legal[key] = savedPath;
        } else if (fieldname.startsWith('director_')) {
          const firstUnderscore  = fieldname.indexOf('_');
          const secondUnderscore = fieldname.indexOf('_', firstUnderscore + 1);
          const idx = parseInt(fieldname.slice(firstUnderscore + 1, secondUnderscore), 10);
          const key = fieldname.slice(secondUnderscore + 1);
          
          if (directors[idx] && directors[idx].documents) {
            directors[idx].documents[key] = savedPath;
          }
        }
      });
    }

    await InstituteModel.update(numericId, { organisation, directors, legal, branches });
    const updated = await resolveInstitute(numericId);
    res.status(200).json({ success: true, message: 'Institute updated successfully', data: updated });

  } catch (err) {
    console.error('[InstituteController] updateInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────

exports.toggleStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ success: false, message: 'is_active is required' });
    
    // 🚀 Uses smart resolver
    const existing = await resolveInstitute(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Institute not found' });
    
    await InstituteModel.toggleStatus(existing.id, is_active);
    res.status(200).json({ success: true, message: `Institute ${is_active ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error('[InstituteController] toggleStatus:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────

exports.deleteInstitute = async (req, res) => {
  try {
    // 🚀 Uses smart resolver so MySQL never crashes on string codes
    const existing = await resolveInstitute(req.params.id);
    
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Institute not found' });
    }
    
    // Always delete using the safe numeric ID
    await InstituteModel.delete(existing.id);
    res.status(200).json({ success: true, message: 'Institute deleted successfully' });
  } catch (err) {
    console.error('[InstituteController] deleteInstitute:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── FULL DETAILS (InstituteAdmin view) ──────────────────────────────────────

exports.getFullInstituteDetails = async (req, res) => {
  try {
    // 🚀 Uses smart resolver
    const base = await resolveInstitute(req.params.id);
    if (!base) return res.status(404).json({ success: false, message: 'Institute not found' });

    const instId = base.id; // Safely extracted ID for subqueries

    const [[studentRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM students WHERE institute_id = ?`, [instId]
    ).catch(() => [[{ total: 0 }]]);

    const [[facultyRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM faculty WHERE institute_id = ?`, [instId]
    ).catch(() => [[{ total: 0 }]]);

    const [[batchRow]] = await db.query(
      `SELECT COUNT(*) AS total FROM classes WHERE institute_id = ?`, [instId]
    ).catch(() => [[{ total: 0 }]]);

    // Format the JSON data back out safely
    res.json({
      success: true,
      data: {
        id:             base.id,
        institute_code: base.institute_code,
        admin_email:    base.admin_email,
        status:         base.status   || 'Active',
        plan:           base.plan     || 'Premium',
        created_at:     base.created_at,

        organisation: typeof base.organisation === 'string' ? JSON.parse(base.organisation) : base.organisation || {},
        directors:    typeof base.directors === 'string' ? JSON.parse(base.directors) : base.directors || [],
        legal:        typeof base.legal === 'string' ? JSON.parse(base.legal) : base.legal || {},
        branches:     typeof base.branches === 'string' ? JSON.parse(base.branches) : base.branches || [],

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