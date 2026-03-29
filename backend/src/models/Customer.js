const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: String,
    membershipId: { type: String, unique: true, sparse: true },
    membershipType: { type: String, enum: ['regular', 'silver', 'gold', 'platinum'], default: 'regular' },
    totalPurchases: { type: Number, default: 0 },
    totalBills: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
