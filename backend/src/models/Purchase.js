const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    barcode: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    unit: { type: String, default: 'pcs' },
    quantity: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: { type: String, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String, required: true },
    invoiceNumber: { type: String, trim: true, required: true },
    invoiceDate: { type: Date, required: true },
    items: { type: [purchaseItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['posted', 'cancelled'], default: 'posted' },
  },
  { timestamps: true }
);

purchaseSchema.pre('save', async function (next) {
  if (this.purchaseNumber) return next();

  const d = new Date();
  const prefix = `PO${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const count = await mongoose.model('Purchase').countDocuments();
  this.purchaseNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
