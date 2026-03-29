const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const billItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  barcode: String,
  name: String,
  brand: String,
  mrp: Number,
  sellingPrice: Number,
  quantity: { type: Number, required: true, min: 1 },
  unit: String,
  gstPercent: Number,
  discount: Number,
  totalPrice: Number,
});

const billSchema = new mongoose.Schema(
  {
    billNumber: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: String,
    customerPhone: String,
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: String,
    items: [billItemSchema],
    subtotal: { type: Number, required: true },
    totalMrp: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
      required: true,
    },
    amountPaid: Number,
    changeReturned: Number,
    status: { type: String, enum: ['completed', 'cancelled', 'refunded'], default: 'completed' },
    counter: { type: String, default: '1' },
    storeId: { type: String, default: 'DMART-BLR-001' },
  },
  { timestamps: true }
);

billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const date = new Date();
    const prefix = `DM${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
