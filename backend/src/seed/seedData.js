require('dotenv').config({ path: require('path').join(__dirname, '../../.env.example') });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

const categories = [
  { name: 'Groceries & Staples', icon: '🌾', color: '#f59e0b' },
  { name: 'Fruits & Vegetables', icon: '🥦', color: '#22c55e' },
  { name: 'Dairy & Bakery', icon: '🥛', color: '#3b82f6' },
  { name: 'Beverages', icon: '🧃', color: '#8b5cf6' },
  { name: 'Snacks & Biscuits', icon: '🍪', color: '#f97316' },
  { name: 'Personal Care', icon: '🧴', color: '#ec4899' },
  { name: 'Home & Kitchen', icon: '🏠', color: '#06b6d4' },
  { name: 'Frozen Foods', icon: '🧊', color: '#6366f1' },
];

const productTemplates = [
  // Groceries
  { name: 'Fortune Basmati Rice', brand: 'Fortune', catIdx: 0, mrp: 120, sp: 109, unit: 'kg', gst: 5, barcode: '8901030861012', stock: 200 },
  { name: 'Aashirvaad Atta 5kg', brand: 'Aashirvaad', catIdx: 0, mrp: 285, sp: 259, unit: 'pack', gst: 5, barcode: '8901030000016', stock: 150 },
  { name: 'Tata Salt 1kg', brand: 'Tata', catIdx: 0, mrp: 24, sp: 22, unit: 'pack', gst: 0, barcode: '8901234567890', stock: 500 },
  { name: 'Surf Excel Detergent 1kg', brand: 'Surf Excel', catIdx: 0, mrp: 199, sp: 179, unit: 'pack', gst: 18, barcode: '8712566304020', stock: 100 },
  { name: 'Saffola Gold Oil 1L', brand: 'Saffola', catIdx: 0, mrp: 220, sp: 199, unit: 'L', gst: 5, barcode: '8901230567891', stock: 80 },
  { name: 'Moong Dal 500g', brand: 'Tata Sampann', catIdx: 0, mrp: 89, sp: 79, unit: 'pack', gst: 5, barcode: '8901290123456', stock: 120 },

  // Dairy
  { name: 'Amul Full Cream Milk 1L', brand: 'Amul', catIdx: 2, mrp: 68, sp: 68, unit: 'L', gst: 5, barcode: '8901764010012', stock: 300 },
  { name: 'Amul Butter 100g', brand: 'Amul', catIdx: 2, mrp: 58, sp: 56, unit: 'pack', gst: 12, barcode: '8901764011003', stock: 150 },
  { name: 'Britannia Cheese Slices', brand: 'Britannia', catIdx: 2, mrp: 120, sp: 109, unit: 'pack', gst: 12, barcode: '8901063140001', stock: 80 },
  { name: 'Nestle Dahi 400g', brand: 'Nestle', catIdx: 2, mrp: 55, sp: 52, unit: 'pack', gst: 5, barcode: '8901058000107', stock: 200 },
  { name: 'Modern White Bread', brand: 'Modern', catIdx: 2, mrp: 45, sp: 42, unit: 'pack', gst: 5, barcode: '8902080100007', stock: 90 },

  // Beverages
  { name: 'Coca Cola 2L', brand: 'Coca Cola', catIdx: 3, mrp: 95, sp: 89, unit: 'L', gst: 28, barcode: '8901164001024', stock: 120 },
  { name: 'Tropicana Orange 1L', brand: 'Tropicana', catIdx: 3, mrp: 130, sp: 115, unit: 'L', gst: 12, barcode: '8901011001019', stock: 80 },
  { name: 'Bisleri Water 1L', brand: 'Bisleri', catIdx: 3, mrp: 20, sp: 20, unit: 'L', gst: 12, barcode: '8906000440027', stock: 500 },
  { name: 'Red Bull 250ml', brand: 'Red Bull', catIdx: 3, mrp: 125, sp: 119, unit: 'ml', gst: 28, barcode: '9002490100070', stock: 60 },
  { name: 'Nescafe Classic 50g', brand: 'Nescafe', catIdx: 3, mrp: 185, sp: 169, unit: 'g', gst: 18, barcode: '8901030521019', stock: 70 },

  // Snacks
  { name: 'Lays Classic Salted 73g', brand: "Lay's", catIdx: 4, mrp: 35, sp: 35, unit: 'pack', gst: 18, barcode: '8901491107050', stock: 200 },
  { name: 'Britannia 5050 150g', brand: 'Britannia', catIdx: 4, mrp: 30, sp: 28, unit: 'pack', gst: 18, barcode: '8901063161006', stock: 180 },
  { name: 'Parle-G 800g', brand: 'Parle', catIdx: 4, mrp: 80, sp: 75, unit: 'pack', gst: 18, barcode: '8901719100049', stock: 150 },
  { name: 'Kurkure Masala Munch 90g', brand: 'Kurkure', catIdx: 4, mrp: 30, sp: 30, unit: 'pack', gst: 18, barcode: '8901491103007', stock: 160 },

  // Personal Care
  { name: 'Dove Soap 100g', brand: 'Dove', catIdx: 5, mrp: 65, sp: 58, unit: 'pcs', gst: 18, barcode: '8710908109041', stock: 200 },
  { name: 'Colgate MaxFresh 200g', brand: 'Colgate', catIdx: 5, mrp: 105, sp: 95, unit: 'pack', gst: 18, barcode: '8901172010089', stock: 180 },
  { name: 'Head & Shoulders 340ml', brand: 'Head & Shoulders', catIdx: 5, mrp: 360, sp: 319, unit: 'ml', gst: 18, barcode: '8001841437866', stock: 60 },
  { name: 'Vaseline Petroleum Jelly 100ml', brand: 'Vaseline', catIdx: 5, mrp: 115, sp: 99, unit: 'ml', gst: 18, barcode: '8712566213558', stock: 90 },

  // Home & Kitchen
  { name: 'Vim Bar Dishwash 300g', brand: 'Vim', catIdx: 6, mrp: 55, sp: 49, unit: 'pack', gst: 18, barcode: '8717644019948', stock: 200 },
  { name: 'Good Knight Fast Card', brand: 'Good Knight', catIdx: 6, mrp: 55, sp: 49, unit: 'pack', gst: 12, barcode: '8901396120010', stock: 100 },
  { name: 'Scotch Brite Scrub Pad', brand: '3M', catIdx: 6, mrp: 45, sp: 39, unit: 'pcs', gst: 18, barcode: '8901396110004', stock: 150 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/departmentalStorePOS');
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    const savedCats = await Category.insertMany(categories);
    console.log(`✅ ${savedCats.length} categories seeded`);

    const products = productTemplates.map((p) => ({
      barcode: p.barcode,
      name: p.name,
      brand: p.brand,
      category: savedCats[p.catIdx]._id,
      mrp: p.mrp,
      sellingPrice: p.sp,
      unit: p.unit,
      gstPercent: p.gst,
      stock: p.stock,
      hsnCode: '1001',
    }));

    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded`);

    await User.create([
      { name: 'Admin User', email: 'bsgopal0@gmail.com', password: 'admin123', role: 'admin', counter: '0' },
      { name: 'Cashier Ravi', email: 'ravi@dmart.com', password: 'ravi123', role: 'cashier', counter: '1' },
      { name: 'Cashier Priya', email: 'priya@dmart.com', password: 'priya123', role: 'cashier', counter: '2' },
    ]);
    console.log('✅ 3 users seeded');
    console.log('\n🎉 Seed complete!\nLogin: bsgopal0@gmail.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
