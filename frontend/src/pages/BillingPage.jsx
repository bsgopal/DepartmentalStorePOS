import React, { useState, useEffect, useRef } from 'react';
import {
  CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar,
} from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  getProducts, getCategories, getProductByBarcode,
  createBill, getCustomers,
} from '../api';
import BillReceipt from '../components/BillReceipt';

/* ─── helpers ──────────────────────────────────────────────────── */
const fmtDate = () =>
  new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const PAY_METHODS = [
  { value: 'cash',   label: 'Cash',   code: 'C' },
  { value: 'card',   label: 'Card',   code: 'D' },
  { value: 'upi',    label: 'UPI',    code: 'U' },
  { value: 'wallet', label: 'Wallet', code: 'W' },
];

/* ── style tokens ── */
const S = {
  mono: "'Courier New', monospace",
  blue: '#1565c0',
  blueDark: '#0d47a1',
  blueLight: '#e3f2fd',
  blueMid: '#bbdefb',
  green: '#2e7d32',
  red: '#c62828',
  bg: '#f0f4f8',
  headerBg: 'linear-gradient(180deg,#1976d2 0%,#1565c0 100%)',
  rowEven: '#fff',
  rowOdd: '#f5f7ff',
  rowSelected: '#ddeeff',
  border: '1px solid #90caf9',
};

/* ── Win-style table header cell ── */
const TH = ({ children, w, right }) => (
  <th style={{
    padding: '3px 6px', fontSize: 11, fontWeight: 700,
    background: 'linear-gradient(180deg,#e3f2fd,#bbdefb)',
    color: S.blue, borderBottom: `2px solid ${S.blue}`,
    borderRight: S.border, textAlign: right ? 'right' : 'left',
    fontFamily: S.mono, whiteSpace: 'nowrap',
    width: w,
  }}>{children}</th>
);

/* ── Win-style table data cell ── */
const TD = ({ children, style = {}, onClick }) => (
  <td onClick={onClick} style={{
    padding: '2px 6px', fontSize: 12, fontFamily: S.mono,
    borderBottom: '1px solid #dde3f5', whiteSpace: 'nowrap', ...style,
  }}>{children}</td>
);

/* ── Windows-era push button ── */
const Btn = ({ children, onClick, variant = 'default', disabled, small, style = {} }) => {
  const bg = {
    default: 'linear-gradient(180deg,#e8eaf6,#c5cae9)',
    blue:    'linear-gradient(180deg,#1e88e5,#1565c0)',
    green:   'linear-gradient(180deg,#43a047,#2e7d32)',
    red:     'linear-gradient(180deg,#ef5350,#c62828)',
    yellow:  'linear-gradient(180deg,#ffee58,#f9a825)',
  };
  const bc = { default: '#9fa8da', blue: '#0d47a1', green: '#1b5e20', red: '#7f0000', yellow: '#f57f17' };
  const col = { default: '#212121', blue: '#fff', green: '#fff', red: '#fff', yellow: '#212121' };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? 'linear-gradient(180deg,#e0e0e0,#bdbdbd)' : bg[variant],
        color: disabled ? '#9e9e9e' : col[variant],
        border: `1px solid ${disabled ? '#9e9e9e' : bc[variant]}`,
        borderBottom: `2px solid ${disabled ? '#757575' : bc[variant]}`,
        padding: small ? '2px 10px' : '5px 16px',
        fontSize: small ? 10 : 11, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: S.mono, letterSpacing: 0.5,
        ...style,
      }}
    >{children}</button>
  );
};

