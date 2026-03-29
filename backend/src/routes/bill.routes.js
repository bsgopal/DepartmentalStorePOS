const router = require('express').Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

// POST /api/bills - create bill
router.post('/', protect, async (req, res) => {
  const { items, paymentMethod, amountPaid, splitPayments, customerPhone, customerName } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ success: false, message: 'No items in bill' });

  // Build bill items with product data
  const billItems = [];
  let subtotal = 0;
  let totalMrp = 0;
  let totalGst = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });

    const lineTotal = product.sellingPrice * item.quantity;
    const lineMrp = product.mrp * item.quantity;
    const gstAmount = (lineTotal * product.gstPercent) / (100 + product.gstPercent);

    subtotal += lineTotal;
    totalMrp += lineMrp;
    totalGst += gstAmount;

    billItems.push({
      product: product._id,
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      quantity: item.quantity,
      unit: product.unit,
      gstPercent: product.gstPercent,
      discount: product.mrp - product.sellingPrice,
      totalPrice: lineTotal,
    });

    // Decrease stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
  }

  const totalDiscount = totalMrp - subtotal;
  const totalAmount = subtotal;
  const changeReturned = amountPaid ? Math.max(0, amountPaid - totalAmount) : 0;

  // Customer lookup/create
  let customer = null;
  if (customerPhone) {
    customer = await Customer.findOne({ phone: customerPhone });
    if (!customer && customerName) {
      customer = await Customer.create({ name: customerName, phone: customerPhone });
    }
    if (customer) {
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalPurchases: totalAmount, totalBills: 1, points: Math.floor(totalAmount / 100) },
      });
    }
  }

  const bill = await Bill.create({
    customer: customer?._id,
    customerName: customerName || customer?.name,
    customerPhone,
    cashier: req.user._id,
    cashierName: req.user.name,
    items: billItems,
    subtotal,
    totalMrp,
    totalDiscount,
    totalGst,
    totalAmount,
    paymentMethod,
    amountPaid,
    changeReturned,
    splitPayments: Array.isArray(splitPayments) ? splitPayments : undefined,
    counter: req.user.counter || '1',
  });

  res.status(201).json({ success: true, bill });
});

// GET /api/bills - list bills
router.get('/', protect, async (req, res) => {
  const { page = 1, limit = 20, date, status } = req.query;
  const query = {};
  if (status) query.status = status;
  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  const total = await Bill.countDocuments(query);
  const bills = await Bill.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('customer', 'name phone membershipType');

  res.json({ success: true, total, bills });
});

// GET /api/bills/:id
router.get('/:id', protect, async (req, res) => {
  const bill = await Bill.findById(req.params.id).populate('customer', 'name phone membershipType');
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  res.json({ success: true, bill });
});

// PATCH /api/bills/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  const bill = await Bill.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
  res.json({ success: true, bill });
});

module.exports = router;
