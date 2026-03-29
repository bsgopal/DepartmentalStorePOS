const router = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/stock/low-stock — products below threshold
router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .populate('category', 'name color')
      .sort({ stock: 1 });
    res.json({ success: true, products, total: products.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stock/summary — overall stock summary
router.get('/summary', async (req, res) => {
  try {
    const [totalProducts, lowStock, outOfStock, totalStockValue] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Product.countDocuments({ isActive: true, stock: 0 }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, value: { $sum: { $multiply: ['$stock', '$sellingPrice'] } } } },
      ]),
    ]);
    res.json({
      success: true,
      summary: {
        totalProducts,
        lowStock,
        outOfStock,
        stockValue: totalStockValue[0]?.value || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stock — paginated stock list with filters
router.get('/', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
    if (category) filter.category = category;
    if (status === 'low')    filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    if (status === 'out')    filter.stock = 0;
    if (status === 'ok')     filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name color')
      .sort({ stock: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/stock/:id/adjust — manual stock adjustment
router.patch('/:id/adjust', async (req, res) => {
  try {
    const { type, quantity, reason } = req.body; // type: 'add' | 'remove' | 'set'
    if (!quantity || quantity < 0)
      return res.status(400).json({ success: false, message: 'Valid quantity required' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let newStock;
    if (type === 'add')    newStock = product.stock + Number(quantity);
    else if (type === 'remove') newStock = Math.max(0, product.stock - Number(quantity));
    else if (type === 'set')   newStock = Number(quantity);
    else return res.status(400).json({ success: false, message: 'type must be add | remove | set' });

    product.stock = newStock;
    await product.save();

    res.json({ success: true, product, message: `Stock updated to ${newStock}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;