/* ── Section header (blue gradient bar) ── */
const SHdr = ({ children, right }) => (
  <div style={{
    background: S.headerBg, color: '#fff',
    padding: '3px 10px', fontSize: 11, fontWeight: 700,
    letterSpacing: 0.5, display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
  }}>
    <span>{children}</span>
    {right && <span style={{ fontSize: 10, opacity: 0.85 }}>{right}</span>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
export default function BillingPage() {
  const { user }  = useAuth();
  const cart      = useCart();

  const [products,         setProducts]         = useState([]);
  const [categories,       setCategories]       = useState([]);
  const [activeCategory,   setActiveCategory]   = useState('all');
  const [search,           setSearch]           = useState('');
  const [barcode,          setBarcode]          = useState('');
  const [loadingProd,      setLoadingProd]      = useState(false);
  const [selProdIdx,       setSelProdIdx]       = useState(null);
  const [selCartIdx,       setSelCartIdx]       = useState(null);

  const [payDialog,  setPayDialog]  = useState(false);
  const [payMethod,  setPayMethod]  = useState('cash');
  const [cashPaid,   setCashPaid]   = useState('');
  const [paying,     setPaying]     = useState(false);
  const [payError,   setPayError]   = useState('');

  const [custQuery,  setCustQuery]  = useState('');
  const [custOpts,   setCustOpts]   = useState([]);
  const [custDrop,   setCustDrop]   = useState(false);

  const [doneBill,   setDoneBill]   = useState(null);
  const [doneOpen,   setDoneOpen]   = useState(false);
  const [snack,      setSnack]      = useState('');
  const [clock,      setClock]      = useState(fmtTime());

  const barcodeRef = useRef();
  const receiptRef = useRef();
  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setClock(fmtTime()), 1000);
    return () => clearInterval(t);
  }, []);

  /* categories */
  useEffect(() => {
    getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  /* products */
  useEffect(() => {
    setLoadingProd(true);
    const p = { limit: 100 };
    if (search) p.search = search;
    if (activeCategory !== 'all') p.category = activeCategory;
    getProducts(p)
      .then(r => setProducts(r.data.products))
      .catch(() => {})
      .finally(() => setLoadingProd(false));
  }, [search, activeCategory]);

  /* barcode */
  const onBarcodeKey = async e => {
    if (e.key !== 'Enter' || !barcode.trim()) return;
    try {
      const r = await getProductByBarcode(barcode.trim());
      cart.addItem(r.data.product);
      setSnack('Added: ' + r.data.product.name);
      setBarcode('');
    } catch {
      setSnack('ERROR: Not found — ' + barcode);
      setBarcode('');
    }
  };

  /* customer search */
  useEffect(() => {
    if (custQuery.length < 3) { setCustOpts([]); setCustDrop(false); return; }
    getCustomers({ phone: custQuery })
      .then(r => { setCustOpts(r.data.customers); setCustDrop(true); })
      .catch(() => {});
  }, [custQuery]);

  /* payment */
  const handlePay = async () => {
    if (!cart.items.length) return;
    setPaying(true); setPayError('');
    try {
      const paid = payMethod === 'cash'
        ? parseFloat(cashPaid) || cart.totalAmount : cart.totalAmount;
      const r = await createBill({
        items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: payMethod, amountPaid: paid,
        customerPhone: cart.customer?.phone, customerName: cart.customer?.name,
      });
      setDoneBill(r.data.bill);
      cart.clearCart(); setPayDialog(false); setDoneOpen(true); setCashPaid('');
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed');
    } finally { setPaying(false); }
  };

  const change = payMethod === 'cash' && cashPaid
    ? Math.max(0, parseFloat(cashPaid) - cart.totalAmount) : 0;
  const lastItem = cart.items[cart.items.length - 1];

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      overflow: 'hidden', background: '#dde4ef', fontFamily: S.mono,
    }}>

      {/* ══ TITLE BAR ══ */}
      <div style={{
        background: S.headerBg, borderBottom: '2px solid #0d47a1',
        padding: '4px 10px', display: 'flex', alignItems: 'center',
        gap: 12, flexShrink: 0,
      }}>
        {/* D-MART logo chip */}
        <div style={{
          background: '#fff', padding: '1px 10px',
          display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid #fff', borderRadius: 1,
        }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#c62828', fontFamily: S.mono }}>Renic</span>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 900, color: S.blue }}>DepartmentalStore</div>
            <div style={{ fontSize: 7, color: '#78909c' }}>POS</div>
          </div>
        </div>

        <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
          BILLING DEPARTMENT
        </span>

        {[
          `Sale Type : Cash Sale`,
          `Cashier : ${user?.name || 'OPERATOR'}`,
        ].map((t, i) => (
          <React.Fragment key={i}>
            <span style={{ color: '#90caf9' }}>|</span>
            <span style={{ color: '#e3f2fd', fontSize: 11 }}>{t}</span>
          </React.Fragment>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#e3f2fd', fontSize: 11 }}>Counter #{user?.counter || '1'}</span>
          <span style={{ color: '#e3f2fd', fontSize: 11 }}>{fmtDate()}</span>
          <span style={{
            color: '#fff9c4', fontWeight: 900, fontSize: 12,
            background: 'rgba(0,0,0,0.25)', padding: '1px 10px',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>{clock}</span>
        </div>
      </div>

      {/* ══ INVOICE TOOLBAR ══ */}
      <div style={{
        background: '#eceff1', borderBottom: '1px solid #b0bec5',
        padding: '4px 10px', display: 'flex', alignItems: 'center',
        gap: 12, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#37474f' }}>Invoice Date :</span>
        <span style={{ fontSize: 11, color: S.blue, fontWeight: 700 }}>{fmtDate()}</span>
        <span style={{ color: '#bdbdbd' }}>|</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#37474f' }}>Invoice No :</span>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#fff',
          background: S.blue, padding: '1px 10px', border: `1px solid ${S.blueDark}`,
        }}>Automatic</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['Cash Sale (Payment By : Cash, Card, Coupons, Cheque)', 'F10: Payment Details'].map(t => (
            <button key={t} style={{
              background: 'linear-gradient(180deg,#e3f2fd,#bbdefb)',
              border: `1px solid ${S.blue}`, color: S.blue,
              padding: '2px 10px', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', fontFamily: S.mono,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', borderRight: '2px solid #90caf9',
          background: '#fff',
        }}>

          {/* Tab strip */}
          <div style={{
            display: 'flex', background: '#e8eaf6',
            borderBottom: `2px solid ${S.blue}`, flexShrink: 0,
          }}>
            {['Item Detail (F2)', "Add-On's (F6)", 'Payment Details (F10)'].map((tab, i) => (
              <div key={tab} style={{
                padding: '5px 14px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: S.mono,
                background: i === 0 ? S.headerBg : 'linear-gradient(180deg,#f5f5f5,#e0e0e0)',
                color: i === 0 ? '#fff' : '#546e7a',
                border: '1px solid #90caf9', marginRight: 1,
                borderBottom: i === 0 ? 'none' : '1px solid #90caf9',
              }}>{tab}</div>
            ))}
          </div>

          {/* Entry row */}
          <div style={{
            background: '#f5f7ff', borderBottom: '2px solid #c5cae9',
            padding: '8px 12px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>

              {/* Barcode */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: S.blue, marginBottom: 2 }}>Barcode</div>
                <input
                  ref={barcodeRef} value={barcode}
                  onChange={e => setBarcode(e.target.value)}
                  onKeyDown={onBarcodeKey} placeholder="Scan & Enter…" autoFocus
                  style={{
                    width: 210, border: `2px solid ${S.blue}`,
                    background: '#fff9c4', padding: '4px 8px',
                    fontSize: 13, fontFamily: S.mono, fontWeight: 700,
                    color: '#212121', outline: 'none',
                  }}
                />
              </div>

              {/* Search */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#37474f', marginBottom: 2 }}>Search Item</div>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Item name…"
                  style={{
                    width: 220, border: '2px inset #90caf9', background: '#fff',
                    padding: '4px 8px', fontSize: 12, fontFamily: S.mono,
                    color: '#212121', outline: 'none',
                  }}
                />
              </div>

              {/* Summary chips */}
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', alignItems: 'flex-end' }}>
                {[
                  { l: 'Discount', v: `₹ ${cart.totalDiscount?.toFixed(2) || '0.00'}`, g: true },
                  { l: 'GST (Incl.)', v: `₹ ${cart.totalGst?.toFixed(2) || '0.00'}` },
                  { l: 'Items', v: cart.totalItems },
                ].map(({ l, v, g }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#78909c', marginBottom: 1 }}>{l}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 700, fontFamily: S.mono,
                      color: g ? S.green : S.blue,
                      background: g ? '#e8f5e9' : S.blueLight,
                      border: `1px solid ${g ? '#a5d6a7' : '#90caf9'}`,
                      padding: '2px 10px', minWidth: 70, textAlign: 'right',
                    }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category row */}
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#37474f', marginRight: 4 }}>
                Category Filter
              </span>
              {[{ _id: 'all', name: 'All', icon: '' }, ...categories].map(cat => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  style={{
                    padding: '2px 10px', fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', fontFamily: S.mono,
                    border: `1px solid ${activeCategory === cat._id ? S.blueDark : '#90caf9'}`,
                    background: activeCategory === cat._id
                      ? S.headerBg : 'linear-gradient(180deg,#e3f2fd,#bbdefb)',
                    color: activeCategory === cat._id ? '#fff' : S.blue,
                  }}
                >
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Product Table ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingProd ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                <CircularProgress size={22} />
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <TH w={90}>Item Code</TH>
                    <TH>Item Name</TH>
                    <TH w={90}>Brand</TH>
                    <TH w={110}>Category</TH>
                    <TH w={70} right>MRP ₹</TH>
                    <TH w={70} right>Rate ₹</TH>
                    <TH w={50}>Unit</TH>
                    <TH w={45}>Disc%</TH>
                    <TH w={50}> </TH>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => {
                    const disc = p.mrp > 0
                      ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
                    const inCart = cart.items.find(i => i.productId === p._id);
                    const sel = selProdIdx === idx;
                    return (
                      <tr
                        key={p._id}
                        onClick={() => setSelProdIdx(idx)}
                        onDoubleClick={() => { cart.addItem(p); setSnack('Added: ' + p.name); }}
                        style={{
                          background: sel ? S.rowSelected : inCart ? '#e8f5e9' : idx % 2 === 0 ? S.rowEven : S.rowOdd,
                          cursor: 'pointer',
                        }}
                      >
                        <TD style={{ fontSize: 10, color: '#78909c' }}>
                          {p.barcode || p._id?.slice(-8)}
                        </TD>
                        <TD style={{ fontWeight: inCart ? 700 : 400 }}>
                          {p.name}
                          {inCart && (
                            <span style={{
                              marginLeft: 6, fontSize: 9, fontWeight: 900,
                              background: S.blue, color: '#fff', padding: '0 4px',
                            }}>×{inCart.quantity}</span>
                          )}
                        </TD>
                        <TD style={{ fontSize: 11, color: '#546e7a' }}>{p.brand}</TD>
                        <TD style={{ fontSize: 10, color: '#546e7a' }}>{p.category?.name || '—'}</TD>
                        <TD style={{
                          textAlign: 'right', color: '#9e9e9e',
                          textDecoration: disc > 0 ? 'line-through' : 'none',
                        }}>
                          {p.mrp?.toFixed(2)}
                        </TD>
                        <TD style={{ textAlign: 'right', fontWeight: 700, color: S.blue }}>
                          {p.sellingPrice?.toFixed(2)}
                        </TD>
                        <TD style={{ fontSize: 10, color: '#78909c' }}>{p.unit}</TD>
                        <TD style={{ textAlign: 'center' }}>
                          {disc > 0 && (
                            <span style={{
                              background: '#c62828', color: '#fff',
                              fontSize: 9, fontWeight: 900, padding: '1px 4px',
                            }}>{disc}%</span>
                          )}
                        </TD>
                        <TD>
                          <button
                            onClick={e => { e.stopPropagation(); cart.addItem(p); setSnack('Added: ' + p.name); }}
                            style={{
                              background: 'linear-gradient(180deg,#43a047,#2e7d32)',
                              color: '#fff', border: '1px solid #1b5e20',
                              fontSize: 10, fontWeight: 700, padding: '1px 8px',
                              cursor: 'pointer', fontFamily: S.mono,
                            }}
                          >ADD</button>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Last scanned bar */}
          <div style={{
            background: '#eceff1', borderTop: '2px solid #90caf9',
            padding: '3px 10px', display: 'flex', gap: 14, alignItems: 'center',
            flexShrink: 0, fontSize: 10, fontFamily: S.mono,
          }}>
            <span style={{ fontWeight: 700, color: '#37474f' }}>Last Scanned Item :</span>
            {lastItem ? (
              <>
                <span style={{ fontWeight: 700, color: S.blue }}>{lastItem.name}</span>
                <span style={{ color: '#78909c' }}>(Code: {lastItem.productId?.slice(-8)})</span>
                <span>Rate: <b style={{ color: S.blue }}>₹{lastItem.sellingPrice?.toFixed(2)}</b></span>
                <span>MRP: <b>₹{lastItem.mrp?.toFixed(2)}</b></span>
                <span>Qty: <b style={{ color: S.green }}>{lastItem.quantity}</b></span>
              </>
            ) : <span style={{ color: '#9e9e9e' }}>—</span>}
          </div>
        </div>

        {/* ── RIGHT: BILL PANEL ── */}
        <div style={{
          width: 390, display: 'flex', flexDirection: 'column',
          background: '#fff', flexShrink: 0, overflow: 'hidden',
          borderLeft: '2px solid #90caf9',
        }}>

          {/* Header */}
          <SHdr right={`${cart.totalItems} items`}>
            ⬛ CURRENT BILL
            {cart.items.length > 0 && (
              <button
                onClick={cart.clearCart}
                style={{
                  marginLeft: 10, background: '#c62828', color: '#fff',
                  border: 'none', fontSize: 9, fontWeight: 700,
                  padding: '1px 6px', cursor: 'pointer',
                }}
              >CLEAR ALL</button>
            )}
          </SHdr>

          {/* Customer */}
          <div style={{
            background: '#fffde7', borderBottom: '1px solid #f0f4c3',
            padding: '5px 8px', flexShrink: 0, position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#37474f', whiteSpace: 'nowrap' }}>
                Customer :
              </span>
              <input
                value={custQuery}
                onChange={e => setCustQuery(e.target.value)}
                placeholder="Phone (min 3 digits)…"
                style={{
                  flex: 1, border: '2px inset #aaa',
                  padding: '2px 6px', fontSize: 11, fontFamily: S.mono,
                  background: '#fff', outline: 'none',
                }}
              />
            </div>
            {cart.customer && (
              <div style={{ fontSize: 10, color: S.green, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ {cart.customer.name} ({cart.customer.membershipType?.toUpperCase()})
                <button
                  onClick={() => { cart.setCustomer(null); setCustQuery(''); }}
                  style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}
                >✕ Remove</button>
              </div>
            )}
            {custDrop && custOpts.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
                background: '#fff', border: `2px solid ${S.blue}`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              }}>
                {custOpts.slice(0, 6).map(c => (
                  <div
                    key={c._id}
                    onClick={() => { cart.setCustomer(c); setCustOpts([]); setCustDrop(false); setCustQuery(''); }}
                    style={{
                      padding: '4px 10px', cursor: 'pointer', fontSize: 11,
                      fontFamily: S.mono, borderBottom: '1px solid #e0e0e0',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = S.blueLight}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <b>{c.name}</b> · {c.phone}
                    <span style={{ float: 'right', fontSize: 9, color: '#78909c' }}>{c.membershipType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart table header */}
          <table style={{ width: '100%', borderCollapse: 'collapse', flexShrink: 0 }}>
            <thead>
              <tr>
                <TH w={20}>#</TH>
                <TH>Item Description</TH>
                <TH w={55} right>Qty</TH>
                <TH w={60} right>Rate</TH>
                <TH w={72} right>Amount</TH>
              </tr>
            </thead>
          </table>

          {/* Cart rows */}
          <div style={{ flex: 1, overflowY: 'auto', borderBottom: '2px solid #c5cae9' }}>
            {cart.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#bdbdbd', fontFamily: S.mono }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
                <div style={{ fontSize: 11 }}>— Cart is empty —</div>
                <div style={{ fontSize: 10, marginTop: 4, color: '#d0d0d0' }}>Scan barcode or double-click a product</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {cart.items.map((item, idx) => {
                    const sel = selCartIdx === idx;
                    return (
                      <tr
                        key={item.productId}
                        onClick={() => setSelCartIdx(idx)}
                        style={{
                          background: sel ? S.rowSelected : idx % 2 === 0 ? '#fff' : '#f5f7ff',
                          cursor: 'pointer',
                        }}
                      >
                        <TD style={{ color: '#78909c', width: 20, fontSize: 10 }}>{idx + 1}</TD>
                        <TD>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#212121', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 9, color: '#78909c' }}>{item.brand}</div>
                        </TD>
                        <TD style={{ textAlign: 'center', width: 60 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <button
                              onClick={e => { e.stopPropagation(); cart.updateQty(item.productId, item.quantity - 1); }}
                              style={{ width: 16, height: 16, background: '#e53935', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: '14px', padding: 0, fontWeight: 900 }}
                            >−</button>
                            <span style={{ fontSize: 13, fontWeight: 900, color: S.blue, minWidth: 18, textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); cart.updateQty(item.productId, item.quantity + 1); }}
                              style={{ width: 16, height: 16, background: '#2e7d32', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: '14px', padding: 0, fontWeight: 900 }}
                            >+</button>
                          </div>
                        </TD>
                        <TD style={{ textAlign: 'right', color: '#546e7a', width: 62, fontSize: 11 }}>
                          {item.sellingPrice?.toFixed(2)}
                        </TD>
                        <TD style={{ textAlign: 'right', width: 74 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: S.blue }}>
                              {item.totalPrice?.toFixed(2)}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); cart.removeItem(item.productId); }}
                              style={{ background: 'none', border: 'none', color: S.red, cursor: 'pointer', fontSize: 13, fontWeight: 900, padding: 0, lineHeight: 1 }}
                            >✕</button>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bill totals */}
          <div style={{ background: '#f5f7ff', flexShrink: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { l: 'Total Qty (Pcs)', v: cart.totalItems },
                  { l: 'MRP Total (₹)',   v: cart.totalMrp?.toFixed(2) },
                  { l: 'Total Discount',  v: `₹ ${cart.totalDiscount?.toFixed(2)}`, green: true },
                  { l: 'GST Incl. (₹)',   v: cart.totalGst?.toFixed(2) },
                ].map(({ l, v, green }) => (
                  <tr key={l} style={{ borderBottom: '1px solid #e8eaf6' }}>
                    <td style={{ fontSize: 11, padding: '2px 10px', color: '#546e7a', fontFamily: S.mono }}>{l}</td>
                    <td style={{
                      fontSize: 11, padding: '2px 10px', textAlign: 'right', fontWeight: 600,
                      color: green ? S.green : '#37474f', fontFamily: S.mono,
                    }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Grand total */}
            <div style={{
              background: 'linear-gradient(180deg,#1976d2,#1565c0)',
              padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 1, fontFamily: S.mono }}>
                TOTAL AMOUNT
              </span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#fff9c4', fontFamily: S.mono }}>
                ₹ {cart.totalAmount?.toFixed(2)}
              </span>
            </div>

            {cart.totalDiscount > 0 && (
              <div style={{
                background: '#e8f5e9', borderTop: '1px solid #a5d6a7',
                padding: '3px 12px', fontSize: 11, fontWeight: 700,
                color: S.green, textAlign: 'center', fontFamily: S.mono,
              }}>
                🏷 Customer saves ₹{cart.totalDiscount?.toFixed(2)} on this bill!
              </div>
            )}

            {/* Action buttons */}
            <div style={{ padding: '8px', display: 'flex', gap: 6 }}>
              <button
                onClick={() => cart.items.length && setPayDialog(true)}
                disabled={!cart.items.length}
                style={{
                  flex: 1,
                  background: cart.items.length
                    ? 'linear-gradient(180deg,#43a047,#2e7d32)'
                    : 'linear-gradient(180deg,#e0e0e0,#bdbdbd)',
                  color: cart.items.length ? '#fff' : '#9e9e9e',
                  border: `2px solid ${cart.items.length ? '#1b5e20' : '#9e9e9e'}`,
                  borderBottom: `3px solid ${cart.items.length ? '#1b5e20' : '#757575'}`,
                  padding: '9px', fontSize: 13, fontWeight: 900,
                  cursor: cart.items.length ? 'pointer' : 'not-allowed',
                  fontFamily: S.mono, letterSpacing: 1,
                }}
              >F10  PAYMENT</button>

              <button
                onClick={cart.clearCart}
                style={{
                  background: 'linear-gradient(180deg,#ef5350,#c62828)',
                  color: '#fff', border: '2px solid #7f0000',
                  borderBottom: '3px solid #7f0000',
                  padding: '9px 14px', fontSize: 12, fontWeight: 900,
                  cursor: 'pointer', fontFamily: S.mono,
                }}
              >ESC</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ SHORTCUT BAR ══ */}
      <div style={{
        background: 'linear-gradient(180deg,#263238,#1c2a32)',
        borderTop: '2px solid #37474f',
        display: 'flex', gap: 0, padding: '3px 6px',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {[
          ['F1', 'Item Help'], ['F2', 'Item Detail'], ['F6', "Add-On's"],
          ['F8', 'Item Name'], ['F9', 'Rate Help'], ['F10', 'Payment'],
          ['F3', 'Repeat Item'], ['Alt+F3', 'Function Key Help'], ['Alt+F2', 'Payment Options'],
        ].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', marginRight: 14 }}>
            <span style={{
              background: 'linear-gradient(180deg,#455a64,#37474f)',
              color: '#ffd54f', fontSize: 10, fontFamily: S.mono, fontWeight: 900,
              padding: '1px 5px', border: '1px solid #546e7a',
              borderBottom: '2px solid #263238', minWidth: 30, textAlign: 'center',
            }}>{key}</span>
            <span style={{ fontSize: 10, color: '#90a4ae', marginLeft: 3, fontFamily: S.mono }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ══ PAYMENT DIALOG ══ */}
      <Dialog open={payDialog} onClose={() => !paying && setPayDialog(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ style: { border: `3px solid ${S.blue}`, borderRadius: 0 } }}>
        <DialogTitle style={{
          background: S.headerBg, color: '#fff', fontFamily: S.mono,
          fontSize: 13, fontWeight: 900, padding: '8px 16px', borderBottom: `2px solid ${S.blueDark}`,
        }}>
          ⬛ SELECT PAYMENT METHOD — Total: ₹{cart.totalAmount?.toFixed(2)}
        </DialogTitle>
        <DialogContent style={{ background: '#f9fafb', padding: '20px 20px 12px' }}>
          {payError && (
            <div style={{
              background: '#ffebee', border: `1px solid ${S.red}`,
              padding: '6px 12px', marginBottom: 12, fontSize: 11,
              fontFamily: S.mono, color: S.red,
            }}>⚠ {payError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {PAY_METHODS.map(m => (
              <div
                key={m.value}
                onClick={() => setPayMethod(m.value)}
                style={{
                  padding: '12px', cursor: 'pointer', textAlign: 'center',
                  border: `3px solid ${payMethod === m.value ? S.blue : '#e0e0e0'}`,
                  background: payMethod === m.value
                    ? 'linear-gradient(180deg,#e3f2fd,#bbdefb)' : '#fff',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 900, color: S.blueDark, fontFamily: S.mono, letterSpacing: 1 }}>
                  [{m.code}]  {m.label}
                </div>
                {payMethod === m.value && (
                  <div style={{ fontSize: 9, color: S.blue, marginTop: 2 }}>● SELECTED</div>
                )}
              </div>
            ))}
          </div>

          {payMethod === 'cash' && (
            <div style={{ background: '#fffde7', border: '2px solid #f9a825', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: S.mono, fontWeight: 700, color: '#37474f', whiteSpace: 'nowrap' }}>
                  Cash Received (₹) :
                </span>
                <input
                  type="number" value={cashPaid}
                  onChange={e => setCashPaid(e.target.value)}
                  autoFocus
                  style={{
                    width: 160, border: `2px solid ${S.blue}`,
                    background: '#fff9c4', padding: '4px 8px',
                    fontSize: 16, fontFamily: S.mono, fontWeight: 900,
                    color: '#212121', outline: 'none', textAlign: 'right',
                  }}
                />
              </div>
              {cashPaid && parseFloat(cashPaid) >= cart.totalAmount && (
                <div style={{
                  marginTop: 8, background: '#e8f5e9', border: '1px solid #4caf50',
                  padding: '4px 10px', fontSize: 12, fontWeight: 700,
                  color: S.green, fontFamily: S.mono,
                }}>✓ Return Change : ₹ {change.toFixed(2)}</div>
              )}
              {cashPaid && parseFloat(cashPaid) < cart.totalAmount && (
                <div style={{
                  marginTop: 8, background: '#fff8e1', border: '1px solid #ffa000',
                  padding: '4px 10px', fontSize: 12, fontWeight: 700,
                  color: '#e65100', fontFamily: S.mono,
                }}>⚠ Short by ₹ {(cart.totalAmount - parseFloat(cashPaid)).toFixed(2)}</div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions style={{
          background: '#e8eaf6', borderTop: `2px solid #90caf9`,
          padding: '8px 16px', gap: 8,
        }}>
          <Btn variant="red" onClick={() => setPayDialog(false)}>✕ CANCEL [ESC]</Btn>
          <Btn
            variant="green" onClick={handlePay}
            disabled={paying || (payMethod === 'cash' && (!cashPaid || parseFloat(cashPaid) < cart.totalAmount))}
          >
            {paying ? 'PROCESSING…' : '✓ CONFIRM PAYMENT [F10]'}
          </Btn>
        </DialogActions>
      </Dialog>

      {/* ══ SUCCESS DIALOG ══ */}
      <Dialog open={doneOpen} onClose={() => setDoneOpen(false)}
        maxWidth="xs" fullWidth
        PaperProps={{ style: { border: '3px solid #2e7d32', borderRadius: 0 } }}>
        <DialogTitle style={{
          background: 'linear-gradient(180deg,#43a047,#2e7d32)',
          color: '#fff', fontFamily: S.mono, fontSize: 13, fontWeight: 900,
          padding: '8px 16px', borderBottom: '2px solid #1b5e20',
        }}>
          ✓ PAYMENT SUCCESSFUL — Bill #{doneBill?.billNumber}
        </DialogTitle>
        <DialogContent style={{ background: '#f9fafb', padding: 16 }}>
          {doneBill && (
            <>
              <div style={{ display: 'none' }}>
                <BillReceipt ref={receiptRef} bill={doneBill} />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { l: 'Items',           v: doneBill.items?.length },
                    { l: 'Total Amount',    v: `₹ ${doneBill.totalAmount?.toFixed(2)}` },
                    { l: 'Total Saved',     v: `₹ ${doneBill.totalDiscount?.toFixed(2)}`, green: true },
                    { l: 'Payment Mode',    v: doneBill.paymentMethod?.toUpperCase() },
                    ...(doneBill.changeReturned > 0
                      ? [{ l: 'Change Returned', v: `₹ ${doneBill.changeReturned?.toFixed(2)}` }] : []),
                  ].map(({ l, v, green }) => (
                    <tr key={l} style={{ borderBottom: '1px solid #e8eaf6' }}>
                      <td style={{ fontSize: 11, padding: '4px 8px', color: '#546e7a', fontFamily: S.mono }}>{l}</td>
                      <td style={{
                        fontSize: 12, padding: '4px 8px', textAlign: 'right',
                        fontWeight: 700, color: green ? S.green : S.blue, fontFamily: S.mono,
                      }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </DialogContent>
        <DialogActions style={{ background: '#e8f5e9', borderTop: '2px solid #4caf50', padding: '8px 16px', gap: 8 }}>
          <Btn onClick={handlePrint}>🖨 PRINT RECEIPT</Btn>
          <Btn variant="green" onClick={() => { setDoneOpen(false); setDoneBill(null); barcodeRef.current?.focus(); }}>
            ⬛ NEW BILL
          </Btn>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snack} autoHideDuration={1800} onClose={() => setSnack('')}
        message={<span style={{ fontFamily: S.mono, fontSize: 12 }}>{snack}</span>}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        ContentProps={{
          style: {
            background: snack?.startsWith('ERROR') ? S.red : S.blue,
            fontFamily: S.mono, fontSize: 12, fontWeight: 700,
          },
        }}
      />
    </div>
  );
}