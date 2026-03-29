const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

// POST /api/auth/login
// Accepts: { mobile, password }  OR  { email, password } (backwards compat)
router.post('/login', async (req, res) => {
  const { mobile, email, password } = req.body;
  const identifier = mobile || email;

  if (!identifier || !password)
    return res.status(400).json({ success: false, message: 'Mobile/email and password are required' });

  // Find by mobile first, fall back to email
  const user = await User.findOne({
    $or: [{ mobile: identifier }, { email: identifier }],
    isActive: true,
  }).select('+password');

  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(user._id);
  res.json({ success: true, token, user });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/register
// Accepts: { name, email, mobile, password, role?, counter? }
router.post('/register', protect, async (req, res) => {
  const { name, email, mobile, password, role, counter } = req.body;

  if (!name || !email || !mobile || !password)
    return res.status(400).json({ success: false, message: 'Name, email, mobile and password are required' });

  const existing = await User.findOne({ $or: [{ email }, { mobile }] });
  if (existing)
    return res.status(409).json({ success: false, message: 'Email or mobile already registered' });

  const user = await User.create({ name, email, mobile, password, role, counter });
  const token = signToken(user._id);
  res.status(201).json({ success: true, token, user });
});

module.exports = router;