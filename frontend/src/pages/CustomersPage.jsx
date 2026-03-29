import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Alert,
  CircularProgress, InputAdornment, Avatar, TablePagination,
} from '@mui/material';
import { PeopleRounded, SearchRounded, AddRounded, PersonRounded } from '@mui/icons-material';
import { getCustomers, createCustomer } from '../api';

const MEMBERSHIP_COLORS = {
  regular: 'default', silver: 'secondary', gold: 'warning', platinum: 'info',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getCustomers(search ? { search } : {})
      .then((r) => setCustomers(r.data.customers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await createCustomer(form);
      setDialog(false);
      setForm({ name: '', phone: '', email: '', address: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <PeopleRounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Customers</Typography>
        <TextField
          size="small" placeholder="Search by name or phone…" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ width: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
        <Button variant="contained" color="primary" startIcon={<AddRounded />} onClick={() => { setError(''); setDialog(true); }}>
          Add Customer
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {['Customer', 'Phone', 'Email', 'Membership', 'Total Purchases', 'Bills', 'Points'].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : customers.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No customers found</TableCell></TableRow>
              ) : customers.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 13 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontSize={13} fontWeight={600}>{c.name}</Typography>
                        {c.membershipId && <Typography fontSize={11} color="text.secondary">{c.membershipId}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{c.phone}</TableCell>
                  <TableCell>{c.email || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.membershipType?.toUpperCase()} size="small"
                      color={MEMBERSHIP_COLORS[c.membershipType]} sx={{ fontWeight: 700, fontSize: 10 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ₹{c.totalPurchases?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>{c.totalBills}</TableCell>
                  <TableCell>
                    <Chip label={`${c.points} pts`} size="small" color="warning" sx={{ fontSize: 10 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Add Customer</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            {[
              { label: 'Full Name *', key: 'name', xs: 12 },
              { label: 'Phone *', key: 'phone', xs: 12 },
              { label: 'Email', key: 'email', xs: 12, type: 'email' },
              { label: 'Address', key: 'address', xs: 12 },
            ].map(({ label, key, xs, type }) => (
              <Grid item xs={xs} key={key}>
                <TextField
                  fullWidth label={label} type={type || 'text'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
