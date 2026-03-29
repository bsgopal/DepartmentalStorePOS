import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const BillReceipt = React.forwardRef(({ bill }, ref) => {
  if (!bill) return null;
  const fmt = (n) => `₹${Number(n).toFixed(2)}`;
  const date = new Date(bill.createdAt);

  return (
    <Box
      ref={ref}
      sx={{
        width: 300, p: 2, fontFamily: 'monospace', fontSize: 12, background: 'white',
        '@media print': { width: '80mm', fontSize: '11px' },
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Typography fontWeight={900} fontSize={18} letterSpacing={3} fontFamily="monospace">
          D-MART
        </Typography>
        <Typography fontSize={10} color="text.secondary">Avenue Supermarts Ltd.</Typography>
        <Typography fontSize={10} color="text.secondary">Bengaluru, Karnataka - 560001</Typography>
        <Typography fontSize={10} color="text.secondary">GSTIN: 29AABCA1234F1Z5</Typography>
        <Typography fontSize={10} color="text.secondary">Ph: 1800-123-4567</Typography>
      </Box>

      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

      {/* Bill Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography fontSize={11} fontFamily="monospace">Bill No:</Typography>
        <Typography fontSize={11} fontWeight={700} fontFamily="monospace">{bill.billNumber}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography fontSize={11} fontFamily="monospace">Date:</Typography>
        <Typography fontSize={11} fontFamily="monospace">
          {date.toLocaleDateString('en-IN')} {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography fontSize={11} fontFamily="monospace">Cashier:</Typography>
        <Typography fontSize={11} fontFamily="monospace">{bill.cashierName}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography fontSize={11} fontFamily="monospace">Counter:</Typography>
        <Typography fontSize={11} fontFamily="monospace">#{bill.counter}</Typography>
      </Box>
      {bill.customerName && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography fontSize={11} fontFamily="monospace">Customer:</Typography>
          <Typography fontSize={11} fontFamily="monospace">{bill.customerName}</Typography>
        </Box>
      )}

      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

      {/* Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography fontSize={10} fontWeight={700} fontFamily="monospace" sx={{ flex: 2 }}>ITEM</Typography>
        <Typography fontSize={10} fontWeight={700} fontFamily="monospace" sx={{ width: 40, textAlign: 'center' }}>QTY</Typography>
        <Typography fontSize={10} fontWeight={700} fontFamily="monospace" sx={{ width: 50, textAlign: 'right' }}>PRICE</Typography>
        <Typography fontSize={10} fontWeight={700} fontFamily="monospace" sx={{ width: 55, textAlign: 'right' }}>TOTAL</Typography>
      </Box>
      <Divider sx={{ my: 0.5 }} />

      {/* Items */}
      {bill.items?.map((item, i) => (
        <Box key={i} sx={{ mb: 0.75 }}>
          <Typography fontSize={11} fontFamily="monospace" fontWeight={600} noWrap>
            {item.name}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontSize={10} color="text.secondary" fontFamily="monospace" sx={{ flex: 2 }}>
              {item.brand} | MRP {fmt(item.mrp)}
            </Typography>
            <Typography fontSize={10} fontFamily="monospace" sx={{ width: 40, textAlign: 'center' }}>
              {item.quantity}
            </Typography>
            <Typography fontSize={10} fontFamily="monospace" sx={{ width: 50, textAlign: 'right' }}>
              {fmt(item.sellingPrice)}
            </Typography>
            <Typography fontSize={10} fontFamily="monospace" sx={{ width: 55, textAlign: 'right' }}>
              {fmt(item.totalPrice)}
            </Typography>
          </Box>
        </Box>
      ))}

      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

      {/* Totals */}
      {[
        { label: 'Subtotal', value: fmt(bill.subtotal) },
        { label: `You Saved`, value: `- ${fmt(bill.totalDiscount)}`, color: '#2e7d32' },
        { label: `GST Included`, value: fmt(bill.totalGst), color: 'text.secondary' },
      ].map(({ label, value, color }) => (
        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography fontSize={11} fontFamily="monospace" color={color || 'inherit'}>{label}</Typography>
          <Typography fontSize={11} fontFamily="monospace" color={color || 'inherit'}>{value}</Typography>
        </Box>
      ))}

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography fontSize={14} fontWeight={900} fontFamily="monospace">TOTAL</Typography>
        <Typography fontSize={14} fontWeight={900} fontFamily="monospace">₹{Number(bill.totalAmount).toFixed(2)}</Typography>
      </Box>

      <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography fontSize={11} fontFamily="monospace">Payment:</Typography>
        <Typography fontSize={11} fontFamily="monospace" textTransform="uppercase">{bill.paymentMethod}</Typography>
      </Box>
      {bill.amountPaid && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography fontSize={11} fontFamily="monospace">Paid:</Typography>
            <Typography fontSize={11} fontFamily="monospace">{fmt(bill.amountPaid)}</Typography>
          </Box>
          {bill.changeReturned > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography fontSize={11} fontFamily="monospace">Change:</Typography>
              <Typography fontSize={11} fontFamily="monospace">{fmt(bill.changeReturned)}</Typography>
            </Box>
          )}
        </>
      )}

      {/* Footer */}
      <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography fontSize={11} fontFamily="monospace" fontWeight={600}>
          Items: {bill.items?.length} | Qty: {bill.items?.reduce((s, i) => s + i.quantity, 0)}
        </Typography>
        <Typography fontSize={11} fontFamily="monospace" color="success.main" fontWeight={700} mt={0.5}>
          YOU SAVED ₹{Number(bill.totalDiscount).toFixed(2)} TODAY!
        </Typography>
        <Typography fontSize={10} color="text.secondary" fontFamily="monospace" mt={1}>
          Thank you for shopping at D-MART
        </Typography>
        <Typography fontSize={10} color="text.secondary" fontFamily="monospace">
          Visit us again!
        </Typography>
        <Typography fontSize={9} color="text.secondary" fontFamily="monospace" mt={1}>
          *This is a computer generated receipt*
        </Typography>
      </Box>
    </Box>
  );
});

export default BillReceipt;
