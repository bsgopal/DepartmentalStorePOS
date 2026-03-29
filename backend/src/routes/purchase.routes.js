const router = require('express').Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

const ensureCategory = async (item) => {
  if (item.categoryId) {
    const existing = await Category.findById(item.categoryId);
    if (existing) return existing;
  }

  const name = String(item.categoryName || '').trim();
  if (!name) return null;

  let category = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (!category) {
    category = await Category.create({ name });
  }
  return category;
};

router.get('/', async (req, res) => {
  const { page = 1, limit = 20, supplier, invoiceNumber, from, to } = req.query;
  const query = { status: 'posted' };

  if (supplier) query.supplier = supplier;
  if (invoiceNumber?.trim()) {
    query.invoiceNumber = { $regex: invoiceNumber.trim(), $options: 'i' };
  }
  if (from || to) {
    query.invoiceDate = {};
    if (from) query.invoiceDate.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query.invoiceDate.$lte = end;
    }
  }

  const total = await Purchase.countDocuments(query);
  const purchases = await Purchase.find(query)
    .populate('supplier', 'name code')
    .sort({ invoiceDate: -1, createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, total, purchases });
});

router.get('/:id', async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('supplier', 'name code phone gstin')
    .populate('items.product', 'name barcode');

  if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
  res.json({ success: true, purchase });
});

router.post('/', async (req, res) => {
  const {
    supplierId,
    invoiceNumber,
    invoiceDate,
    items = [],
    notes,
  } = req.body;

  if (!supplierId) {
    return res.status(400).json({ success: false, message: 'supplierId is required' });
  }
  if (!invoiceNumber?.trim()) {
    return res.status(400).json({ success: false, message: 'invoiceNumber is required' });
  }
  if (!invoiceDate) {
    return res.status(400).json({ success: false, message: 'invoiceDate is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one item is required' });
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier || !supplier.isActive) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  const purchaseItems = [];
  let totalAmount = 0;

  for (const rawItem of items) {
    const quantity = Number(rawItem.quantity || 0);
    const purchasePrice = Number(rawItem.purchasePrice || 0);
    const mrp = Number(rawItem.mrp || 0);
    const sellingPrice = Number(rawItem.sellingPrice || 0);
    const gstPercent = Number(rawItem.gstPercent || 0);
    const lineTotal = Number((quantity * purchasePrice).toFixed(2));

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0 for all items' });
    }
    if (purchasePrice < 0 || mrp < 0 || sellingPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price values cannot be negative' });
    }

    let product = null;
    if (rawItem.productId) {
      product = await Product.findById(rawItem.productId);
    }

    if (!product && rawItem.barcode?.trim()) {
      product = await Product.findOne({ barcode: rawItem.barcode.trim() });
    }

    let categoryDoc = await ensureCategory(rawItem);
    if (!product && !categoryDoc) {
      return res.status(400).json({ success: false, message: `Category required for new product ${rawItem.name || rawItem.barcode}` });
    }

    if (!product) {
      if (!rawItem.name?.trim() || !rawItem.barcode?.trim()) {
        return res.status(400).json({ success: false, message: 'New products require name and barcode' });
      }

      product = await Product.create({
        barcode: rawItem.barcode.trim(),
        name: rawItem.name.trim(),
        brand: rawItem.brand || '',
        category: categoryDoc._id,
        supplier: supplier._id,
        purchasePrice,
        mrp,
        sellingPrice,
        unit: rawItem.unit || 'pcs',
        gstPercent,
        stock: quantity,
        lowStockThreshold: Number(rawItem.lowStockThreshold || 10),
        hsnCode: rawItem.hsnCode || '',
      });
    } else {
      if (!categoryDoc && product.category) {
        categoryDoc = { _id: product.category };
      }

      product.stock = Number(product.stock || 0) + quantity;
      product.purchasePrice = purchasePrice;
      product.mrp = mrp;
      product.sellingPrice = sellingPrice;
      product.gstPercent = gstPercent;
      product.unit = rawItem.unit || product.unit;
      product.supplier = supplier._id;
      if (rawItem.brand) product.brand = rawItem.brand;
      await product.save();
    }

    purchaseItems.push({
      product: product._id,
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      category: categoryDoc?._id,
      unit: product.unit,
      quantity,
      purchasePrice,
      mrp,
      sellingPrice,
      gstPercent,
      lineTotal,
    });

    totalAmount += lineTotal;
  }

  const purchase = await Purchase.create({
    supplier: supplier._id,
    supplierName: supplier.name,
    invoiceNumber: invoiceNumber.trim(),
    invoiceDate,
    items: purchaseItems,
    totalAmount: Number(totalAmount.toFixed(2)),
    notes,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, purchase });
});

module.exports = router;
