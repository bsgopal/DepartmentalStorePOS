import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from '@mui/material';
import { useReactToPrint } from 'react-to-print';
import { createBill, getCustomers, getProductByBarcode, getProducts } from '../api';
import BillReceipt from '../components/BillReceipt';
import SplitPaymentDialog from '../components/SplitPaymentDialog';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const fmtDate = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const money = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const C = {
  page: '#cfd4dc',
  lineBlue: '#7b8fb3',
  barBlue: '#4f6b9a',
  barBlueDark: '#3f5b88',
  panelBg: '#e6e9ef',
  panelBorder: '#9aa8c0',
  tableHead: '#6a84b5',
  tableHeadText: '#fff',
  tableRow: '#ffffff',
  tableRowAlt: '#f7f9fd',
  tableRowSel: '#d8e8ff',
  accent: '#294f95',
  good: '#256b43',
  danger: '#8f2b2b',
  subtle: '#616f84',
  mono: "'Tahoma', 'Segoe UI', sans-serif",
};

const fieldWrap = (width) => ({ display: 'flex', flexDirection: 'column', width });

const labelStyle = {
  fontFamily: C.mono,
  fontSize: 10,
  color: '#40566f',
  marginBottom: 2,
  fontWeight: 700,
};

const inputStyle = {
  border: `1px solid ${C.lineBlue}`,
  background: '#fff',
  height: 28,
  padding: '0 8px',
  fontFamily: C.mono,
  fontSize: 13,
  outline: 'none',
};

const readonlyStyle = {
  ...inputStyle,
  background: '#f6f8fc',
  color: '#24364f',
};

const th = (w, right = false, center = false) => ({
  width: w,
  textAlign: right ? 'right' : center ? 'center' : 'left',
  borderRight: `1px solid ${C.panelBorder}`,
  padding: '4px 6px',
  background: C.tableHead,
  color: C.tableHeadText,
  fontFamily: C.mono,
  fontWeight: 700,
  fontSize: 11,
  whiteSpace: 'nowrap',
});

const td = (right = false, center = false) => ({
  textAlign: right ? 'right' : center ? 'center' : 'left',
  borderRight: `1px solid #d7e0ef`,
  borderBottom: `1px solid #d7e0ef`,
  padding: '4px 6px',
  fontFamily: C.mono,
  fontSize: 11,
  color: '#253449',
  whiteSpace: 'nowrap',
});

