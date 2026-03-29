const router = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products - list with filters
router.get('/', protect, async (req, res) => {
  const { search, category, page = 1, limit = 50 } = req.query;
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }
  if (category && category !== 'all') query.category = category;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name icon color')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, page: Number(page), products });
});

// GET /api/products/barcode/:barcode
router.get('/barcode/:barcode', protect, async (req, res) => {
  const product = await Product.findOne({ barcode: req.params.barcode, isActive: true }).populate('category', 'name icon');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name icon color');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// POST /api/products
router.post('/', protect, adminOnly, async (req, res) => {
  const product = await Product.create(req.body);
  await product.populate('category', 'name icon color');
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  }).populate('category', 'name icon color');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
});

module.exports = router;
