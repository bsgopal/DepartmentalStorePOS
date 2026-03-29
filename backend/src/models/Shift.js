const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: { type: String, required: true },
    counter: { type: String, default: '1' },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    openingCash: { type: Number, required: true, min: 0 },
    closingCash: { type: Number, min: 0 },
    expectedCash: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    totalBills: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

shiftSchema.index({ cashier: 1, status: 1, openedAt: -1 });

module.exports = mongoose.model('Shift', shiftSchema);
