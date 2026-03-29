import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, IconButton,
} from '@mui/material';
import { CategoryRounded, AddRounded, EditRounded } from '@mui/icons-material';
import { getCategories, createCategory } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🛒', color: '#c0392b' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => getCategories().then((r) => setCategories(r.data.categories)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await createCategory(form);
      setDialog(false);
      setForm({ name: '', icon: '🛒', color: '#c0392b' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#f0f2f5' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CategoryRounded sx={{ color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} flex={1}>Categories</Typography>
        {isAdmin && (
          <Button variant="contained" color="primary" startIcon={<AddRounded />} onClick={() => { setError(''); setDialog(true); }}>
            Add Category
          </Button>
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {categories.map((cat) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={cat._id}>
              <Card sx={{ textAlign: 'center', cursor: 'default', transition: 'box-shadow 0.15s', '&:hover': { boxShadow: 3 } }}>
                <CardContent sx={{ py: 3 }}>
                  <Typography fontSize={40} mb={1}>{cat.icon}</Typography>
                  <Typography fontWeight={700} fontSize={13}>{cat.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Add Category</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField fullWidth label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <Box>
              <Typography fontSize={12} color="text.secondary" mb={0.5}>Color</Typography>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: '100%', height: 40, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
