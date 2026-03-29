import React, { useCallback, useEffect, useState } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { AccessTimeRounded } from '@mui/icons-material';
import { closeShift, getCurrentShift, getShifts, openShift } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ShiftsPage() {
  const { isAdmin } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [closeSummary, setCloseSummary] = useState(null);

  const loadCurrent = useCallback(() => {
    setLoading(true);
    getCurrentShift()
      .then((res) => setCurrentShift(res.data.shift))
      .catch(() => setCurrentShift(null))
      .finally(() => setLoading(false));
  }, []);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    getShifts({ limit: 30 })
      .then((res) => setHistory(res.data.shifts || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadCurrent();
    if (isAdmin) loadHistory();
  }, [isAdmin, loadCurrent, loadHistory]);

  const handleOpenShift = async () => {
    setError('');
    try {
      await openShift({ openingCash: Number(openingCash || 0), notes });
      setOpenDialog(false);
      setNotes('');
      setOpeningCash('0');
      loadCurrent();
      if (isAdmin) loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to open shift');
    }
  };

  const handleCloseShift = async () => {
    setError('');
    try {
      const res = await closeShift({ closingCash: Number(closingCash || 0), notes });
      setCloseSummary(res.data.summary);
      setCloseDialog(false);
      setNotes('');
      setClosingCash('0');
      loadCurrent();
      if (isAdmin) loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to close shift');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <AccessTimeRounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Shift Management</Typography>
        <Button variant="outlined" onClick={loadCurrent}>Refresh</Button>
      </Box>

      <Box sx={{ p: 2, display: 'grid', gap: 2, gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr' }}>
        <Paper sx={{ p: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {closeSummary && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Shift closed. Expected: Rs. {closeSummary.expectedCash?.toFixed(2)} | Closing: Rs. {closeSummary.closingCash?.toFixed(2)} | Diff: Rs. {closeSummary.difference?.toFixed(2)}
            </Alert>
          )}

          <Typography fontWeight={700} mb={1}>Current Shift</Typography>
          {loading ? (
            <CircularProgress size={24} />
          ) : currentShift ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Chip label={`OPEN | Counter #${currentShift.counter}`} color="success" sx={{ width: 'fit-content' }} />
              <Typography fontSize={13}>Cashier: <b>{currentShift.cashierName}</b></Typography>
              <Typography fontSize={13}>Opened At: <b>{new Date(currentShift.openedAt).toLocaleString('en-IN')}</b></Typography>
              <Typography fontSize={13}>Opening Cash: <b>Rs. {Number(currentShift.openingCash || 0).toFixed(2)}</b></Typography>
              <Button variant="contained" color="error" sx={{ width: 'fit-content', mt: 1 }} onClick={() => setCloseDialog(true)}>
                Close Shift
              </Button>
            </Box>
          ) : (
            <Box>
              <Chip label="No open shift" />
              <Button variant="contained" sx={{ ml: 2 }} onClick={() => setOpenDialog(true)}>Open Shift</Button>
            </Box>
          )}
        </Paper>

        {isAdmin && (
          <Paper sx={{ p: 2, minHeight: 320 }}>
            <Typography fontWeight={700} mb={1}>Recent Shifts</Typography>
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {['Cashier', 'Counter', 'Opened', 'Closed', 'Opening', 'Expected', 'Closing', 'Status'].map((h) => <TableCell key={h}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyLoading ? (
                    <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={20} /></TableCell></TableRow>
                  ) : history.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>No shifts found</TableCell></TableRow>
                  ) : history.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell>{s.cashierName}</TableCell>
                      <TableCell>#{s.counter}</TableCell>
                      <TableCell>{new Date(s.openedAt).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{s.closedAt ? new Date(s.closedAt).toLocaleString('en-IN') : '-'}</TableCell>
                      <TableCell>Rs. {Number(s.openingCash || 0).toFixed(2)}</TableCell>
                      <TableCell>Rs. {Number(s.expectedCash || 0).toFixed(2)}</TableCell>
                      <TableCell>Rs. {Number(s.closingCash || 0).toFixed(2)}</TableCell>
                      <TableCell><Chip label={s.status.toUpperCase()} size="small" color={s.status === 'open' ? 'success' : 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Open Shift</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Opening Cash" type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOpenShift}>Open Shift</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Close Shift</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth label="Closing Cash" type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCloseShift}>Close Shift</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
