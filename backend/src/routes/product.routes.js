const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/products - list with filters
router.get('/', protect, async (req, res) => {
  const { search, category, supplier, page = 1, limit = 50 } = req.query;
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }
  if (category && category !== 'all') query.category = category;
  if (supplier && supplier !== 'all') query.supplier = supplier;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name icon color')
    .populate('supplier', 'name code')
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({ success: true, total, page: Number(page), products });
});

// GET /api/products/barcode/:barcode
router.get('/barcode/:barcode', protect, async (req, res) => {
  const product = await Product.findOne({ barcode: req.params.barcode, isActive: true })
    .populate('category', 'name icon')
    .populate('supplier', 'name code');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name icon color')
    .populate('supplier', 'name code');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// POST /api/products
router.post('/', protect, adminOnly, async (req, res) => {
  if (req.body.supplier) {
    const exists = await Supplier.findById(req.body.supplier);
    if (!exists) return res.status(400).json({ success: false, message: 'Invalid supplier' });
  }

  const product = await Product.create(req.body);
  await product.populate('category', 'name icon color');
  await product.populate('supplier', 'name code');
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  if (req.body.supplier) {
    const exists = await Supplier.findById(req.body.supplier);
    if (!exists) return res.status(400).json({ success: false, message: 'Invalid supplier' });
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  })
    .populate('category', 'name icon color')
    .populate('supplier', 'name code');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// POST /api/products/bulk-import
// Accepts JSON rows to support CSV/Excel upload from frontend:
// [{ barcode, name, brand, categoryId|categoryName, supplierId, purchasePrice, mrp, sellingPrice, unit, gstPercent, stock, lowStockThreshold, hsnCode }]
router.post('/bulk-import', protect, adminOnly, async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  const defaultSupplierId = req.body.defaultSupplierId;

  if (!rows.length) {
    return res.status(400).json({ success: false, message: 'rows array is required' });
  }

  let defaultSupplier = null;
  if (defaultSupplierId) {
    defaultSupplier = await Supplier.findById(defaultSupplierId);
    if (!defaultSupplier) return res.status(400).json({ success: false, message: 'Invalid default supplier' });
  }

  const errors = [];
  let created = 0;
  let updated = 0;

  for (let idx = 0; idx < rows.length; idx += 1) {
    const row = rows[idx];
    const barcode = String(row.barcode || '').trim();
    const name = String(row.name || '').trim();

    if (!barcode || !name) {
      errors.push({ row: idx + 1, message: 'barcode and name are required' });
      continue;
    }

    let category = null;
    if (row.categoryId) {
      category = await Category.findById(row.categoryId);
    }
    if (!category && row.categoryName) {
      category = await Category.findOne({ name: new RegExp(`^${String(row.categoryName).trim()}$`, 'i') });
      if (!category) category = await Category.create({ name: String(row.categoryName).trim() });
    }
    if (!category) {
      errors.push({ row: idx + 1, message: 'categoryId or categoryName is required' });
      continue;
    }

    let supplier = defaultSupplier;
    if (row.supplierId) {
      supplier = await Supplier.findById(row.supplierId);
      if (!supplier) {
        errors.push({ row: idx + 1, message: 'Invalid supplierId' });
        continue;
      }
    }

    const payload = {
      barcode,
      name,
      brand: String(row.brand || '').trim(),
      category: category._id,
      supplier: supplier?._id,
      purchasePrice: Number(row.purchasePrice || 0),
      mrp: Number(row.mrp || 0),
      sellingPrice: Number(row.sellingPrice || 0),
      unit: row.unit || 'pcs',
      gstPercent: Number(row.gstPercent ?? 5),
      stock: Number(row.stock || 0),
      lowStockThreshold: Number(row.lowStockThreshold || 10),
      hsnCode: String(row.hsnCode || '').trim(),
      isActive: true,
    };

    if (Number.isNaN(payload.mrp) || Number.isNaN(payload.sellingPrice)) {
      errors.push({ row: idx + 1, message: 'Invalid numeric values' });
      continue;
    }

    const existing = await Product.findOne({ barcode });
    if (!existing) {
      await Product.create(payload);
      created += 1;
    } else {
      await Product.findByIdAndUpdate(existing._id, payload, { runValidators: true });
      updated += 1;
    }
  }

  res.json({
    success: true,
    summary: {
      totalRows: rows.length,
      created,
      updated,
      failed: errors.length,
    },
    errors,
  });
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
});

module.exports = router;
