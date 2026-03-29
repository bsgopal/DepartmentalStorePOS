const router = require('express').Router();
const Bill = require('../models/Bill');
const Shift = require('../models/Shift');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/current', async (req, res) => {
  const shift = await Shift.findOne({ cashier: req.user._id, status: 'open' }).sort({ openedAt: -1 });
  res.json({ success: true, shift: shift || null });
});

router.post('/open', async (req, res) => {
  const openShift = await Shift.findOne({ cashier: req.user._id, status: 'open' });
  if (openShift) {
    return res.status(400).json({ success: false, message: 'An open shift already exists for this cashier' });
  }

  const openingCash = Number(req.body.openingCash || 0);
  if (openingCash < 0) {
    return res.status(400).json({ success: false, message: 'openingCash must be >= 0' });
  }

  const shift = await Shift.create({
    cashier: req.user._id,
    cashierName: req.user.name,
    counter: req.user.counter || '1',
    openingCash,
    notes: req.body.notes || '',
  });

  res.status(201).json({ success: true, shift });
});

router.post('/close', async (req, res) => {
  const shift = await Shift.findOne({ cashier: req.user._id, status: 'open' }).sort({ openedAt: -1 });
  if (!shift) {
    return res.status(400).json({ success: false, message: 'No open shift found' });
  }

  const closingCash = Number(req.body.closingCash || 0);
  if (closingCash < 0) {
    return res.status(400).json({ success: false, message: 'closingCash must be >= 0' });
  }

  const bills = await Bill.find({
    cashier: req.user._id,
    status: 'completed',
    createdAt: { $gte: shift.openedAt, $lte: new Date() },
  });

  let cashSales = 0;
  for (const bill of bills) {
    if (bill.paymentMethod === 'cash') {
      cashSales += Number(bill.totalAmount || 0);
      continue;
    }
    if (bill.paymentMethod === 'split' && Array.isArray(bill.splitPayments)) {
      for (const sp of bill.splitPayments) {
        if (sp?.method === 'cash') cashSales += Number(sp.amount || 0);
      }
    }
  }

  const expectedCash = Number((Number(shift.openingCash || 0) + cashSales).toFixed(2));
  shift.closingCash = closingCash;
  shift.cashSales = Number(cashSales.toFixed(2));
  shift.totalBills = bills.length;
  shift.expectedCash = expectedCash;
  shift.closedAt = new Date();
  shift.status = 'closed';
  shift.notes = req.body.notes || shift.notes || '';
  await shift.save();

  res.json({
    success: true,
    shift,
    summary: {
      openingCash: shift.openingCash,
      cashSales: shift.cashSales,
      expectedCash: shift.expectedCash,
      closingCash: shift.closingCash,
      difference: Number((shift.closingCash - shift.expectedCash).toFixed(2)),
      totalBills: shift.totalBills,
    },
  });
});

router.get('/', adminOnly, async (req, res) => {
  const { page = 1, limit = 20, status, cashier } = req.query;
  const query = {};
  if (status) query.status = status;
  if (cashier) query.cashier = cashier;

  const total = await Shift.countDocuments(query);
  const shifts = await Shift.find(query)
    .sort({ openedAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, total, shifts });
});

module.exports = router;
