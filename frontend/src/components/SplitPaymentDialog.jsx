import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, CircularProgress,
  Alert, Chip, Grid, IconButton, Tooltip,
} from '@mui/material';
import {
  PaymentRounded, MoneyRounded, CreditCardRounded,
  PhoneAndroidRounded, AccountBalanceWalletRounded,
  AddRounded, DeleteRounded, CheckCircleRounded,
} from '@mui/icons-material';

const PAY_METHODS = [
  { value: 'cash',   label: 'Cash',   icon: MoneyRounded,                color: '#059669', bg: '#ecfdf5' },
  { value: 'card',   label: 'Card',   icon: CreditCardRounded,           color: '#1a237e', bg: '#e8eaf6' },
  { value: 'upi',    label: 'UPI',    icon: PhoneAndroidRounded,         color: '#7b1fa2', bg: '#f3e5f5' },
  { value: 'wallet', label: 'Wallet', icon: AccountBalanceWalletRounded, color: '#d97706', bg: '#fffbeb' },
];

function PayMethodBtn({ method, selected, onSelect, amount, onAmountChange }) {
  const Icon = method.icon;
  return (
    <Box
      sx={{
        border: `2px solid ${selected ? method.color : '#e2e8f0'}`,
        borderRadius: 2, p: 1.5, cursor: 'pointer',
        bgcolor: selected ? method.bg : 'transparent',
        transition: 'all 0.15s',
        '&:hover': { borderColor: method.color, bgcolor: method.bg },
      }}
      onClick={onSelect}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: selected ? 1.5 : 0 }}>
        <Icon sx={{ fontSize: 20, color: selected ? method.color : '#94a3b8' }} />
        <Typography fontSize={13} fontWeight={selected ? 700 : 500}
          color={selected ? method.color : 'text.secondary'}>
          {method.label}
        </Typography>
        {selected && (
          <Chip label="Selected" size="small"
            sx={{ ml: 'auto', bgcolor: method.color, color: 'white', fontWeight: 700, fontSize: 10, height: 18 }} />
        )}
      </Box>
      {selected && (
        <TextField
          fullWidth size="small" type="number" label={`${method.label} Amount (₹)`}
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          inputProps={{ min: 0, step: 0.01 }}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      )}
    </Box>
  );
}

