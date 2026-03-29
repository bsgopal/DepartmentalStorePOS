import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Alert,
  CircularProgress, InputAdornment, Avatar, IconButton, Tooltip,
  MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel,
  Divider, Badge,
} from '@mui/material';
import {
  PeopleRounded, SearchRounded, AddRounded,
  EditRounded, LockResetRounded, ToggleOnRounded, ToggleOffRounded,
  DeleteRounded, BadgeRounded, PhoneAndroidRounded, EmailRounded,
  AdminPanelSettingsRounded, PointOfSaleRounded, ManageAccountsRounded,
  VisibilityRounded, VisibilityOffRounded,
} from '@mui/icons-material';
import api from '../api';

// ─── API helpers ─────────────────────────────────────────────────────────────
const getStaff      = (params)     => api.get('/staff', { params });
const createStaff   = (data)       => api.post('/staff', data);
const updateStaff   = (id, data)   => api.put(`/staff/${id}`, data);
const changePass    = (id, pwd)    => api.patch(`/staff/${id}/password`, { password: pwd });
const toggleStaff   = (id)         => api.patch(`/staff/${id}/toggle`);
const deleteStaff   = (id)         => api.delete(`/staff/${id}`);

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',   label: 'Admin',   icon: AdminPanelSettingsRounded,  color: '#c0392b', bg: '#fdf2f2' },
  { value: 'manager', label: 'Manager', icon: ManageAccountsRounded,       color: '#d97706', bg: '#fffbeb' },
  { value: 'cashier', label: 'Cashier', icon: PointOfSaleRounded,          color: '#059669', bg: '#ecfdf5' },
];

const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.value, r]));

const COUNTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const EMPTY_FORM = {
  name: '', mobile: '', email: '', password: '', role: 'cashier', counter: '1',
};

// ─── Small components ────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = ROLE_MAP[role] || {};
  const Icon = r.icon || BadgeRounded;
  return (
    <Box
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.6,
        px: 1.2, py: 0.4, borderRadius: 1.5,
        bgcolor: r.bg, border: `1px solid ${r.color}22`,
      }}
    >
      <Icon sx={{ fontSize: 13, color: r.color }} />
      <Typography fontSize={11} fontWeight={700} color={r.color} letterSpacing={0.5}>
        {r.label?.toUpperCase()}
      </Typography>
    </Box>
  );
}

function StaffAvatar({ name, role, size = 38 }) {
  const r = ROLE_MAP[role] || {};
  return (
    <Avatar
      sx={{
        width: size, height: size, fontSize: size * 0.42, fontWeight: 800,
        background: `linear-gradient(135deg, ${r.color || '#1a237e'} 0%, ${r.color ? r.color + 'bb' : '#3949ab'} 100%)`,
        boxShadow: `0 2px 8px ${r.color || '#1a237e'}44`,
      }}
    >
      {name?.charAt(0)?.toUpperCase() || '?'}
    </Avatar>
  );
}

