# Renic POS System

A full-stack supermarket/departmental store POS system with:

- **Frontend**: React + MUI
- **Backend**: Node.js + Express + MongoDB
- **Desktop App**: Electron (Windows `.exe` installer support)

---

## Features

### Billing
- Barcode scan billing
- Product name search
- Cart with qty update/remove
- Customer lookup
- Payment dialog (cash/card/upi/wallet/split)
- Receipt print

### Product & Inventory
- Product CRUD
- Supplier mapping in product
- Stock + low stock threshold
- Bulk product import (CSV paste flow)
- Stock management + manual adjust

### Suppliers & Purchases
- Supplier CRUD
- Purchase entry by supplier invoice
- Multi-item purchase posting
- Auto stock update on purchase
- Recent purchase history

### Shifts
- Open shift with opening cash
- Close shift with closing cash
- Expected cash vs actual difference
- Shift history (admin/manager)

### Other
- Bills history
- Returns
- GST report
- Staff management
- Customers

---

## Project Structure

```txt
departmentalStorePOS/
+-- backend/
¦   +-- src/
¦   ¦   +-- models/
¦   ¦   +-- routes/
¦   ¦   +-- middleware/
¦   ¦   +-- server.js
¦   +-- package.json
+-- frontend/
¦   +-- src/
¦   ¦   +-- pages/
¦   ¦   +-- components/
¦   ¦   +-- api/
¦   ¦   +-- context/
¦   +-- package.json
+-- desktop/
¦   +-- main.js
¦   +-- preload.js
¦   +-- package.json
+-- package.json
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Windows (for `.exe` packaging)

---

## Environment Setup

### Backend `.env` (required)

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/renic_pos
JWT_SECRET=your_super_secret_key
```

---

## Development (Web)

### 1) Install all dependencies (root)

```bash
npm run install:all
```

### 2) Start backend

```bash
npm run start:backend
```

### 3) Start frontend

```bash
npm run start:frontend
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## Development (Desktop / Electron)

For local desktop run (without installer):

```bash
npm run start:desktop
```

Notes:
- In desktop mode, Electron starts backend and opens app window.
- Ensure `backend/.env` is valid.

---

## Build Windows EXE Installer

From repo root:

```bash
npm run dist:exe
```

Installer output:

```txt
desktop/dist/Renic POS Setup 1.0.0.exe
```

Portable build:

```bash
npm run dist:portable
```

---

## Build Scripts (Root)

```bash
npm run install:all      # install backend + frontend + desktop deps
npm run start:backend    # backend dev server
npm run start:frontend   # frontend dev server
npm run start:desktop    # electron desktop run
npm run build:frontend   # frontend production build
npm run dist:exe         # build windows installer (.exe)
npm run dist:portable    # build portable exe
```

---

## Important Notes for EXE

1. MongoDB must be reachable from packaged app.
2. Backend `.env` is used by desktop-bundled backend.
3. If Windows locks `frontend/build`, desktop build uses `build_electron`.
4. Installer includes backend + frontend build inside app resources.

---

## API Modules Added

- `/api/products` (+ `/bulk-import`)
- `/api/suppliers`
- `/api/purchases`
- `/api/stock`
- `/api/bills`
- `/api/shifts`
- `/api/returns`
- `/api/gst`
- `/api/staff`
- `/api/customers`
- `/api/categories`
- `/api/auth`

---

## Recommended Next Production Enhancements

- Purchase return to supplier
- Supplier payable ledger
- Barcode label print utility
- Batch/expiry tracking
- Auto backup/restore
- Hardware integrations (thermal printer, cash drawer, scale)

---
