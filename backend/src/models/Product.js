const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    barcode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs', enum: ['pcs', 'kg', 'g', 'L', 'ml', 'pack'] },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    gstPercent: { type: Number, default: 5, enum: [0, 5, 12, 18, 28] },
    hsnCode: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.virtual('discount').get(function () {
  if (this.mrp === 0) return 0;
  return Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text', brand: 'text', barcode: 'text' });

module.exports = mongoose.model('Product', productSchema);