// ─── Create / Edit Dialog ────────────────────────────────────────────────────
function StaffDialog({ open, onClose, onSaved, editing }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { name: editing.name, mobile: editing.mobile, email: editing.email, password: '', role: editing.role, counter: editing.counter || '1' }
        : EMPTY_FORM
      );
      setError('');
    }
  }, [open, editing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password; // don't send blank password on edit
      if (editing) await updateStaff(editing._id, payload);
      else         await createStaff(payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const title = editing ? 'Edit Staff Member' : 'Add New Staff';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d1757 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2,
        }}
      >
        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
          <BadgeRounded sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" color="white" fontWeight={700}>{title}</Typography>
          <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.65)' }}>
            Renic Departmental Store · Staff Management
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          {/* Full Name */}
          <Grid item xs={12}>
            <TextField
              fullWidth required label="Full Name" value={form.name} onChange={set('name')}
              InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRounded sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
          </Grid>

          {/* Mobile */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth required label="Mobile Number" value={form.mobile} onChange={set('mobile')}
              inputProps={{ maxLength: 10 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneAndroidRounded sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
              helperText="10-digit Indian mobile"
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth required label="Email Address" type="email" value={form.email} onChange={set('email')}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailRounded sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }}
            />
          </Grid>

          {/* Password */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth required={!editing} label={editing ? 'New Password (leave blank to keep)' : 'Password'}
              type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Min 6 characters"
            />
          </Grid>

          {/* Role */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required size="small">
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role" onChange={set('role')}>
                {ROLES.map(({ value, label, icon: Icon, color }) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon sx={{ fontSize: 18, color }} />
                      <Typography fontSize={13} fontWeight={600}>{label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Counter (only for cashier) */}
          {form.role === 'cashier' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Counter</InputLabel>
                <Select value={form.counter} label="Counter" onChange={set('counter')}>
                  {COUNTERS.map((c) => (
                    <MenuItem key={c} value={c}>Counter #{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        {/* Role permission info */}
        <Box sx={{ mt: 2.5, p: 1.5, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
          <Typography fontSize={12} fontWeight={700} color="text.secondary" mb={1}>ROLE PERMISSIONS</Typography>
          <Grid container spacing={1}>
            {ROLES.map(({ value, label, icon: Icon, color }) => (
              <Grid item xs={4} key={value}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1, borderRadius: 1.5, border: `1.5px solid ${form.role === value ? color : 'transparent'}`, bgcolor: form.role === value ? color + '10' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                >
                  <Icon sx={{ fontSize: 22, color: form.role === value ? color : '#aaa', mb: 0.5 }} />
                  <Typography fontSize={11} fontWeight={700} color={form.role === value ? color : 'text.secondary'}>{label}</Typography>
                  <Typography fontSize={10} color="text.secondary" align="center" mt={0.3}>
                    {value === 'admin'   && 'Full access'}
                    {value === 'manager' && 'Reports & stock'}
                    {value === 'cashier' && 'Billing only'}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button
          variant="contained" color={editing ? 'secondary' : 'primary'}
          onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ px: 3 }}
        >
          {saving ? 'Saving…' : editing ? 'Update Staff' : 'Create Staff'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Change Password Dialog ──────────────────────────────────────────────────
function ChangePasswordDialog({ open, onClose, staff }) {
  const [pwd, setPwd]       = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { if (open) { setPwd(''); setError(''); } }, [open]);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await changePass(staff._id, pwd);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Reset Password
        {staff && (
          <Typography fontSize={13} color="text.secondary" fontWeight={400}>
            for {staff.name}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <TextField
          fullWidth label="New Password" type={showPwd ? 'text' : 'password'}
          value={pwd} onChange={(e) => setPwd(e.target.value)}
          helperText="Minimum 6 characters"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={handleSave} disabled={saving || pwd.length < 6}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <LockResetRounded />}
        >
          {saving ? 'Updating…' : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────
function DeleteDialog({ open, onClose, staff, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteStaff(staff._id); onDeleted(); onClose(); }
    catch { /* silently fail */ }
    finally { setDeleting(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700} color="error.main">Delete Staff Member</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to permanently delete <strong>{staff?.name}</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
          startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteRounded />}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main StaffPage ──────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [createOpen,  setCreateOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [pwdTarget,   setPwdTarget]   = useState(null);
  const [delTarget,   setDelTarget]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    getStaff(params)
      .then((r) => setStaff(r.data.staff))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (member) => {
    try {
      const { data } = await toggleStaff(member._id);
      setStaff((prev) => prev.map((s) => s._id === member._id ? data.staff : s));
    } catch { /* ignore */ }
  };

  // Stats
  const total    = staff.length;
  const active   = staff.filter((s) => s.isActive).length;
  const byRole   = ROLES.map(({ value, label, color, bg }) => ({
    label, color, bg,
    count: staff.filter((s) => s.role === value).length,
  }));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider',
          px: 3, py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ p: 1, bgcolor: '#1a237e12', borderRadius: 2 }}>
            <PeopleRounded sx={{ color: 'secondary.main', fontSize: 22 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Staff Management</Typography>
            <Typography fontSize={12} color="text.secondary">Renic Departmental Store · Team Directory</Typography>
          </Box>
          <Button
            variant="contained" color="primary" startIcon={<AddRounded />}
            onClick={() => setCreateOpen(true)} sx={{ px: 2.5 }}
          >
            Add Staff
          </Button>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatPill label="Total Staff" value={total} color="#1a237e" />
          <StatPill label="Active" value={active} color="#059669" />
          <StatPill label="Inactive" value={total - active} color="#6b7280" />
          <Divider orientation="vertical" flexItem />
          {byRole.map(({ label, count, color, bg }) => (
            <StatPill key={label} label={label} value={count} color={color} bg={bg} />
          ))}
        </Box>
      </Box>

      {/* ── Filters ─────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search by name, mobile or email…" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All Roles</MenuItem>
            {ROLES.map(({ value, label }) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </Select>
        </FormControl>
        {(search || roleFilter) && (
          <Button size="small" onClick={() => { setSearch(''); setRoleFilter(''); }}>Clear</Button>
        )}
      </Box>

      {/* ── Table ───────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Paper sx={{ height: '100%', overflow: 'auto', borderRadius: 2 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {['Staff Member', 'Mobile', 'Email', 'Role', 'Counter', 'Status', 'Joined', 'Actions'].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : staff.map((member) => (
                <TableRow key={member._id} hover sx={{ opacity: member.isActive ? 1 : 0.55 }}>
                  {/* Name + Avatar */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <StaffAvatar name={member.name} role={member.role} />
                      <Box>
                        <Typography fontSize={13} fontWeight={700}>{member.name}</Typography>
                        <Typography fontSize={11} color="text.secondary">ID: {member._id.slice(-6).toUpperCase()}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Mobile */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneAndroidRounded sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography fontSize={13} fontFamily="monospace">{member.mobile}</Typography>
                    </Box>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary">{member.email}</Typography>
                  </TableCell>

                  {/* Role */}
                  <TableCell><RoleBadge role={member.role} /></TableCell>

                  {/* Counter */}
                  <TableCell>
                    {member.role === 'cashier'
                      ? <Chip label={`Counter #${member.counter}`} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 600 }} />
                      : <Typography fontSize={12} color="text.secondary">—</Typography>
                    }
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      label={member.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={member.isActive ? 'success' : 'default'}
                      sx={{ fontWeight: 700, fontSize: 11 }}
                    />
                  </TableCell>

                  {/* Joined */}
                  <TableCell>
                    <Typography fontSize={12} color="text.secondary">
                      {new Date(member.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="secondary" onClick={() => setEditTarget(member)}>
                          <EditRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton size="small" color="warning" onClick={() => setPwdTarget(member)}>
                          <LockResetRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={member.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton size="small" color={member.isActive ? 'error' : 'success'} onClick={() => handleToggle(member)}>
                          {member.isActive ? <ToggleOffRounded fontSize="small" /> : <ToggleOnRounded fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDelTarget(member)}>
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* ── Dialogs ──────────────────────────────────────────── */}
      <StaffDialog
        open={createOpen || !!editTarget}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        onSaved={load}
        editing={editTarget}
      />
      <ChangePasswordDialog
        open={!!pwdTarget} staff={pwdTarget}
        onClose={() => setPwdTarget(null)}
      />
      <DeleteDialog
        open={!!delTarget} staff={delTarget}
        onClose={() => setDelTarget(null)}
        onDeleted={load}
      />
    </Box>
  );
}

// ─── Tiny stat pill ──────────────────────────────────────────────────────────
function StatPill({ label, value, color, bg }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, bgcolor: bg || color + '10', borderRadius: 2, border: `1px solid ${color}22` }}>
      <Typography fontSize={18} fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
      <Typography fontSize={11} color="text.secondary" fontWeight={500}>{label}</Typography>
    </Box>
  );
}