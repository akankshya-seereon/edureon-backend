const jwt        = require('jsonwebtoken');
const AdminModel = require('../model/adminModel');


const signToken = (id, secret, expiresIn) =>
  jwt.sign({ id, role: 'superadmin' }, secret, { expiresIn });

const sendTokenResponse = (admin, statusCode, res) => {
  const accessToken = signToken(admin.id, process.env.JWT_SECRET, '15m');

  const refreshToken = signToken(admin.id, process.env.JWT_REFRESH_SECRET, '7d');

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    admin: {
      id:        admin.id,
      name:      admin.name,
      email:     admin.email,
      role:      admin.role,
      lastLogin: admin.last_login,
    },
  });
};

// ── POST /api/superadmin/auth/login ──────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const admin = await AdminModel.findByEmail(email, true);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Contact the system owner.',
      });
    }

    if (AdminModel.isLocked(admin)) {
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${AdminModel.lockMinutesLeft(admin)} minute(s).`,
      });
    }

    const isMatch = await AdminModel.matchPassword(password, admin.password);
    if (!isMatch) {
      const { newAttempts, locked } = await AdminModel.incrementLoginAttempts(
        admin.id,
        admin.login_attempts
      );
      return res.status(401).json({
        success: false,
        message: locked
          ? 'Too many failed attempts. Account locked for 30 minutes.'
          : 'Invalid credentials',
        attemptsLeft: locked ? 0 : Math.max(0, 5 - newAttempts),
      });
    }

    await AdminModel.resetLoginAttempts(admin.id);
    sendTokenResponse(admin, 200, res);

  } catch (err) {
    console.error('[AuthController] login:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const admin   = await AdminModel.findById(decoded.id);

    if (!admin || !admin.is_active) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const accessToken = signToken(admin.id, process.env.JWT_SECRET, '15m');
    res.status(200).json({ success: true, accessToken });

  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// ── POST /api/superadmin/auth/logout ─────────────────────────
exports.logout = (req, res) => {
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ── GET /api/superadmin/auth/me ──────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.status(200).json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};