const router = require('express').Router();
const Supplier = require('../models/Supplier');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  const { search = '', page = 1, limit = 50, active } = req.query;
  const query = {};

  if (typeof active !== 'undefined') {
    query.isActive = active === 'true';
  }

  if (search?.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { code: { $regex: search.trim(), $options: 'i' } },
      { phone: { $regex: search.trim(), $options: 'i' } },
      { gstin: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const total = await Supplier.countDocuments(query);
  const suppliers = await Supplier.find(query)
    .sort({ name: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, total, suppliers });
});

router.get('/:id', async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, supplier });
});

router.post('/', async (req, res) => {
  const payload = {
    name: req.body.name,
    code: req.body.code,
    contactPerson: req.body.contactPerson,
    phone: req.body.phone,
    email: req.body.email,
    gstin: req.body.gstin,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    paymentTermsDays: Number(req.body.paymentTermsDays || 0),
    openingBalance: Number(req.body.openingBalance || 0),
    notes: req.body.notes,
  };

  if (!payload.name?.trim()) {
    return res.status(400).json({ success: false, message: 'Supplier name is required' });
  }

  const supplier = await Supplier.create(payload);
  res.status(201).json({ success: true, supplier });
});

router.put('/:id', async (req, res) => {
  const updates = {
    name: req.body.name,
    code: req.body.code,
    contactPerson: req.body.contactPerson,
    phone: req.body.phone,
    email: req.body.email,
    gstin: req.body.gstin,
    addressLine1: req.body.addressLine1,
    addressLine2: req.body.addressLine2,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    paymentTermsDays: Number(req.body.paymentTermsDays || 0),
    openingBalance: Number(req.body.openingBalance || 0),
    notes: req.body.notes,
    isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
  };

  if (!updates.name?.trim()) {
    return res.status(400).json({ success: false, message: 'Supplier name is required' });
  }

  const supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, supplier });
});

router.delete('/:id', async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, message: 'Supplier deactivated' });
});

module.exports = router;
