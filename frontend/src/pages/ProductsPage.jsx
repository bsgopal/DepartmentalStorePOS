import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  DeleteRounded,
  EditRounded,
  FileUploadRounded,
  Inventory2Rounded,
  SearchRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import {
  bulkImportProducts,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  getSuppliers,
  updateProduct,
} from '../api';
import { useAuth } from '../context/AuthContext';

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'pack'];
const GST_RATES = [0, 5, 12, 18, 28];

const emptyForm = {
  barcode: '',
  name: '',
  brand: '',
  category: '',
  supplier: '',
  purchasePrice: '',
  mrp: '',
  sellingPrice: '',
  unit: 'pcs',
  gstPercent: 5,
  stock: 0,
  lowStockThreshold: 10,
  hsnCode: '',
};

const csvTemplate = `barcode,name,brand,categoryName,mrp,sellingPrice,stock,gstPercent,unit,hsnCode\n8901491101845,Parle-G 100g,Parle,Biscuits,10,10,200,5,pcs,190531`;

function parseCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], error: 'CSV must include header + at least 1 row' };
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const vals = lines[i].split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] ?? '';
    });
    rows.push(row);
  }

  return { rows, error: '' };
}

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState(csvTemplate);
  const [importSupplier, setImportSupplier] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { search, page: page + 1, limit: rowsPerPage };
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (supplierFilter !== 'all') params.supplier = supplierFilter;

    getProducts(params)
      .then((r) => {
        setProducts(r.data.products || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, page, rowsPerPage, categoryFilter, supplierFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.categories || [])).catch(() => {});
    getSuppliers({ limit: 200, active: true }).then((r) => setSuppliers(r.data.suppliers || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setError('');
    setDialog(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      barcode: p.barcode || '',
      name: p.name || '',
      brand: p.brand || '',
      category: p.category?._id || '',
      supplier: p.supplier?._id || '',
      purchasePrice: p.purchasePrice ?? '',
      mrp: p.mrp ?? '',
      sellingPrice: p.sellingPrice ?? '',
      unit: p.unit || 'pcs',
      gstPercent: p.gstPercent ?? 5,
      stock: p.stock ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 10,
      hsnCode: p.hsnCode || '',
    });
    setError('');
    setDialog(true);
  };

  const validateProduct = () => {
    if (!String(form.barcode).trim()) return 'Barcode is required';
    if (!String(form.name).trim()) return 'Product name is required';
    if (!form.category) return 'Category is required';

    const mrp = Number(form.mrp);
    const sp = Number(form.sellingPrice);
    const stock = Number(form.stock);
    const purchasePrice = Number(form.purchasePrice || 0);

    if (Number.isNaN(mrp) || mrp < 0) return 'MRP must be valid';
    if (Number.isNaN(sp) || sp < 0) return 'Selling price must be valid';
    if (sp > mrp) return 'Selling price cannot be greater than MRP';
    if (Number.isNaN(stock) || stock < 0) return 'Stock cannot be negative';
    if (Number.isNaN(purchasePrice) || purchasePrice < 0) return 'Purchase price cannot be negative';

    return '';
  };

  const handleSave = async () => {
    const validation = validateProduct();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        barcode: String(form.barcode).trim(),
        name: String(form.name).trim(),
        brand: String(form.brand || '').trim(),
        purchasePrice: Number(form.purchasePrice || 0),
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 10),
        gstPercent: Number(form.gstPercent || 0),
      };

      if (!payload.supplier) delete payload.supplier;

      if (editProduct) await updateProduct(editProduct._id, payload);
      else await createProduct(payload);

      setDialog(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await deleteProduct(id);
    load();
  };

  const discountPct = (mrp, sp) => (mrp > 0 ? Math.round(((mrp - sp) / mrp) * 100) : 0);

  const handleBulkImport = async () => {
    setImportError('');
    setImportSummary(null);

    const parsed = parseCsv(importText);
    if (parsed.error) {
      setImportError(parsed.error);
      return;
    }

    const rows = parsed.rows.map((r) => ({
      barcode: r.barcode,
      name: r.name,
      brand: r.brand,
      categoryName: r.categoryName,
      mrp: Number(r.mrp || 0),
      sellingPrice: Number(r.sellingPrice || 0),
      stock: Number(r.stock || 0),
      gstPercent: Number(r.gstPercent || 5),
      unit: r.unit || 'pcs',
      hsnCode: r.hsnCode || '',
      purchasePrice: Number(r.purchasePrice || 0),
      lowStockThreshold: Number(r.lowStockThreshold || 10),
    }));

    setImporting(true);
    try {
      const res = await bulkImportProducts(rows, importSupplier || undefined);
      setImportSummary(res.data.summary);
      if (!res.data.summary.failed) {
        load();
      } else {
        const firstErr = res.data.errors?.[0]?.message || 'Some rows failed';
        setImportError(firstErr);
        load();
      }
    } catch (err) {
      setImportError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= p.lowStockThreshold).length, [products]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Inventory2Rounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700}>Products</Typography>
        <Chip label={`Low Stock: ${lowStockCount}`} size="small" color={lowStockCount ? 'warning' : 'default'} />

        <TextField
          size="small"
          placeholder="Search by name/brand/barcode..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260, ml: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value="all">All</MenuItem>
            {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Supplier</InputLabel>
          <Select
            value={supplierFilter}
            label="Supplier"
            onChange={(e) => { setSupplierFilter(e.target.value); setPage(0); }}
          >
            <MenuItem value="all">All</MenuItem>
            {suppliers.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>

        {isAdmin && (
          <>
            <Button variant="outlined" startIcon={<FileUploadRounded />} onClick={() => setImportOpen(true)}>
              Bulk Import
            </Button>
            <Button variant="contained" color="primary" startIcon={<AddRounded />} onClick={openAdd}>
              Add Product
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Barcode', 'Product', 'Category', 'Supplier', 'MRP', 'Price', 'GST', 'Stock', 'Actions'].map((h) => (
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
                        <Typography fontSize={11} color="text.secondary">{p.brand || '-'}</Typography>
                      </TableCell>
                      <TableCell><Chip label={p.category?.name || '-'} size="small" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell><Typography fontSize={12}>{p.supplier?.name || '-'}</Typography></TableCell>
                      <TableCell>Rs. {Number(p.mrp || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>
                        Rs. {Number(p.sellingPrice || 0).toFixed(2)}
                        {disc > 0 && <Chip label={`${disc}% OFF`} size="small" color="success" sx={{ ml: 1, fontSize: 9 }} />}
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
                        {isAdmin && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(p)} color="secondary">
                                <EditRounded sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deactivate">
                              <IconButton size="small" onClick={() => handleDelete(p._id)} color="error">
                                <DeleteRounded sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPageOptions={[20]}
          />
        </Paper>
      </Box>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={3}><TextField fullWidth label="Barcode *" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth label="HSN Code" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select value={form.category} label="Category *" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select value={form.supplier} label="Supplier" onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {suppliers.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={3}><TextField fullWidth type="number" label="Purchase Price" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth type="number" label="MRP *" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth type="number" label="Selling Price *" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth type="number" label="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select value={form.unit} label="Unit" onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>GST %</InputLabel>
                <Select value={form.gstPercent} label="GST %" onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}>
                  {GST_RATES.map((g) => <MenuItem key={g} value={g}>{g}%</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField fullWidth type="number" label="Low Stock Threshold" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Bulk Import Products (CSV Paste)</DialogTitle>
        <DialogContent dividers>
          {importError && <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>}
          {importSummary && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Imported. Created: {importSummary.created}, Updated: {importSummary.updated}, Failed: {importSummary.failed}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Default Supplier</InputLabel>
                <Select value={importSupplier} label="Default Supplier" onChange={(e) => setImportSupplier(e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {suppliers.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <Typography fontSize={12} color="text.secondary" sx={{ mt: 1 }}>
                Headers supported: barcode, name, brand, categoryName, mrp, sellingPrice, stock, gstPercent, unit, hsnCode, purchasePrice, lowStockThreshold
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={10}
                label="Paste CSV"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleBulkImport} disabled={importing} startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <FileUploadRounded />}>
            {importing ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
