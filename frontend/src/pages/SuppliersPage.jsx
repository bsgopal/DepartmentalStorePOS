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
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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
  SearchRounded,
  StoreRounded,
} from '@mui/icons-material';
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from '../api';

const emptyForm = {
  name: '',
  code: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstin: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
  paymentTermsDays: 0,
  openingBalance: 0,
  notes: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getSuppliers({ page: page + 1, limit: rowsPerPage, search })
      .then((res) => {
        setSuppliers(res.data.suppliers || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || '',
      code: supplier.code || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      addressLine1: supplier.addressLine1 || '',
      city: supplier.city || '',
      state: supplier.state || '',
      pincode: supplier.pincode || '',
      paymentTermsDays: supplier.paymentTermsDays || 0,
      openingBalance: supplier.openingBalance || 0,
      notes: supplier.notes || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        paymentTermsDays: Number(form.paymentTermsDays || 0),
        openingBalance: Number(form.openingBalance || 0),
      };

      if (editing) await updateSupplier(editing._id, payload);
      else await createSupplier(payload);
      setDialogOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Deactivate supplier "${supplier.name}"?`)) return;
    await deleteSupplier(supplier._id);
    load();
  };

  const activeCount = useMemo(() => suppliers.filter((s) => s.isActive).length, [suppliers]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <StoreRounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Suppliers</Typography>
        <Chip label={`Active: ${activeCount}`} size="small" color="success" />
        <TextField
          size="small"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
        <Button variant="contained" startIcon={<AddRounded />} onClick={openCreate}>
          Add Supplier
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Name', 'Code', 'Contact', 'GSTIN', 'City', 'Terms', 'Status', 'Actions'].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : suppliers.map((s) => (
                  <TableRow key={s._id} hover>
                    <TableCell>
                      <Typography fontSize={13} fontWeight={700}>{s.name}</Typography>
                      <Typography fontSize={11} color="text.secondary">{s.contactPerson || '-'}</Typography>
                    </TableCell>
                    <TableCell>{s.code || '-'}</TableCell>
                    <TableCell>
                      <Typography fontSize={12}>{s.phone || '-'}</Typography>
                      <Typography fontSize={11} color="text.secondary">{s.email || '-'}</Typography>
                    </TableCell>
                    <TableCell>{s.gstin || '-'}</TableCell>
                    <TableCell>{s.city || '-'}</TableCell>
                    <TableCell>{s.paymentTermsDays || 0} days</TableCell>
                    <TableCell>
                      <Chip label={s.isActive ? 'ACTIVE' : 'INACTIVE'} color={s.isActive ? 'success' : 'default'} size="small" sx={{ fontSize: 10 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(s)} color="secondary">
                          <EditRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deactivate">
                        <IconButton size="small" onClick={() => handleDelete(s)} color="error">
                          <DeleteRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {[
              { key: 'name', label: 'Supplier Name *', xs: 6 },
              { key: 'code', label: 'Supplier Code', xs: 3 },
              { key: 'contactPerson', label: 'Contact Person', xs: 3 },
              { key: 'phone', label: 'Phone', xs: 3 },
              { key: 'email', label: 'Email', xs: 3 },
              { key: 'gstin', label: 'GSTIN', xs: 3 },
              { key: 'paymentTermsDays', label: 'Payment Terms (days)', xs: 3, type: 'number' },
              { key: 'addressLine1', label: 'Address', xs: 6 },
              { key: 'city', label: 'City', xs: 2 },
              { key: 'state', label: 'State', xs: 2 },
              { key: 'pincode', label: 'Pincode', xs: 2 },
              { key: 'openingBalance', label: 'Opening Balance', xs: 3, type: 'number' },
              { key: 'notes', label: 'Notes', xs: 9 },
            ].map((f) => (
              <Grid item xs={f.xs} key={f.key}>
                <TextField
                  fullWidth
                  label={f.label}
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Supplier'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
