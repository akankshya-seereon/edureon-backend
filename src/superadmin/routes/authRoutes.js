const express = require('express');
const router  = express.Router();

const { login, logout, refreshToken, getMe } = require('../controllers/authcontroller');
const protect = require('../middlewares/authMiddlewares');

router.post('/login',   login);
router.post('/refresh', refreshToken);
router.post('/logout',  protect, logout);
router.get('/me',       protect, getMe);

module.exports = router;