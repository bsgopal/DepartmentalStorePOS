const router = require('express').Router();
const Bill = require('../models/Bill');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/gst/report?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/report', async (req, res) => {
  try {
    const { from, to, period } = req.query;

    let startDate, endDate;
    const now = new Date();

    if (period === 'today') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), q * 3, 1);
      endDate   = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
    } else {
      startDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate   = to   ? new Date(to)   : new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const bills = await Bill.find({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Aggregate GST by slab
    const slabMap = {};

    for (const bill of bills) {
      for (const item of bill.items) {
        const gstPct  = item.gstPercent || 0;
        const taxable = item.totalPrice / (1 + gstPct / 100); // exclusive base
        const gstAmt  = item.totalPrice - taxable;
        const cgst    = gstAmt / 2;
        const sgst    = gstAmt / 2;

        if (!slabMap[gstPct]) {
          slabMap[gstPct] = { rate: gstPct, taxableValue: 0, cgst: 0, sgst: 0, totalGst: 0, items: 0 };
        }
        slabMap[gstPct].taxableValue += taxable;
        slabMap[gstPct].cgst         += cgst;
        slabMap[gstPct].sgst         += sgst;
        slabMap[gstPct].totalGst     += gstAmt;
        slabMap[gstPct].items        += item.quantity;
      }
    }

    const slabs = Object.values(slabMap).sort((a, b) => a.rate - b.rate);

    const totals = slabs.reduce((acc, s) => ({
      taxableValue: acc.taxableValue + s.taxableValue,
      cgst:         acc.cgst         + s.cgst,
      sgst:         acc.sgst         + s.sgst,
      totalGst:     acc.totalGst     + s.totalGst,
    }), { taxableValue: 0, cgst: 0, sgst: 0, totalGst: 0 });

    res.json({
      success: true,
      period: { from: startDate, to: endDate },
      totalBills: bills.length,
      totalRevenue: bills.reduce((s, b) => s + b.totalAmount, 0),
      slabs,
      totals,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;