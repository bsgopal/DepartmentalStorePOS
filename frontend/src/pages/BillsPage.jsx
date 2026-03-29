import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Chip, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider, CircularProgress, TablePagination, InputAdornment,
} from '@mui/material';
import { ReceiptLongRounded, VisibilityRounded, PrintRounded, CancelRounded } from '@mui/icons-material';
import { getBills, getBill, cancelBill } from '../api';
import BillReceipt from '../components/BillReceipt';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const PayChip = ({ method }) => {
  const colors = { cash: 'success', card: 'info', upi: 'secondary', wallet: 'warning' };
  return <Chip label={method?.toUpperCase()} size="small" color={colors[method] || 'default'} sx={{ fontSize: 10, fontWeight: 700 }} />;
};

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewBill, setViewBill] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const receiptRef = useRef();

  const handlePrint = useReactToPrint({ content: () => receiptRef.current });

  const load = useCallback(() => {
    setLoading(true);
    const params = { page: page + 1, limit: 20 };
    if (dateFilter) params.date = dateFilter;
    getBills(params)
      .then((r) => { setBills(r.data.bills); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    const res = await getBill(id);
    setViewBill(res.data.bill);
    setDetailOpen(true);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this bill?')) return;
    await cancelBill(id);
    load();
  };

  const statusColor = { completed: 'success', cancelled: 'error', refunded: 'warning' };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <ReceiptLongRounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Bills History</Typography>
        <TextField
          type="date" size="small" label="Filter by date" value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />
        {dateFilter && (
          <Button size="small" onClick={() => setDateFilter('')}>Clear</Button>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Bill No', 'Date & Time', 'Customer', 'Items', 'Total', 'Discount', 'Payment', 'Status', 'Actions'].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
                ) : bills.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No bills found</TableCell></TableRow>
                ) : bills.map((bill) => (
                  <TableRow key={bill._id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{bill.billNumber}</TableCell>
                    <TableCell>
                      <Typography fontSize={12}>
                        {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                      </Typography>
                      <Typography fontSize={11} color="text.secondary">
                        {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={12}>{bill.customerName || 'Walk-in'}</Typography>
                      {bill.customerPhone && <Typography fontSize={11} color="text.secondary">{bill.customerPhone}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={12}>{bill.items?.length} items</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>₹{bill.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>
                      {bill.totalDiscount > 0 ? `- ₹${bill.totalDiscount?.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell><PayChip method={bill.paymentMethod} /></TableCell>
                    <TableCell>
                      <Chip
                        label={bill.status?.toUpperCase()} size="small"
                        color={statusColor[bill.status] || 'default'}
                        sx={{ fontSize: 10 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openDetail(bill._id)} color="secondary">
                          <VisibilityRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                        {bill.status === 'completed' && (
                          <IconButton size="small" onClick={() => handleCancel(bill._id)} color="error">
                            <CancelRounded sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={total} page={page} rowsPerPage={20}
            onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[20]}
          />
        </Paper>
      </Box>

      {/* Bill detail dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography fontWeight={700}>Bill Detail</Typography>
            <Typography fontSize={12} color="text.secondary">{viewBill?.billNumber}</Typography>
          </Box>
          <Chip label={viewBill?.status?.toUpperCase()} size="small" color={statusColor[viewBill?.status]} />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ display: 'none' }}>
            <BillReceipt ref={receiptRef} bill={viewBill} />
          </Box>
          <BillReceipt bill={viewBill} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<PrintRounded />} onClick={handlePrint}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
