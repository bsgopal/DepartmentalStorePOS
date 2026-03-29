const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// All staff routes require auth + admin/manager
router.use(protect, adminOnly);

// GET /api/staff  — list all staff
router.get('/', async (req, res) => {
  try {
    const { search, role, isActive } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const staff = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, staff, total: staff.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/staff  — create staff member
router.post('/', async (req, res) => {
  try {
    const { name, mobile, email, password, role, counter } = req.body;

    if (!name || !mobile || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, mobile, email, password and role are required' });
    }

    const exists = await User.findOne({ $or: [{ email }, { mobile }] });
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Mobile number';
      return res.status(409).json({ success: false, message: `${field} already registered` });
    }

    const user = await User.create({ name, mobile, email, password, role, counter: counter || '1' });
    res.status(201).json({ success: true, staff: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/staff/:id  — update staff member
router.put('/:id', async (req, res) => {
  try {
    const { name, mobile, email, role, counter, isActive } = req.body;
    const updates = { name, mobile, email, role, counter, isActive };

    // Don't allow empty password through PUT — use PATCH for password change
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });

    res.json({ success: true, staff: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/staff/:id/password  — change password
router.patch('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/staff/:id/toggle  — activate / deactivate
router.patch('/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, staff: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, message: 'Staff member deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;