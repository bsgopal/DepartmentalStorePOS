const router = require('express').Router();
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const { phone, search } = req.query;
  const query = { isActive: true };
  if (phone) query.phone = { $regex: phone, $options: 'i' };
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ];
  const customers = await Customer.find(query).limit(10).sort({ name: 1 });
  res.json({ success: true, customers });
});

router.post('/', protect, async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, customer });
});

router.get('/:id', protect, async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, customer });
});

module.exports = router;
