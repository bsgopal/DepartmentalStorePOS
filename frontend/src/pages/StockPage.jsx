import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Alert,
  CircularProgress, InputAdornment, Avatar, IconButton, Tooltip,
  MenuItem, Select, FormControl, InputLabel, LinearProgress, Card,
  CardContent, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Inventory2Rounded, SearchRounded, WarningAmberRounded,
  TrendingDownRounded, AddRounded, RemoveRounded, EditRounded,
  CheckCircleRounded, ErrorRounded, RefreshRounded,
} from '@mui/icons-material';
import api from '../api';

const getStock     = (params) => api.get('/stock', { params });
const getStockSummary = ()   => api.get('/stock/summary');
const getLowStock  = ()      => api.get('/stock/low-stock');
const adjustStock  = (id, data) => api.patch(`/stock/${id}/adjust`, data);

const STATUS_COLOR = {
  ok:  { color: '#059669', bg: '#ecfdf5', label: 'In Stock' },
  low: { color: '#d97706', bg: '#fffbeb', label: 'Low Stock' },
  out: { color: '#dc2626', bg: '#fef2f2', label: 'Out of Stock' },
};

function getStockStatus(product) {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.lowStockThreshold) return 'low';
  return 'ok';
}

function StockBar({ stock, threshold }) {
  const pct = threshold > 0 ? Math.min(100, (stock / (threshold * 3)) * 100) : 100;
  const color = stock === 0 ? '#dc2626' : stock <= threshold ? '#d97706' : '#059669';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
      <LinearProgress
        variant="determinate" value={pct}
        sx={{
          flex: 1, height: 6, borderRadius: 3,
          bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography fontSize={12} fontWeight={700} color={color} minWidth={28}>
        {stock}
      </Typography>
    </Box>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg, suffix }) {
  return (
    <Card sx={{ flex: 1, borderRadius: 2, border: `1px solid ${color}22` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '14px !important' }}>
        <Box sx={{ p: 1.2, bgcolor: bg, borderRadius: 2 }}>
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography fontSize={11} color="text.secondary" fontWeight={500}>{label}</Typography>
          <Typography fontSize={20} fontWeight={800} color={color} lineHeight={1.2}>
            {suffix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function AdjustDialog({ open, onClose, product, onAdjusted }) {
  const [type, setType]     = useState('add');
  const [qty, setQty]       = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { if (open) { setType('add'); setQty(''); setReason(''); setError(''); } }, [open]);

  const handleSave = async () => {
    if (!qty || isNaN(qty) || Number(qty) < 0) { setError('Enter a valid quantity'); return; }
    setSaving(true); setError('');
    try {
      await adjustStock(product._id, { type, quantity: Number(qty), reason });
      onAdjusted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Adjustment failed');
    } finally { setSaving(false); }
  };

  const preview = () => {
    if (!qty || isNaN(qty)) return product?.stock ?? 0;
    const q = Number(qty);
    if (type === 'add')    return (product?.stock ?? 0) + q;
    if (type === 'remove') return Math.max(0, (product?.stock ?? 0) - q);
    if (type === 'set')    return q;
    return 0;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1757 100%)', px: 3, py: 2.5 }}>
        <Typography variant="h6" color="white" fontWeight={700}>Adjust Stock</Typography>
        {product && (
          <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.65)' }}>
            {product.name} · Current: <b>{product.stock}</b> {product.unit}
          </Typography>
        )}
      </Box>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Adjustment Type</InputLabel>
              <Select value={type} label="Adjustment Type" onChange={(e) => setType(e.target.value)}>
                <MenuItem value="add"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><AddRounded fontSize="small" color="success" /> Add Stock (Goods Received)</Box></MenuItem>
                <MenuItem value="remove"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><RemoveRounded fontSize="small" color="error" /> Remove Stock (Damaged/Expired)</Box></MenuItem>
                <MenuItem value="set"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><EditRounded fontSize="small" color="warning" /> Set Exact Stock (Physical Count)</Box></MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Quantity" type="number" size="small"
              value={qty} onChange={(e) => setQty(e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Reason (optional)" size="small" multiline rows={2}
              value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received from supplier, Damaged goods write-off..."
            />
          </Grid>
          {qty && !isNaN(qty) && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: '#f8f9fa', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontSize={13} color="text.secondary">New Stock Level</Typography>
                <Typography fontSize={18} fontWeight={800} color={preview() === 0 ? 'error.main' : preview() <= (product?.lowStockThreshold || 10) ? 'warning.main' : 'success.main'}>
                  {preview()} {product?.unit}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
          {saving ? 'Saving…' : 'Apply Adjustment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function StockPage() {
  const [products, setProducts]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [adjustTarget, setAdjust] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    Promise.all([getStock(params), getStockSummary()])
      .then(([stockRes, sumRes]) => {
        setProducts(stockRes.data.products);
        setSummary(sumRes.data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ p: 1, bgcolor: '#1a237e12', borderRadius: 2 }}>
            <Inventory2Rounded sx={{ color: 'secondary.main', fontSize: 22 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} flex={1}>Stock Management</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={load} size="small"><RefreshRounded /></IconButton>
          </Tooltip>
        </Box>
        {/* Summary cards */}
        {summary && (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <SummaryCard label="Total Products"  value={summary.totalProducts} icon={Inventory2Rounded}   color="#1a237e" bg="#e8eaf6" />
            <SummaryCard label="Low Stock"        value={summary.lowStock}      icon={WarningAmberRounded} color="#d97706" bg="#fffbeb" />
            <SummaryCard label="Out of Stock"     value={summary.outOfStock}    icon={ErrorRounded}        color="#dc2626" bg="#fef2f2" />
            <SummaryCard label="Stock Value"      value={summary.stockValue}    icon={TrendingDownRounded} color="#059669" bg="#ecfdf5" suffix="₹" />
          </Box>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ bgcolor: 'white', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by name or barcode…" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
        <ToggleButtonGroup size="small" exclusive value={statusFilter} onChange={(_, v) => setStatus(v ?? '')}>
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="ok"  sx={{ color: '#059669' }}>In Stock</ToggleButton>
          <ToggleButton value="low" sx={{ color: '#d97706' }}>Low Stock</ToggleButton>
          <ToggleButton value="out" sx={{ color: '#dc2626' }}>Out of Stock</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Low stock banner */}
      {summary?.lowStock > 0 && !statusFilter && (
        <Box sx={{ mx: 2, mt: 1.5 }}>
          <Alert
            severity="warning" icon={<WarningAmberRounded />}
            action={<Button size="small" color="warning" onClick={() => setStatus('low')}>View All</Button>}
            sx={{ borderRadius: 2 }}
          >
            <strong>{summary.lowStock} product{summary.lowStock > 1 ? 's are' : ' is'} running low on stock</strong>
            {summary.outOfStock > 0 && ` · ${summary.outOfStock} out of stock`}
          </Alert>
        </Box>
      )}

      {/* Table */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', overflow: 'auto', borderRadius: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {['Product', 'Barcode', 'Category', 'Unit', 'Stock Level', 'Threshold', 'Status', 'Stock Value', 'Actions'].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>No products found</TableCell></TableRow>
              ) : products.map((p) => {
                const status = getStockStatus(p);
                const s = STATUS_COLOR[status];
                return (
                  <TableRow key={p._id} hover sx={{ bgcolor: status === 'out' ? '#fff5f5' : status === 'low' ? '#fffdf5' : 'inherit' }}>
                    <TableCell>
                      <Box>
                        <Typography fontSize={13} fontWeight={700}>{p.name}</Typography>
                        {p.brand && <Typography fontSize={11} color="text.secondary">{p.brand}</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={12} fontFamily="monospace">{p.barcode}</Typography></TableCell>
                    <TableCell>
                      <Chip label={p.category?.name || '—'} size="small" sx={{ fontSize: 11, height: 20 }} />
                    </TableCell>
                    <TableCell><Typography fontSize={12}>{p.unit}</Typography></TableCell>
                    <TableCell><StockBar stock={p.stock} threshold={p.lowStockThreshold} /></TableCell>
                    <TableCell><Typography fontSize={12} color="text.secondary">{p.lowStockThreshold}</Typography></TableCell>
                    <TableCell>
                      <Chip label={s.label} size="small"
                        sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 10, border: `1px solid ${s.color}33` }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} fontWeight={600} color="text.secondary">
                        ₹{(p.stock * p.sellingPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Adjust Stock">
                        <IconButton size="small" color="secondary" onClick={() => setAdjust(p)}>
                          <EditRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <AdjustDialog
        open={!!adjustTarget} product={adjustTarget}
        onClose={() => setAdjust(null)} onAdjusted={load}
      />
    </Box>
  );
}