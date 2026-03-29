const router = require('express').Router();
const Category = require('../models/Category');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, categories });
});

router.post('/', protect, adminOnly, async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, category });
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = router;
