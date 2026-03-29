# 🛒 D-MART POS System

A full-stack, DMart-style Point of Sale (POS) billing system built with:

- **Frontend**: React 18 + Material UI (MUI) v5
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)

---

## 📁 Project Structure

```
dmart-pos/
├── backend/               # Node + Express API
│   ├── src/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, error handler
│   │   └── seed/          # Demo data seeder
│   ├── .env.example
│   └── package.json
│
└── frontend/              # React + MUI app
    ├── src/
    │   ├── api/           # Axios API client
    │   ├── components/    # Layout, Receipt
    │   ├── context/       # Auth + Cart contexts
    │   ├── pages/         # All page components
    │   └── theme/         # MUI theme
    └── package.json
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

---

### 1. Backend Setup

```bash
cd backend
npm install

# Copy and configure env
cp .env.example .env
# Edit .env: set your MONGODB_URI and JWT_SECRET

# Seed demo data (products, users, categories)
npm run seed

# Start dev server
npm run dev
# → Runs on http://localhost:5000
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start React app
npm start
# → Runs on http://localhost:3000
```

---

## 🔑 Demo Login Credentials

| Role    | Email              | Password   | Access                     |
|---------|--------------------|------------|----------------------------|
| Admin   | admin@dmart.com    | admin123   | Full access                |
| Cashier | ravi@dmart.com     | ravi123    | Billing + Bills History    |
| Cashier | priya@dmart.com    | priya123   | Billing + Bills History    |

---

## 🚀 Features

### Billing Screen (POS)
- 📦 Product grid with category filters
- 🔍 Barcode scanner + text search
- 🛒 Real-time cart with qty controls
- 👤 Customer lookup & linking
- 💰 Payment: Cash / Card / UPI / Wallet
- 🧾 Thermal receipt print
- 💚 Discount display (savings message)

### Dashboard (Admin)
- 📊 Today's revenue, bills, products, customers
- 📈 Weekly revenue bar chart
- 🔔 Low stock alerts
- 📋 Recent bills list

### Products (Admin)
- Full CRUD with search & pagination
- Barcode, brand, category, MRP, price, GST, stock
- Low stock warning indicators

### Bills History
- Date filter, status, payment method
- View full bill detail
- Print receipt
- Cancel bill

### Customers
- Register walk-in customers
- Track total purchases, points, membership tier

---

## 🗄️ API Endpoints

| Method | Route                        | Description            |
|--------|------------------------------|------------------------|
| POST   | /api/auth/login              | Login                  |
| GET    | /api/products                | List products          |
| GET    | /api/products/barcode/:code  | Lookup by barcode      |
| POST   | /api/products                | Create product (admin) |
| GET    | /api/categories              | List categories        |
| POST   | /api/bills                   | Create bill            |
| GET    | /api/bills                   | List bills             |
| GET    | /api/bills/:id               | Bill detail            |
| PATCH  | /api/bills/:id/cancel        | Cancel bill            |
| GET    | /api/customers               | Search customers       |
| POST   | /api/customers               | Register customer      |
| GET    | /api/dashboard/stats         | Dashboard stats        |

---

## 🧾 MongoDB Collections

- **users** — cashiers and admins
- **categories** — product categories
- **products** — products with barcode, MRP, price, GST, stock
- **bills** — completed transactions with line items
- **customers** — registered members with points

---

## 🖨️ Receipt Printing
The receipt component mimics an 80mm thermal printer format.
Click **Print Receipt** after checkout or from Bills History.

---

*Built to replicate the exact workflow used in DMart departmental stores.*