export default function SplitPaymentDialog({
  open, onClose, totalAmount, onConfirm, loading, error,
}) {
  const [splits, setSplits]   = useState([{ method: 'cash', amount: '' }]);
  const [isSplit, setIsSplit] = useState(false);

  useEffect(() => {
    if (open) {
      // Pre-fill cash amount with total due for quick checkout
      setSplits([{ method: 'cash', amount: String(totalAmount) }]);
      setIsSplit(false);
    }
  }, [open, totalAmount]);

  const totalPaid  = splits.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const remaining  = Math.max(0, totalAmount - totalPaid);

  // Change is only applicable when cash is involved (customer gives physical money)
  const cashSplit  = splits.find(s => s.method === 'cash');
  const cashAmount = parseFloat(cashSplit?.amount) || 0;

  // For single cash: change = paid - total (if overpaid)
  // For split with cash: change = (cash portion) - (what's needed from cash) 
  // i.e. totalPaid - totalAmount (only if cash is included and overpaid)
  const change = cashSplit && totalPaid > totalAmount
    ? parseFloat((totalPaid - totalAmount).toFixed(2))
    : 0;

  const canConfirm = totalPaid >= totalAmount;

  const updateSplit = (idx, field, val) => {
    setSplits(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const addSplit = () => {
    const usedMethods = splits.map(s => s.method);
    const next = PAY_METHODS.find(m => !usedMethods.includes(m.value));
    if (next) setSplits(prev => [...prev, { method: next.value, amount: '' }]);
  };

  const removeSplit = (idx) => {
    if (splits.length === 1) return;
    setSplits(prev => prev.filter((_, i) => i !== idx));
  };

  const autoFill = (idx) => {
    const others = splits.reduce((s, p, i) => i !== idx ? s + (parseFloat(p.amount) || 0) : s, 0);
    const fill = Math.max(0, totalAmount - others);
    updateSplit(idx, 'amount', String(fill.toFixed(2)));
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (splits.length === 1) {
      onConfirm({
        paymentMethod: splits[0].method,
        amountPaid: parseFloat(splits[0].amount) || totalAmount,
        splitPayments: null,
      });
    } else {
      onConfirm({
        paymentMethod: 'split',
        amountPaid: totalPaid,
        splitPayments: splits.map(s => ({ method: s.method, amount: parseFloat(s.amount) || 0 })),
      });
    }
  };

  const fmt = (v) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d1757 100%)', px: 3, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PaymentRounded sx={{ color: 'white', fontSize: 24 }} />
          <Box>
            <Typography variant="h6" color="white" fontWeight={700}>Payment</Typography>
            <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.65)' }}>
              Total Due: <strong>₹{fmt(totalAmount)}</strong>
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Button size="small" variant="outlined"
              onClick={() => {
                setIsSplit(v => !v);
                if (!isSplit) setSplits([{ method: 'cash', amount: '' }]);
              }}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 11, '&:hover': { borderColor: 'white' } }}
            >
              {isSplit ? 'Single Pay' : '+ Split Payment'}
            </Button>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {!isSplit ? (
          <Grid container spacing={1.5}>
            {PAY_METHODS.map(m => {
              const selected = splits[0]?.method === m.value;
              return (
                <Grid item xs={6} key={m.value}>
                  <PayMethodBtn
                    method={m} selected={selected}
                    onSelect={() => setSplits([{ method: m.value, amount: String(totalAmount) }])}
                    amount={selected ? splits[0].amount : ''}
                    onAmountChange={v => updateSplit(0, 'amount', v)}
                  />
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box>
            <Typography fontSize={12} color="text.secondary" mb={2}>
              Split the total across multiple payment methods
            </Typography>
            {splits.map((split, idx) => {
              const method = PAY_METHODS.find(m => m.value === split.method);
              const Icon = method?.icon || MoneyRounded;
              return (
                <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                  <Box sx={{ p: 1, bgcolor: method?.bg, borderRadius: 1.5, border: `1px solid ${method?.color}33` }}>
                    <Icon sx={{ fontSize: 20, color: method?.color }} />
                  </Box>
                  <TextField select size="small" sx={{ width: 120 }}
                    value={split.method} onChange={e => updateSplit(idx, 'method', e.target.value)}
                    SelectProps={{ native: true }}>
                    {PAY_METHODS.filter(m => !splits.some((s, i) => i !== idx && s.method === m.value))
                      .map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </TextField>
                  <TextField size="small" type="number" label="Amount (₹)" sx={{ flex: 1 }}
                    value={split.amount} onChange={e => updateSplit(idx, 'amount', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }} />
                  <Tooltip title="Auto-fill remaining">
                    <Button size="small" variant="outlined" sx={{ minWidth: 0, px: 1 }} onClick={() => autoFill(idx)}>↓</Button>
                  </Tooltip>
                  <IconButton size="small" onClick={() => removeSplit(idx)} disabled={splits.length === 1}>
                    <DeleteRounded fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
            {splits.length < PAY_METHODS.length && (
              <Button size="small" startIcon={<AddRounded />} onClick={addSplit} sx={{ mt: 0.5 }}>
                Add payment method
              </Button>
            )}
          </Box>
        )}

        {/* ── Summary panel ── */}
        <Box sx={{ mt: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {/* Total Due */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid #e2e8f0' }}>
            <Typography fontSize={13} color="text.secondary">Total Due</Typography>
            <Typography fontSize={13} fontWeight={700}>₹{fmt(totalAmount)}</Typography>
          </Box>

          {/* Amount Tendered */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid #e2e8f0' }}>
            <Typography fontSize={13} color="text.secondary">Amount Tendered</Typography>
            <Typography fontSize={13} fontWeight={700} color={totalPaid >= totalAmount ? 'success.main' : 'error.main'}>
              ₹{fmt(totalPaid)}
            </Typography>
          </Box>

          {/* Remaining (if underpaid) */}
          {remaining > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1, bgcolor: '#fff3f3', borderBottom: '1px solid #fca5a5' }}>
              <Typography fontSize={13} color="error.main" fontWeight={600}>⚠ Still Remaining</Typography>
              <Typography fontSize={13} fontWeight={700} color="error.main">₹{fmt(remaining)}</Typography>
            </Box>
          )}

          {/* Change to Return (if overpaid cash) */}
          {change > 0 && (
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              px: 2, py: 1.5, bgcolor: '#fffbeb', borderTop: '2px solid #fbbf24',
            }}>
              <Box>
                <Typography fontSize={14} color="#92400e" fontWeight={700}>💵 Change to Return</Typography>
                <Typography fontSize={11} color="#a16207">Return this amount to customer</Typography>
              </Box>
              <Typography fontSize={26} fontWeight={900} color="#d97706"
                sx={{ fontFamily: "'Courier New', monospace" }}>
                ₹{fmt(change)}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button
          variant="contained" color="primary" size="large"
          onClick={handleConfirm} disabled={!canConfirm || loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleRounded />}
          sx={{ flex: 1, py: 1.3 }}
        >
          {loading
            ? 'Processing…'
            : change > 0
              ? `Confirm & Return ₹${fmt(change)} Change`
              : `Confirm Payment · ₹${fmt(totalAmount)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}