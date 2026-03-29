const router = require('express').Router();
const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

// POST /api/returns — process a return
router.post('/', protect, async (req, res) => {
  try {
    const { billId, returnItems, refundMethod, reason } = req.body;

    if (!billId || !returnItems || returnItems.length === 0)
      return res.status(400).json({ success: false, message: 'billId and returnItems are required' });

    const bill = await Bill.findById(billId);
    if (!bill)
      return res.status(404).json({ success: false, message: 'Bill not found' });
    if (bill.status === 'cancelled')
      return res.status(400).json({ success: false, message: 'Cannot return a cancelled bill' });
    if (bill.status === 'refunded')
      return res.status(400).json({ success: false, message: 'Bill already fully refunded' });

    let refundTotal = 0;
    const processedItems = [];

    for (const ri of returnItems) {
      const billItem = bill.items.find((i) => i.product.toString() === ri.productId);
      if (!billItem)
        return res.status(400).json({ success: false, message: `Product ${ri.productId} not in original bill` });
      if (ri.quantity > billItem.quantity)
        return res.status(400).json({ success: false, message: `Return quantity exceeds purchased quantity for ${billItem.name}` });

      const lineRefund = billItem.sellingPrice * ri.quantity;
      refundTotal += lineRefund;

      // Restock
      await Product.findByIdAndUpdate(ri.productId, { $inc: { stock: ri.quantity } });

      processedItems.push({
        product: billItem.product,
        name: billItem.name,
        quantity: ri.quantity,
        sellingPrice: billItem.sellingPrice,
        refundAmount: lineRefund,
      });
    }

    // Deduct loyalty points if customer linked
    if (bill.customer) {
      const pointsToDeduct = Math.floor(refundTotal / 100);
      await Customer.findByIdAndUpdate(bill.customer, {
        $inc: { totalPurchases: -refundTotal, points: -pointsToDeduct },
      });
    }

    // Update bill status
    const isFullReturn = returnItems.every((ri) => {
      const billItem = bill.items.find((i) => i.product.toString() === ri.productId);
      return billItem && ri.quantity === billItem.quantity;
    });

    await Bill.findByIdAndUpdate(billId, {
      status: isFullReturn ? 'refunded' : 'completed',
    });

    res.status(201).json({
      success: true,
      return: {
        originalBillNumber: bill.billNumber,
        refundTotal,
        refundMethod: refundMethod || bill.paymentMethod,
        reason,
        items: processedItems,
        processedBy: req.user.name,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/bill/:billId — get bill details for return processing
router.get('/bill/:billId', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId)
      .populate('customer', 'name phone membershipType')
      .populate('items.product', 'name barcode unit stock isActive');

    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;