export default function BillingPage() {
  const { user } = useAuth();
  const cart = useCart();

  const [clock, setClock] = useState(fmtTime());
  const [snack, setSnack] = useState('');

  const [barcode, setBarcode] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const [entryItem, setEntryItem] = useState(null);
  const [entryQty, setEntryQty] = useState('1');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [searchActiveIdx, setSearchActiveIdx] = useState(-1);

  const [custQuery, setCustQuery] = useState('');
  const [custOpts, setCustOpts] = useState([]);
  const [custDrop, setCustDrop] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);

  const [payDialog, setPayDialog] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const [completedBill, setCompletedBill] = useState(null);
  const [successDialog, setSuccessDialog] = useState(false);

  const barcodeRef = useRef(null);
  const qtyRef = useRef(null);
  const searchBoxRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const receiptRef = useRef(null);

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setClock(fmtTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!searchBoxRef.current?.contains(e.target)) {
        setShowSearchDrop(false);
        setSearchActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const term = searchTerm.trim();
    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchDrop(false);
      setSearchActiveIdx(-1);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await getProducts({ search: term, page: 1, limit: 12 });
        const products = res?.data?.products || [];
        setSearchResults(products);
        setShowSearchDrop(true);
        setSearchActiveIdx(products.length ? 0 : -1);
      } catch (err) {
        setSearchResults([]);
        setShowSearchDrop(true);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (custQuery.trim().length < 3) {
      setCustOpts([]);
      setCustDrop(false);
      return;
    }

    getCustomers({ phone: custQuery.trim() })
      .then((r) => {
        setCustOpts(r?.data?.customers || []);
        setCustDrop(true);
      })
      .catch(() => {
        setCustOpts([]);
      });
  }, [custQuery]);

  const addItemToCart = (item, qty = 1) => {
    if (!item) return;
    const existing = cart.items.find((i) => i.productId === item._id);
    if (existing) {
      cart.updateQty(item._id, existing.quantity + qty);
    } else {
      for (let i = 0; i < qty; i += 1) cart.addItem(item);
    }
    setSnack(`Added: ${item.name}${qty > 1 ? ` x${qty}` : ''}`);
  };

  const chooseItem = (item, opts = {}) => {
    const { addImmediately = false } = opts;
    if (!item) return;

    setEntryItem(item);
    setEntryQty('1');
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchDrop(false);
    setSearchActiveIdx(-1);

    if (addImmediately) {
      addItemToCart(item, 1);
      setEntryItem(null);
      setEntryQty('1');
      setTimeout(() => barcodeRef.current?.focus(), 40);
      return;
    }

    setTimeout(() => qtyRef.current?.focus(), 50);
  };

  const onSearchKeyDown = (e) => {
    if (!showSearchDrop) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchActiveIdx((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchActiveIdx((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const idx = searchActiveIdx >= 0 ? searchActiveIdx : 0;
        chooseItem(searchResults[idx], { addImmediately: true });
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSearchDrop(false);
      setSearchActiveIdx(-1);
    }
  };

  const onBarcodeKeyDown = async (e) => {
    if (e.key !== 'Enter') return;

    const code = barcode.trim();
    if (!code) return;

    setLookingUp(true);
    try {
      const res = await getProductByBarcode(code);
      chooseItem(res?.data?.product);
      setBarcode('');
    } catch (err) {
      setSnack(`ERROR: Product not found for barcode ${code}`);
      setBarcode('');
    } finally {
      setLookingUp(false);
    }
  };

  const clearEntry = () => {
    setEntryItem(null);
    setEntryQty('1');
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchDrop(false);
    setSearchActiveIdx(-1);
    setTimeout(() => barcodeRef.current?.focus(), 40);
  };

  const resetAfterBill = (focusBarcode = false) => {
    setBarcode('');
    setEntryItem(null);
    setEntryQty('1');
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchDrop(false);
    setSearchActiveIdx(-1);
    setCustQuery('');
    setCustOpts([]);
    setCustDrop(false);
    setSelectedRow(null);

    if (focusBarcode) {
      setTimeout(() => barcodeRef.current?.focus(), 80);
    }
  };

  const addToCart = () => {
    if (!entryItem) return;

    const qty = Math.max(1, parseInt(entryQty, 10) || 1);
    addItemToCart(entryItem, qty);
    clearEntry();
  };

  const entryMrp = entryItem?.mrp ? Number(entryItem.mrp).toFixed(2) : '';
  const entryRate = entryItem?.sellingPrice ? Number(entryItem.sellingPrice).toFixed(2) : '';
  const entryDisc = entryItem?.mrp > 0
    ? (((entryItem.mrp - entryItem.sellingPrice) / entryItem.mrp) * 100).toFixed(1)
    : '';
  const entryGst = entryItem ? String(entryItem.gstPercent ?? entryItem.gstRate ?? 0) : '';
  const entryValue = entryItem
    ? (Number(entryItem.sellingPrice || 0) * (parseInt(entryQty, 10) || 1)).toFixed(2)
    : '';

  const lastItem = cart.items[cart.items.length - 1];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.page, fontFamily: C.mono, overflow: 'hidden' }}>
      <div style={{ background: `linear-gradient(180deg, ${C.barBlue} 0%, ${C.barBlueDark} 100%)`, color: '#fff', padding: '5px 10px', borderBottom: '1px solid #2a4269', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1 }}>RENIC</div>
        <div style={{ fontSize: 14, letterSpacing: 0.8, fontWeight: 700 }}>BILLING DEPARTMENT</div>
        <span style={{ color: '#9fc0f0' }}>|</span>
        <div style={{ fontSize: 13 }}>Sale Type: Cash Sale</div>
        <span style={{ color: '#9fc0f0' }}>|</span>
        <div style={{ fontSize: 13 }}>Cashier: {user?.name || 'OPERATOR'}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 12 }}>
          <div>Counter #{user?.counter || '1'}</div>
          <div>{fmtDate()}</div>
          <div style={{ background: '#143163', border: '1px solid #7da4df', padding: '1px 10px', fontWeight: 700 }}>{clock}</div>
        </div>
      </div>

      <div style={{ background: C.panelBg, borderBottom: `1px solid ${C.panelBorder}`, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#33475d' }}>Invoice Date:</div>
        <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{fmtDate()}</div>
        <div style={{ color: '#9cb0cb' }}>|</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#33475d' }}>Invoice No:</div>
        <div style={{ fontSize: 12, color: '#fff', background: C.accent, border: '1px solid #22457c', padding: '1px 10px', fontWeight: 700 }}>Automatic</div>
        <div style={{ color: '#9cb0cb' }}>|</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#33475d' }}>Customer:</div>

        <div style={{ position: 'relative' }}>
          <input
            value={custQuery}
            onChange={(e) => setCustQuery(e.target.value)}
            placeholder="Phone (min 3 digits)"
            style={{ ...inputStyle, width: 220, height: 26, background: '#fffbe6', border: '1px solid #e2b14a', fontSize: 12 }}
          />

          {custDrop && custOpts.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: 280, maxHeight: 220, overflowY: 'auto', background: '#fff', border: `1px solid ${C.lineBlue}`, zIndex: 40 }}>
              {custOpts.slice(0, 8).map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => {
                    cart.setCustomer(c);
                    setCustQuery('');
                    setCustOpts([]);
                    setCustDrop(false);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid #e4e9f4',
                    background: '#fff',
                    padding: '7px 8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: C.mono,
                    fontSize: 12,
                  }}
                >
                  <strong>{c.name}</strong> - {c.phone}
                </button>
              ))}
            </div>
          )}
        </div>

        {cart.customer && (
          <div style={{ fontSize: 12, color: C.good, fontWeight: 700 }}>
            {cart.customer.name}
            <button
              type="button"
              onClick={() => cart.setCustomer(null)}
              style={{ marginLeft: 6, border: 'none', background: 'none', color: C.danger, cursor: 'pointer', fontFamily: C.mono, fontWeight: 700 }}
            >
              x
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => cart.items.length && setPayDialog(true)}
          style={{ marginLeft: 'auto', border: `1px solid ${C.lineBlue}`, background: '#e8f0ff', color: C.accent, padding: '4px 10px', fontFamily: C.mono, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          F10: Payment Details
        </button>
      </div>

      <div style={{ borderBottom: `1px solid ${C.panelBorder}`, background: '#edf1f7', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={fieldWrap(210)}>
            <label style={labelStyle}>Barcode</label>
            <input
              ref={barcodeRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={onBarcodeKeyDown}
              placeholder="Scan and press Enter"
              style={{ ...inputStyle, background: '#fffde9' }}
            />
          </div>

          <div style={{ ...fieldWrap(260), position: 'relative' }} ref={searchBoxRef}>
            <label style={labelStyle}>Search Item</label>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchDrop(true);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Type item name"
              style={inputStyle}
            />

            {showSearchDrop && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, border: `1px solid ${C.lineBlue}`, background: '#fff', zIndex: 50, maxHeight: 230, overflowY: 'auto' }}>
                {searchLoading && <div style={{ padding: '8px 10px', fontSize: 12, color: C.subtle }}>Searching...</div>}
                {!searchLoading && searchResults.length === 0 && <div style={{ padding: '8px 10px', fontSize: 12, color: C.subtle }}>No items found</div>}

                {!searchLoading && searchResults.map((item, idx) => (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() => chooseItem(item, { addImmediately: true })}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #edf2fa',
                      background: idx === searchActiveIdx ? '#e7f0ff' : '#fff',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      fontFamily: C.mono,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: '#5f6f88' }}>{item.brand || '-'} | Rs. {money(item.sellingPrice)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={fieldWrap(230)}>
            <label style={labelStyle}>Item Name</label>
            <input readOnly value={entryItem?.name || ''} style={readonlyStyle} />
          </div>

          <div style={fieldWrap(130)}>
            <label style={labelStyle}>Brand</label>
            <input readOnly value={entryItem?.brand || ''} style={readonlyStyle} />
          </div>

          <div style={fieldWrap(90)}>
            <label style={labelStyle}>M.R.P</label>
            <input readOnly value={entryMrp} style={{ ...readonlyStyle, textAlign: 'right' }} />
          </div>

          <div style={fieldWrap(90)}>
            <label style={labelStyle}>Rate</label>
            <input readOnly value={entryRate} style={{ ...readonlyStyle, textAlign: 'right', color: C.accent, fontWeight: 700 }} />
          </div>

          <div style={fieldWrap(80)}>
            <label style={labelStyle}>Disc%</label>
            <input readOnly value={entryDisc} style={{ ...readonlyStyle, textAlign: 'right' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={fieldWrap(80)}>
            <label style={labelStyle}>GST%</label>
            <input readOnly value={entryGst} style={{ ...readonlyStyle, textAlign: 'right' }} />
          </div>

          <div style={fieldWrap(120)}>
            <label style={labelStyle}>Quantity</label>
            <input
              ref={qtyRef}
              value={entryQty}
              onChange={(e) => setEntryQty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToCart()}
              type="number"
              min={1}
              style={{ ...inputStyle, textAlign: 'center', fontWeight: 700, color: C.accent }}
            />
          </div>

          <div style={fieldWrap(120)}>
            <label style={labelStyle}>Value (Rs.)</label>
            <input readOnly value={entryValue} style={{ ...readonlyStyle, textAlign: 'right', color: C.good, fontWeight: 700 }} />
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={!entryItem}
            style={{ height: 29, minWidth: 100, border: '1px solid #5e7db0', background: entryItem ? '#7e97c1' : '#c9cfdb', color: '#fff', fontFamily: C.mono, fontWeight: 700, cursor: entryItem ? 'pointer' : 'not-allowed' }}
          >
            + ADD
          </button>

          <button
            type="button"
            onClick={clearEntry}
            style={{ height: 29, minWidth: 78, border: '1px solid #8a98af', background: '#dce3ef', color: '#2d3f58', fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }}
          >
            CLEAR
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <div style={{ border: '1px solid #b2c4e2', background: '#ebf4ff', padding: '3px 8px', minWidth: 118, textAlign: 'right', fontSize: 11 }}>
              Discount: Rs. {money(cart.totalDiscount)}
            </div>
            <div style={{ border: '1px solid #b2c4e2', background: '#ebf4ff', padding: '3px 8px', minWidth: 118, textAlign: 'right', fontSize: 11 }}>
              GST: Rs. {money(cart.totalGst)}
            </div>
            <div style={{ border: '1px solid #b2c4e2', background: '#ebf4ff', padding: '3px 8px', minWidth: 86, textAlign: 'right', fontSize: 11 }}>
              Items: {cart.totalItems}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#495c73' }}>
          <strong>Last Scanned Item:</strong> {lastItem ? `${lastItem.name} | Qty ${lastItem.quantity} | Rs. ${money(lastItem.sellingPrice)}` : '-'}
          {lookingUp ? <span style={{ marginLeft: 8, color: C.accent }}>(checking barcode...)</span> : null}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.panelBorder}`, background: '#fff' }}>
          <div style={{ borderBottom: `1px solid ${C.panelBorder}`, background: '#eff3fa', padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#344e73' }}>
            Item Details (F2)
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th style={th(45, false, true)}>Sl.</th>
                  <th style={th(120)}>Barcode</th>
                  <th style={th(undefined)}>Item Description</th>
                  <th style={th(130)}>Brand</th>
                  <th style={th(70, true)}>MRP</th>
                  <th style={th(70, true)}>Rate</th>
                  <th style={th(60, true)}>Disc%</th>
                  <th style={th(70, true)}>Qty</th>
                  <th style={th(95, true)}>Amount</th>
                  <th style={th(70, false, true)}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#8ea0ba', padding: '120px 20px', fontFamily: C.mono }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No items in current bill</div>
                      <div style={{ fontSize: 11 }}>Scan barcode or search product to add items one by one</div>
                    </td>
                  </tr>
                )}

                {cart.items.map((item, idx) => {
                  const isSel = selectedRow === idx;
                  const disc = item.mrp > 0 ? ((item.mrp - item.sellingPrice) * 100) / item.mrp : 0;
                  return (
                    <tr
                      key={item.productId}
                      onClick={() => setSelectedRow(idx)}
                      style={{ background: isSel ? C.tableRowSel : idx % 2 ? C.tableRowAlt : C.tableRow, cursor: 'pointer' }}
                    >
                      <td style={td(false, true)}>{idx + 1}</td>
                      <td style={td()}>{item.barcode || item.productId?.slice(-10)}</td>
                      <td style={td()}>{item.name}</td>
                      <td style={td()}>{item.brand || '-'}</td>
                      <td style={td(true)}>{money(item.mrp)}</td>
                      <td style={{ ...td(true), color: C.accent, fontWeight: 700 }}>{money(item.sellingPrice)}</td>
                      <td style={td(true)}>{disc > 0 ? disc.toFixed(1) : '0.0'}</td>
                      <td style={td(true)}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cart.updateQty(item.productId, item.quantity - 1);
                          }}
                          style={{ width: 20, height: 20, marginRight: 4, border: '1px solid #b74e4e', background: '#d97979', color: '#fff', cursor: 'pointer', lineHeight: '16px' }}
                        >
                          -
                        </button>
                        <span style={{ display: 'inline-block', minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cart.updateQty(item.productId, item.quantity + 1);
                          }}
                          style={{ width: 20, height: 20, marginLeft: 4, border: '1px solid #408251', background: '#66a677', color: '#fff', cursor: 'pointer', lineHeight: '16px' }}
                        >
                          +
                        </button>
                      </td>
                      <td style={{ ...td(true), fontWeight: 700 }}>{money(item.totalPrice)}</td>
                      <td style={td(false, true)}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            cart.removeItem(item.productId);
                          }}
                          style={{ border: '1px solid #bf4a4a', background: '#f3d1d1', color: '#8e1f1f', cursor: 'pointer', fontFamily: C.mono, padding: '1px 7px' }}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ width: 320, display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: `1px solid ${C.panelBorder}` }}>
          <div style={{ background: C.tableHead, color: '#fff', padding: '6px 8px', fontSize: 12, fontWeight: 700, borderBottom: `1px solid ${C.panelBorder}` }}>
            CURRENT BILL
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th(36, false, true)}>#</th>
                <th style={th(undefined)}>Item Description</th>
                <th style={th(60, true)}>Qty</th>
                <th style={th(90, true)}>Amount</th>
              </tr>
            </thead>
          </table>

          <div style={{ flex: 1, overflowY: 'auto', borderBottom: `1px solid ${C.panelBorder}` }}>
            {cart.items.length === 0 ? (
              <div style={{ padding: '36px 12px', textAlign: 'center', color: '#8ea0ba', fontSize: 12 }}>
                Cart is empty
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {cart.items.map((item, idx) => (
                    <tr key={item.productId} style={{ background: idx % 2 ? C.tableRowAlt : C.tableRow }}>
                      <td style={{ ...td(false, true), width: 36 }}>{idx + 1}</td>
                      <td style={td()}>{item.name}</td>
                      <td style={{ ...td(true), width: 60 }}>{item.quantity}</td>
                      <td style={{ ...td(true), width: 90, fontWeight: 700 }}>{money(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ background: '#f5f8ff' }}>
            {[
              ['Total Qty (Pcs)', String(cart.totalItems)],
              ['MRP Total (Rs.)', money(cart.totalMrp)],
              ['Total Discount', `Rs. ${money(cart.totalDiscount)}`],
              ['GST Incl. (Rs.)', money(cart.totalGst)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #d7e0ef', padding: '5px 10px', fontSize: 11 }}>
                <span style={{ color: '#4f6078' }}>{label}</span>
                <strong style={{ color: '#2d3f58' }}>{value}</strong>
              </div>
            ))}

            <div style={{ background: `linear-gradient(180deg, ${C.barBlue} 0%, ${C.barBlueDark} 100%)`, color: '#fff', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>TOTAL AMOUNT</span>
              <span style={{ fontSize: 28, fontWeight: 700 }}>{money(cart.totalAmount)}</span>
            </div>

            <div style={{ display: 'flex', gap: 6, padding: 8 }}>
              <button
                type="button"
                disabled={!cart.items.length}
                onClick={() => setPayDialog(true)}
                style={{
                  flex: 1,
                  height: 37,
                  border: '1px solid #2d6d3e',
                  background: cart.items.length ? '#4f9f66' : '#bcc7bd',
                  color: '#fff',
                  fontFamily: C.mono,
                  fontWeight: 700,
                  cursor: cart.items.length ? 'pointer' : 'not-allowed',
                }}
              >
                F10 PAYMENT
              </button>

              <button
                type="button"
                onClick={cart.clearCart}
                style={{ height: 37, border: '1px solid #9a4242', background: '#d77777', color: '#fff', fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }}
              >
                ESC
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#233447', borderTop: '1px solid #1a2736', padding: '4px 8px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          ['F1', 'Item Help'],
          ['F2', 'Item Detail'],
          ['F6', 'Add-On'],
          ['F8', 'Item Name'],
          ['F9', 'Rate Help'],
          ['F10', 'Payment'],
        ].map(([k, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ background: '#365072', color: '#ffd66e', border: '1px solid #4a678d', padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>{k}</span>
            <span style={{ color: '#9db2cd', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>

      <SplitPaymentDialog
        open={payDialog}
        onClose={() => setPayDialog(false)}
        totalAmount={cart.totalAmount}
        loading={paying}
        error={payError}
        onConfirm={async ({ paymentMethod, amountPaid, splitPayments }) => {
          setPaying(true);
          setPayError('');

          try {
            const res = await createBill({
              items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
              paymentMethod,
              amountPaid,
              splitPayments,
              customerPhone: cart.customer?.phone,
              customerName: cart.customer?.name,
            });

            setCompletedBill(res.data.bill);
            cart.clearCart();
            resetAfterBill(false);
            setPayDialog(false);
            setSuccessDialog(true);
          } catch (err) {
            setPayError(err.response?.data?.message || 'Payment failed');
          } finally {
            setPaying(false);
          }
        }}
      />

      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: 0, border: '2px solid #2f6b9f' } }}>
        <DialogTitle style={{ background: '#2f6b9f', color: '#fff', fontFamily: C.mono, fontSize: 15, fontWeight: 700 }}>
          Payment Successful - Bill #{completedBill?.billNumber}
        </DialogTitle>

        <DialogContent style={{ padding: 14 }}>
          {completedBill && (
            <>
              <div style={{ display: 'none' }}>
                <BillReceipt ref={receiptRef} bill={completedBill} />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.mono }}>
                <tbody>
                  {[
                    ['Items', completedBill.items?.length],
                    ['Total Amount', `Rs. ${money(completedBill.totalAmount)}`],
                    ['Amount Paid', `Rs. ${money(completedBill.amountPaid)}`],
                    ['Saved', `Rs. ${money(completedBill.totalDiscount)}`],
                    ['Payment Mode', String(completedBill.paymentMethod || '').toUpperCase()],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ padding: '5px 0', fontSize: 12, color: '#4f6078' }}>{k}</td>
                      <td style={{ padding: '5px 0', fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </DialogContent>

        <DialogActions style={{ padding: '8px 14px 12px', gap: 8 }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{ border: '1px solid #7f8ea7', background: '#dbe2ef', padding: '6px 12px', fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }}
          >
            Print Receipt
          </button>

          <button
            type="button"
            onClick={() => {
              setSuccessDialog(false);
              setCompletedBill(null);
              resetAfterBill(true);
            }}
            style={{ border: '1px solid #2d6d3e', background: '#4f9f66', color: '#fff', padding: '6px 12px', fontFamily: C.mono, fontWeight: 700, cursor: 'pointer' }}
          >
            New Bill
          </button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2200}
        onClose={() => setSnack('')}
        message={<span style={{ fontFamily: C.mono, fontSize: 12 }}>{snack}</span>}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        ContentProps={{ style: { fontFamily: C.mono, background: snack.startsWith('ERROR') ? '#9c2a2a' : '#2f5ca8' } }}
      />
    </div>
  );
}
