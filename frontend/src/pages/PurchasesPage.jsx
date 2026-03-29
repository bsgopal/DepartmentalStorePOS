import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  DeleteRounded,
  InventoryRounded,
  ReceiptLongRounded,
  SaveRounded,
  SearchRounded,
} from '@mui/icons-material';
import { createPurchase, getCategories, getPurchases, getSuppliers } from '../api';

const makeItem = () => ({
  barcode: '',
  name: '',
  brand: '',
  categoryId: '',
  unit: 'pcs',
  quantity: 1,
  purchasePrice: 0,
  mrp: 0,
  sellingPrice: 0,
  gstPercent: 5,
  lowStockThreshold: 10,
});

const units = ['pcs', 'kg', 'g', 'L', 'ml', 'pack'];
const gstRates = [0, 5, 12, 18, 28];

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([makeItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMaster = useCallback(async () => {
    const [supRes, catRes] = await Promise.all([
      getSuppliers({ limit: 100, active: true }),
      getCategories(),
    ]);
    setSuppliers(supRes.data.suppliers || []);
    setCategories(catRes.data.categories || []);
  }, []);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    getPurchases({ limit: 20, invoiceNumber: historySearch })
      .then((res) => setHistory(res.data.purchases || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [historySearch]);

  useEffect(() => {
    loadMaster().catch(() => {});
    loadHistory();
  }, [loadMaster, loadHistory]);

  const totals = useMemo(() => {
    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const totalAmount = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.purchasePrice || 0), 0);
    return { totalQty, totalAmount: Number(totalAmount.toFixed(2)) };
  }, [items]);

  const updateItem = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  const addRow = () => setItems((prev) => [...prev, makeItem()]);
  const removeRow = (idx) => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const resetForm = () => {
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setItems([makeItem()]);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!supplierId) {
      setError('Supplier is required');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required');
      return;
    }

    const cleaned = items
      .filter((it) => String(it.barcode || '').trim() && String(it.name || '').trim())
      .map((it) => ({
        ...it,
        barcode: String(it.barcode || '').trim(),
        name: String(it.name || '').trim(),
        quantity: Number(it.quantity || 0),
        purchasePrice: Number(it.purchasePrice || 0),
        mrp: Number(it.mrp || 0),
        sellingPrice: Number(it.sellingPrice || 0),
        gstPercent: Number(it.gstPercent || 0),
        lowStockThreshold: Number(it.lowStockThreshold || 10),
      }));

    if (!cleaned.length) {
      setError('At least one valid item row is required');
      return;
    }

    const invalid = cleaned.find((it) => !it.categoryId || it.quantity <= 0 || it.purchasePrice < 0 || it.mrp < 0 || it.sellingPrice < 0);
    if (invalid) {
      setError('Each row must include category and valid quantity/prices');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPurchase({
        supplierId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        notes,
        items: cleaned,
      });
      setSuccess(`Purchase posted: ${res.data.purchase.purchaseNumber}`);
      resetForm();
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <InventoryRounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Purchase Entry</Typography>
        <Chip label={`Rows: ${items.length}`} size="small" />
        <Chip label={`Qty: ${totals.totalQty}`} size="small" color="info" />
        <Chip label={`Total: Rs. ${totals.totalAmount.toFixed(2)}`} size="small" color="success" />
      </Box>

      <Box sx={{ p: 2, display: 'grid', gap: 2, gridTemplateRows: 'auto auto 1fr' }}>
        <Paper sx={{ p: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <TextField
                select
                fullWidth
                label="Supplier *"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                {suppliers.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label="Supplier Invoice No *" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </Grid>
            <Grid item xs={2}>
              <TextField fullWidth label="Invoice Date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography fontWeight={700}>Items</Typography>
            <Button size="small" startIcon={<AddRounded />} onClick={addRow}>Add Row</Button>
          </Box>
          <TableContainer sx={{ maxHeight: 340 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Barcode', 'Name', 'Brand', 'Category', 'Unit', 'Qty', 'Buy', 'MRP', 'Sell', 'GST', 'Action'].map((h) => <TableCell key={h}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField size="small" value={row.barcode} onChange={(e) => updateItem(idx, 'barcode', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <TextField size="small" value={row.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField size="small" value={row.brand} onChange={(e) => updateItem(idx, 'brand', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <Select size="small" value={row.categoryId} onChange={(e) => updateItem(idx, 'categoryId', e.target.value)} sx={{ width: '100%' }}>
                        {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ minWidth: 90 }}>
                      <Select size="small" value={row.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} sx={{ width: '100%' }}>
                        {units.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ minWidth: 70 }}>
                      <TextField size="small" type="number" value={row.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 90 }}>
                      <TextField size="small" type="number" value={row.purchasePrice} onChange={(e) => updateItem(idx, 'purchasePrice', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 90 }}>
                      <TextField size="small" type="number" value={row.mrp} onChange={(e) => updateItem(idx, 'mrp', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 90 }}>
                      <TextField size="small" type="number" value={row.sellingPrice} onChange={(e) => updateItem(idx, 'sellingPrice', e.target.value)} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 80 }}>
                      <Select size="small" value={row.gstPercent} onChange={(e) => updateItem(idx, 'gstPercent', e.target.value)} sx={{ width: '100%' }}>
                        {gstRates.map((g) => <MenuItem key={g} value={g}>{g}%</MenuItem>)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeRow(idx)}>
                        <DeleteRounded sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontSize={13} color="text.secondary">
              Total Qty: <b>{totals.totalQty}</b> | Total Amount: <b>Rs. {totals.totalAmount.toFixed(2)}</b>
            </Typography>
            <Button variant="contained" startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Purchase'}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 1.5, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ReceiptLongRounded color="secondary" />
            <Typography fontWeight={700} flex={1}>Recent Purchases</Typography>
            <TextField
              size="small"
              placeholder="Search invoice..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
            <Button size="small" onClick={loadHistory}>Refresh</Button>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['PO No', 'Invoice', 'Supplier', 'Date', 'Items', 'Amount'].map((h) => <TableCell key={h}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
                ) : history.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No purchases found</TableCell></TableRow>
                ) : history.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.purchaseNumber}</TableCell>
                    <TableCell>{p.invoiceNumber}</TableCell>
                    <TableCell>{p.supplierName}</TableCell>
                    <TableCell>{new Date(p.invoiceDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>{p.items?.length || 0}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rs. {Number(p.totalAmount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
