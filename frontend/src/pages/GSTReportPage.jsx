import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  Paper, CircularProgress, Alert, ToggleButtonGroup,
  ToggleButton, TextField, Divider, Chip,
} from '@mui/material';
import {
  ReceiptLongRounded, DownloadRounded, RefreshRounded,
  AccountBalanceRounded,
} from '@mui/icons-material';
import api from '../api';

const getGSTReport = (params) => api.get('/gst/report', { params });

const GST_COLORS = {
  0:  { color: '#64748b', bg: '#f1f5f9' },
  5:  { color: '#059669', bg: '#ecfdf5' },
  12: { color: '#0284c7', bg: '#e0f2fe' },
  18: { color: '#7c3aed', bg: '#f5f3ff' },
  28: { color: '#dc2626', bg: '#fef2f2' },
};

function fmt(n) { return (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function StatCard({ label, value, color, bg }) {
  return (
    <Card sx={{ borderRadius: 2, border: `1px solid ${color}22`, flex: 1 }}>
      <CardContent sx={{ py: '14px !important' }}>
        <Typography fontSize={11} color="text.secondary" fontWeight={500} mb={0.5}>{label}</Typography>
        <Typography fontSize={20} fontWeight={800} color={color}>₹{fmt(value)}</Typography>
      </CardContent>
    </Card>
  );
}

export default function GSTReportPage() {
  const [period,    setPeriod]    = useState('month');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = period === 'custom'
        ? { from: fromDate, to: toDate }
        : { period };
      const res = await getGSTReport(params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load GST report');
    } finally { setLoading(false); }
  }, [period, fromDate, toDate]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['GST Rate (%)', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'Total GST (₹)', 'Items Sold'],
      ...data.slabs.map((s) => [
        s.rate, fmt(s.taxableValue), fmt(s.cgst), fmt(s.sgst), fmt(s.totalGst), s.items,
      ]),
      [],
      ['TOTAL', fmt(data.totals.taxableValue), fmt(data.totals.cgst), fmt(data.totals.sgst), fmt(data.totals.totalGst), ''],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `GST_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1, bgcolor: '#7c3aed12', borderRadius: 2 }}>
            <AccountBalanceRounded sx={{ color: '#7c3aed', fontSize: 22 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>GST Report</Typography>
            <Typography fontSize={12} color="text.secondary">CGST · SGST · Slab-wise tax summary</Typography>
          </Box>
          <Button startIcon={<DownloadRounded />} variant="outlined" size="small"
            onClick={handleExportCSV} disabled={!data}>
            Export CSV
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Filters */}
        <Paper sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleButtonGroup size="small" exclusive value={period}
              onChange={(_, v) => v && setPeriod(v)}>
              <ToggleButton value="today">Today</ToggleButton>
              <ToggleButton value="month">This Month</ToggleButton>
              <ToggleButton value="quarter">This Quarter</ToggleButton>
              <ToggleButton value="custom">Custom</ToggleButton>
            </ToggleButtonGroup>

            {period === 'custom' && (
              <>
                <TextField size="small" label="From" type="date"
                  value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="To" type="date"
                  value={toDate} onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }} />
              </>
            )}

            <Button variant="contained" color="secondary" onClick={fetchReport}
              disabled={loading} startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshRounded />}>
              {loading ? 'Loading…' : 'Generate Report'}
            </Button>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {data && (
          <>
            {/* Period info */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography fontSize={13} color="text.secondary">
                {new Date(data.period.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' — '}
                {new Date(data.period.to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip label={`${data.totalBills} Bills`} size="small" color="secondary" />
                <Chip label={`Revenue ₹${fmt(data.totalRevenue)}`} size="small" color="primary" />
              </Box>
            </Box>

            {/* Summary cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <StatCard label="Total Taxable Value" value={data.totals.taxableValue} color="#1a237e" bg="#e8eaf6" />
              <StatCard label="Total CGST"          value={data.totals.cgst}         color="#7c3aed" bg="#f5f3ff" />
              <StatCard label="Total SGST"          value={data.totals.sgst}         color="#7c3aed" bg="#f5f3ff" />
              <StatCard label="Total GST Collected" value={data.totals.totalGst}     color="#dc2626" bg="#fef2f2" />
            </Box>

            {/* GST slab table */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptLongRounded fontSize="small" /> Slab-wise GST Breakdown (GSTR-3B Format)
                </Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>GST Rate</TableCell>
                    <TableCell align="right">Taxable Value (₹)</TableCell>
                    <TableCell align="right">CGST @ half rate (₹)</TableCell>
                    <TableCell align="right">SGST @ half rate (₹)</TableCell>
                    <TableCell align="right">Total Tax (₹)</TableCell>
                    <TableCell align="right">Qty Sold</TableCell>
                    <TableCell align="right">Tax %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slabs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No sales data for this period
                      </TableCell>
                    </TableRow>
                  ) : data.slabs.map((slab) => {
                    const c = GST_COLORS[slab.rate] || GST_COLORS[0];
                    return (
                      <TableRow key={slab.rate} hover>
                        <TableCell>
                          <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.8,
                            px: 1.5, py: 0.5, borderRadius: 1.5,
                            bgcolor: c.bg, border: `1px solid ${c.color}33`,
                          }}>
                            <Typography fontSize={13} fontWeight={700} color={c.color}>
                              {slab.rate}% GST
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right"><Typography fontSize={13} fontWeight={600}>₹{fmt(slab.taxableValue)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13} color="#7c3aed" fontWeight={600}>₹{fmt(slab.cgst)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13} color="#7c3aed" fontWeight={600}>₹{fmt(slab.sgst)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13} fontWeight={700} color="error.main">₹{fmt(slab.totalGst)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13}>{slab.items.toLocaleString('en-IN')}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography fontSize={12} color="text.secondary">
                            {data.totals.totalGst > 0
                              ? ((slab.totalGst / data.totals.totalGst) * 100).toFixed(1) + '%'
                              : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals row */}
                  {data.slabs.length > 0 && (
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell><Typography fontWeight={800} fontSize={13}>TOTAL</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={800} fontSize={13}>₹{fmt(data.totals.taxableValue)}</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={800} fontSize={13} color="#7c3aed">₹{fmt(data.totals.cgst)}</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={800} fontSize={13} color="#7c3aed">₹{fmt(data.totals.sgst)}</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={800} fontSize={13} color="error.main">₹{fmt(data.totals.totalGst)}</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={800} fontSize={13}>—</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={800} fontSize={13}>100%</Typography></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {!data && !loading && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <AccountBalanceRounded sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography fontSize={15} fontWeight={600}>Select a period and click Generate Report</Typography>
            <Typography fontSize={13} mt={0.5}>GST data will appear here with CGST/SGST breakdown</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}