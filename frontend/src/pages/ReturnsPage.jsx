import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Alert, CircularProgress,
  InputAdornment, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, Chip, IconButton, Divider, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  AssignmentReturnRounded, SearchRounded, CheckCircleRounded,
  AddRounded, RemoveRounded, ReceiptLongRounded, PersonRounded,
  PaymentRounded,
} from '@mui/icons-material';
import api from '../api';

const getBillForReturn = (billId)   => api.get(`/returns/bill/${billId}`);
const processReturn    = (data)     => api.post('/returns', data);

const PAY_METHODS = [
  { value: 'cash',   label: 'Cash Refund' },
  { value: 'card',   label: 'Card Refund' },
  { value: 'upi',    label: 'UPI Refund' },
  { value: 'wallet', label: 'Store Wallet' },
];

const REASONS = [
  'Damaged product', 'Wrong item', 'Expired product',
  'Customer changed mind', 'Quality issue', 'Other',
];

export default function ReturnsPage() {
  const [billSearch,  setBillSearch]  = useState('');
  const [bill,        setBill]        = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [billError,   setBillError]   = useState('');

  const [returnQtys,    setReturnQtys]    = useState({});
  const [refundMethod,  setRefundMethod]  = useState('cash');
  const [reason,        setReason]        = useState('');
  const [processing,    setProcessing]    = useState(false);
  const [processError,  setProcessError]  = useState('');
  const [successData,   setSuccessData]   = useState(null);
  const [successDialog, setSuccessDialog] = useState(false);

  const handleSearchBill = async () => {
    if (!billSearch.trim()) return;
    setLoadingBill(true); setBillError(''); setBill(null); setReturnQtys({});
    try {
      // Try searching by bill number (exact match) or by ID
      let res;
      try {
        res = await getBillForReturn(billSearch.trim());
      } catch {
        // Try searching bills list for billNumber
        const listRes = await api.get('/bills', { params: { billNumber: billSearch.trim(), limit: 1 } });
        if (listRes.data.bills?.length > 0) {
          res = await getBillForReturn(listRes.data.bills[0]._id);
        } else {
          throw new Error('Bill not found');
        }
      }
      if (res.data.bill.status === 'cancelled')
        throw new Error('This bill is cancelled and cannot be returned');

      setBill(res.data.bill);
      const qtys = {};
      res.data.bill.items.forEach((i) => { qtys[i.product._id || i.product] = 0; });
      setReturnQtys(qtys);
    } catch (err) {
      setBillError(err.message || 'Bill not found');
    } finally { setLoadingBill(false); }
  };

  const setQty = (productId, val) => {
    const item = bill.items.find((i) => (i.product._id || i.product).toString() === productId);
    const max  = item?.quantity || 0;
    setReturnQtys((q) => ({ ...q, [productId]: Math.min(max, Math.max(0, val)) }));
  };

  const selectedItems = bill
    ? bill.items.filter((i) => returnQtys[(i.product._id || i.product).toString()] > 0)
    : [];

  const refundTotal = selectedItems.reduce((sum, i) => {
    const pid = (i.product._id || i.product).toString();
    return sum + i.sellingPrice * returnQtys[pid];
  }, 0);

  const handleProcess = async () => {
    if (selectedItems.length === 0) { setProcessError('Select at least one item to return'); return; }
    if (!reason) { setProcessError('Please select a reason for return'); return; }
    setProcessing(true); setProcessError('');
    try {
      const returnItems = selectedItems.map((i) => ({
        productId: (i.product._id || i.product).toString(),
        quantity:  returnQtys[(i.product._id || i.product).toString()],
      }));
      const res = await processReturn({ billId: bill._id, returnItems, refundMethod, reason });
      setSuccessData(res.data.return);
      setSuccessDialog(true);
      setBill(null); setBillSearch(''); setReturnQtys({});
    } catch (err) {
      setProcessError(err.response?.data?.message || 'Return processing failed');
    } finally { setProcessing(false); }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1, bgcolor: '#c0392b12', borderRadius: 2 }}>
            <AssignmentReturnRounded sx={{ color: 'primary.main', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Returns & Refunds</Typography>
            <Typography fontSize={12} color="text.secondary">Process customer returns and issue refunds</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Grid container spacing={3}>

          {/* Left — Bill Search */}
          <Grid item xs={12} md={7}>
            {/* Search box */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Typography fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongRounded fontSize="small" color="secondary" /> Find Original Bill
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth size="small" placeholder="Enter Bill Number or Bill ID…"
                  value={billSearch} onChange={(e) => setBillSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchBill()}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
                />
                <Button variant="contained" color="secondary" onClick={handleSearchBill}
                  disabled={loadingBill} sx={{ minWidth: 100 }}
                  startIcon={loadingBill ? <CircularProgress size={14} color="inherit" /> : <SearchRounded />}
                >
                  {loadingBill ? 'Searching…' : 'Search'}
                </Button>
              </Box>
              {billError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{billError}</Alert>}
            </Paper>

            {/* Bill details */}
            {bill && (
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Bill header */}
                <Box sx={{ bgcolor: '#f8f9fa', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight={700} fontSize={15}>{bill.billNumber}</Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {new Date(bill.createdAt).toLocaleString('en-IN')} · {bill.cashierName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={bill.status.toUpperCase()} size="small"
                        color={bill.status === 'completed' ? 'success' : bill.status === 'refunded' ? 'error' : 'default'}
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      />
                      <Typography fontSize={13} fontWeight={700} color="primary.main">₹{bill.totalAmount.toLocaleString('en-IN')}</Typography>
                    </Box>
                  </Box>
                  {bill.customer && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1 }}>
                      <PersonRounded sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography fontSize={12} color="text.secondary">
                        {bill.customer.name} · {bill.customer.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Items table */}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="center">Purchased</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Return Qty</TableCell>
                      <TableCell align="right">Refund</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bill.items.map((item) => {
                      const pid = (item.product._id || item.product).toString();
                      const rqty = returnQtys[pid] || 0;
                      return (
                        <TableRow key={pid}>
                          <TableCell>
                            <Typography fontSize={13} fontWeight={600}>{item.name}</Typography>
                            <Typography fontSize={11} color="text.secondary">{item.unit}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontSize={13}>{item.quantity}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontSize={13}>₹{item.sellingPrice}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => setQty(pid, rqty - 1)} disabled={rqty === 0}>
                                <RemoveRounded fontSize="small" />
                              </IconButton>
                              <Typography fontSize={14} fontWeight={700} minWidth={24} textAlign="center"
                                color={rqty > 0 ? 'primary.main' : 'text.disabled'}>
                                {rqty}
                              </Typography>
                              <IconButton size="small" onClick={() => setQty(pid, rqty + 1)} disabled={rqty >= item.quantity}>
                                <AddRounded fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontSize={13} fontWeight={600}
                              color={rqty > 0 ? 'success.main' : 'text.disabled'}>
                              {rqty > 0 ? `₹${(item.sellingPrice * rqty).toFixed(2)}` : '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Grid>

          {/* Right — Refund Summary */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ borderRadius: 2, p: 3, position: 'sticky', top: 0 }}>
              <Typography fontWeight={700} mb={2.5} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentRounded fontSize="small" color="primary" /> Refund Summary
              </Typography>

              {selectedItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <AssignmentReturnRounded sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
                  <Typography fontSize={13}>Select items to return from the bill</Typography>
                </Box>
              ) : (
                <>
                  {/* Selected items */}
                  {selectedItems.map((i) => {
                    const pid  = (i.product._id || i.product).toString();
                    const rqty = returnQtys[pid];
                    return (
                      <Box key={pid} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontSize={13}>{i.name} × {rqty}</Typography>
                        <Typography fontSize={13} fontWeight={600}>₹{(i.sellingPrice * rqty).toFixed(2)}</Typography>
                      </Box>
                    );
                  })}
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                    <Typography fontWeight={700}>Total Refund</Typography>
                    <Typography fontWeight={800} fontSize={18} color="success.main">
                      ₹{refundTotal.toFixed(2)}
                    </Typography>
                  </Box>

                  {/* Refund method */}
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Refund Method</InputLabel>
                    <Select value={refundMethod} label="Refund Method" onChange={(e) => setRefundMethod(e.target.value)}>
                      {PAY_METHODS.map(({ value, label }) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Reason */}
                  <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                    <InputLabel>Reason for Return *</InputLabel>
                    <Select value={reason} label="Reason for Return *" onChange={(e) => setReason(e.target.value)}>
                      {REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {processError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{processError}</Alert>}

                  <Button
                    variant="contained" color="primary" fullWidth size="large"
                    onClick={handleProcess} disabled={processing}
                    startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <CheckCircleRounded />}
                    sx={{ py: 1.4 }}
                  >
                    {processing ? 'Processing…' : `Process Refund · ₹${refundTotal.toFixed(2)}`}
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Success Dialog */}
      <Dialog open={successDialog} onClose={() => setSuccessDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ textAlign: 'center', pt: 4, pb: 1, px: 3 }}>
          <CheckCircleRounded sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} mb={0.5}>Return Processed!</Typography>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            Refund of <strong>₹{successData?.refundTotal?.toFixed(2)}</strong> via {successData?.refundMethod?.toUpperCase()} has been issued.
          </Typography>
          {successData?.items?.map((i) => (
            <Box key={i.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography fontSize={12}>{i.name} × {i.quantity}</Typography>
              <Typography fontSize={12} fontWeight={600}>₹{i.refundAmount?.toFixed(2)}</Typography>
            </Box>
          ))}
        </Box>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="contained" fullWidth onClick={() => setSuccessDialog(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}