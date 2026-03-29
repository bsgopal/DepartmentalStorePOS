import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  Select, FormControl, InputLabel, Alert, CircularProgress, Tooltip, TablePagination,
} from '@mui/material';
import {
  AddRounded, SearchRounded, EditRounded, DeleteRounded,
  Inventory2Rounded, WarningAmberRounded,
} from '@mui/icons-material';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api';
import { useAuth } from '../context/AuthContext';

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack'];
const GST_RATES = [0, 5, 12, 18, 28];

const emptyForm = {
  barcode: '', name: '', brand: '', category: '', mrp: '', sellingPrice: '',
  unit: 'pcs', gstPercent: 5, stock: 0, lowStockThreshold: 10, hsnCode: '',
};

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getProducts({ search, page: page + 1, limit: rowsPerPage })
      .then((r) => { setProducts(r.data.products); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page, rowsPerPage]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getCategories().then((r) => setCategories(r.data.categories)).catch(() => {}); }, []);

  const openAdd = () => { setEditProduct(null); setForm(emptyForm); setError(''); setDialog(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      barcode: p.barcode, name: p.name, brand: p.brand || '',
      category: p.category?._id || '', mrp: p.mrp, sellingPrice: p.sellingPrice,
      unit: p.unit, gstPercent: p.gstPercent, stock: p.stock,
      lowStockThreshold: p.lowStockThreshold, hsnCode: p.hsnCode || '',
    });
    setError('');
    setDialog(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, mrp: +form.mrp, sellingPrice: +form.sellingPrice, stock: +form.stock };
      if (editProduct) await updateProduct(editProduct._id, payload);
      else await createProduct(payload);
      setDialog(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await deleteProduct(id);
    load();
  };

  const discountPct = (mrp, sp) => mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Inventory2Rounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Products</Typography>
        <TextField
          size="small" placeholder="Search products…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
        {isAdmin && (
          <Button variant="contained" color="primary" startIcon={<AddRounded />} onClick={openAdd}>
            Add Product
          </Button>
        )}
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Barcode', 'Product', 'Category', 'MRP', 'Price', 'Discount', 'GST', 'Stock', 'Actions'].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={32} /></TableCell></TableRow>
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No products found</TableCell></TableRow>
                ) : products.map((p) => {
                  const disc = discountPct(p.mrp, p.sellingPrice);
                  const lowStock = p.stock <= p.lowStockThreshold;
                  return (
                    <TableRow key={p._id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{p.barcode}</TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={600}>{p.name}</Typography>
                        <Typography fontSize={11} color="text.secondary">{p.brand}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.category?.name} size="small" sx={{ fontSize: 10 }} />
                      </TableCell>
                      <TableCell>₹{p.mrp}</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>₹{p.sellingPrice}</TableCell>
                      <TableCell>
                        {disc > 0 && <Chip label={`${disc}%`} size="small" color="success" sx={{ fontSize: 10 }} />}
                      </TableCell>
                      <TableCell>{p.gstPercent}%</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {lowStock && <WarningAmberRounded sx={{ fontSize: 14, color: 'warning.main' }} />}
                          <Typography fontSize={12} color={lowStock ? 'warning.main' : 'inherit'} fontWeight={lowStock ? 700 : 400}>
                            {p.stock} {p.unit}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {isAdmin && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEdit(p)} color="secondary">
                                  <EditRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDelete(p._id)} color="error">
                                  <DeleteRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={total} page={page} rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[20]}
          />
        </Paper>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {[
              { label: 'Barcode *', key: 'barcode', xs: 6 },
              { label: 'HSN Code', key: 'hsnCode', xs: 6 },
              { label: 'Product Name *', key: 'name', xs: 12 },
              { label: 'Brand', key: 'brand', xs: 6 },
            ].map(({ label, key, xs }) => (
              <Grid item xs={xs} key={key}>
                <TextField fullWidth label={label} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Category *</InputLabel>
                <Select value={form.category} label="Category *" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.icon} {c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {[
              { label: 'MRP (₹) *', key: 'mrp', xs: 4, type: 'number' },
              { label: 'Selling Price (₹) *', key: 'sellingPrice', xs: 4, type: 'number' },
              { label: 'Stock', key: 'stock', xs: 4, type: 'number' },
            ].map(({ label, key, xs, type }) => (
              <Grid item xs={xs} key={key}>
                <TextField fullWidth label={label} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </Grid>
            ))}
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Unit</InputLabel>
                <Select value={form.unit} label="Unit" onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>GST %</InputLabel>
                <Select value={form.gstPercent} label="GST %" onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}>
                  {GST_RATES.map((r) => <MenuItem key={r} value={r}>{r}%</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
