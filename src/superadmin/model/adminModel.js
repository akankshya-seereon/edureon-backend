const bcrypt = require('bcryptjs');
const db = require('../../config/db');

const MAX_ATTEMPTS  = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes in ms

const AdminModel = {

  // ── Find admin by email ─────────────────────────────────────
  async findByEmail(email, includePassword = false) {
    const fields = includePassword
      ? 'id, name, email, password, role, is_active, login_attempts, lock_until, last_login'
      : 'id, name, email, role, is_active, login_attempts, lock_until, last_login';

    const [rows] = await db.query(
      `SELECT ${fields} FROM superadmins WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  // ── Find admin by ID ────────────────────────────────────────
  async findById(id) {
    const [rows] = await db.query(
      `SELECT id, name, email, role, is_active, last_login, created_at
       FROM superadmins WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // ── Compare plain password against stored hash ──────────────
  async matchPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // ── Check if account is currently locked ────────────────────
  isLocked(admin) {
    return admin.lock_until && new Date(admin.lock_until) > new Date();
  },

  // ── Minutes remaining on lock ───────────────────────────────
  lockMinutesLeft(admin) {
    return Math.ceil((new Date(admin.lock_until) - Date.now()) / 60000);
  },

  // ── Increment failed attempts; lock if threshold reached ────
  async incrementLoginAttempts(id, currentAttempts) {
    const newAttempts = currentAttempts + 1;
    const lockUntil   = newAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCK_DURATION)
      : null;

    await db.query(
      `UPDATE superadmins SET login_attempts = ?, lock_until = ? WHERE id = ?`,
      [newAttempts, lockUntil, id]
    );

    return { newAttempts, locked: !!lockUntil };
  },

  // ── Reset attempts and record last login ────────────────────
  async resetLoginAttempts(id) {
    await db.query(
      `UPDATE superadmins
       SET login_attempts = 0, lock_until = NULL, last_login = NOW()
       WHERE id = ?`,
      [id]
    );
  },

  // ── Create a new superadmin ─────────────────────────────────
  async create({ name, email, password }) {
    const salt   = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO superadmins (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashed]
    );
    return result.insertId;
  },

};

module.exports = AdminModel;