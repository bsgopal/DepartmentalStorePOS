const router = require('express').Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const [todaySales, todayBills, totalProducts, totalCustomers, lowStock, recentBills] = await Promise.all([
    Bill.aggregate([
      { $match: { createdAt: { $gte: today, $lte: todayEnd }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Bill.countDocuments({ createdAt: { $gte: today }, status: 'completed' }),
    Product.countDocuments({ isActive: true }),
    Customer.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    Bill.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(5).populate('customer', 'name'),
  ]);

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
  const weeklyData = await Bill.aggregate([
    { $match: { createdAt: { $gte: weekStart }, status: 'completed' } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$totalAmount' },
      bills: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      todayRevenue: todaySales[0]?.total || 0,
      todayBills: todayBills,
      totalProducts,
      totalCustomers,
      lowStock,
    },
    weeklyData,
    recentBills,
  });
});

module.exports = router;
