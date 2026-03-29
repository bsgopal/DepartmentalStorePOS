import React, { useState } from 'react';
import {
  Box, Typography, CircularProgress, Alert, TextField,
  InputAdornment, IconButton, Divider, Chip,
} from '@mui/material';
import {
  VisibilityRounded, VisibilityOffRounded,
  PhoneAndroidRounded, LockRounded,
  StorefrontRounded, ArrowForwardRounded,
  PersonAddRounded, LoginRounded,
  BadgeRounded, EmailRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Animated gradient background orbs ── */
const BgOrbs = () => (
  <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <Box sx={{
      position: 'absolute', width: 600, height: 600,
      borderRadius: '50%', top: '-200px', left: '-150px',
      background: 'radial-gradient(circle, rgba(26,35,126,0.45) 0%, transparent 70%)',
      animation: 'drift1 12s ease-in-out infinite alternate',
    }} />
    <Box sx={{
      position: 'absolute', width: 500, height: 500,
      borderRadius: '50%', bottom: '-180px', right: '-100px',
      background: 'radial-gradient(circle, rgba(192,57,43,0.25) 0%, transparent 70%)',
      animation: 'drift2 15s ease-in-out infinite alternate',
    }} />
    <Box sx={{
      position: 'absolute', width: 300, height: 300,
      borderRadius: '50%', top: '40%', right: '20%',
      background: 'radial-gradient(circle, rgba(57,73,171,0.2) 0%, transparent 70%)',
      animation: 'drift1 9s ease-in-out infinite alternate-reverse',
    }} />
    <style>{`
      @keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(40px, 30px) scale(1.08); } }
      @keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-30px, -40px) scale(1.05); } }
      @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
      @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(192,57,43,0.35); } 50% { box-shadow: 0 0 0 10px rgba(192,57,43,0); } }
    `}</style>
  </Box>
);

/* ── Feature pill ── */
const FeaturePill = ({ icon: Icon, label }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 0.8,
    px: 1.4, py: 0.6, borderRadius: 2,
    bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  }}>
    <Icon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }} />
    <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: 0.3 }}>
      {label}
    </Typography>
  </Box>
);

/* ── Demo credential card ── */
const DemoCard = ({ role, mobile, pwd, color, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1, p: 1.5, borderRadius: 2, cursor: 'pointer',
      border: `1px solid ${color}33`,
      bgcolor: `${color}0d`,
      transition: 'all 0.2s',
      '&:hover': { bgcolor: `${color}1a`, borderColor: `${color}55`, transform: 'translateY(-1px)' },
    }}
  >
    <Chip
      label={role} size="small"
      sx={{ bgcolor: color, color: 'white', fontWeight: 700, fontSize: 10, height: 20, mb: 0.8 }}
    />
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
      {mobile}
    </Typography>
    <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
      {pwd}
    </Typography>
  </Box>
);

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]       = useState('login');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ mobile: '', password: '' });
  const [regForm, setRegForm]     = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });

  const handleLogin = async () => {
    if (!loginForm.mobile || !loginForm.password) { setError('Mobile number and password are required.'); return; }
    setError(''); setLoading(true);
    try {
      const user = await login(loginForm.mobile, loginForm.password);
      navigate(user.role === 'admin' || user.role === 'manager' ? '/dashboard' : '/billing');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regForm.name || !regForm.email || !regForm.mobile || !regForm.password) { setError('All fields are required.'); return; }
    if (regForm.password !== regForm.confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await register(regForm);
      setMode('login'); setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') mode === 'login' ? handleLogin() : handleRegister(); };

  const lf = (k) => (e) => setLoginForm((f) => ({ ...f, [k]: e.target.value }));
  const rf = (k) => (e) => setRegForm((f) => ({ ...f, [k]: e.target.value }));

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(255,255,255,0.04)',
      borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
      '&.Mui-focused fieldset': { borderColor: '#c0392b', borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
    '& .MuiInputLabel-root.Mui-focused': { color: '#e74c3c' },
    '& .MuiOutlinedInput-input': { color: 'rgba(255,255,255,0.92)', fontSize: 14 },
    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  };

  return (
    <Box
      onKeyDown={handleKeyDown}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #080d1a 0%, #0d1435 40%, #0a0d1f 100%)',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <BgOrbs />

      {/* ── Left panel (branding) ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          width: '42%',
          px: 7,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeUp 0.7s ease both',
        }}
      >
        {/* Logo mark */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 3,
            background: 'linear-gradient(135deg, #c0392b 0%, #96281b 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(192,57,43,0.4)',
            animation: 'pulse 3s ease-in-out infinite',
          }}>
            <StorefrontRounded sx={{ color: 'white', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: 1, lineHeight: 1.1 }}>
              RENIC
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 3, fontWeight: 500 }}>
              DEPARTMENTAL STORE
            </Typography>
          </Box>
        </Box>

        {/* Tagline */}
        <Typography
          sx={{
            fontSize: 38, fontWeight: 800, color: 'white', lineHeight: 1.15,
            mb: 2, letterSpacing: -0.5,
          }}
        >
          Smart Retail.{' '}
          <Box component="span" sx={{
            background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Seamless
          </Box>{' '}
          Operations.
        </Typography>

        <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, mb: 5, maxWidth: 340 }}>
          Your complete point-of-sale solution for billing, inventory, and customer management — all in one place.
        </Typography>

        {/* Features */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 5 }}>
          {['Real-time Billing', 'Inventory Sync', 'Staff Management', 'Sales Analytics', 'Customer Loyalty'].map((f) => (
            <Box key={f} sx={{
              px: 1.5, py: 0.7, borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                ✦ {f}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {[
            { num: '99.9%', label: 'Uptime' },
            { num: '< 1s', label: 'Billing Speed' },
            { num: '24/7', label: 'Support' },
          ].map(({ num, label }) => (
            <Box key={label}>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1 }}>{num}</Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', mt: 0.3 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Vertical divider ── */}
      <Box sx={{
        display: { xs: 'none', md: 'block' },
        width: '1px',
        background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)',
        my: 8, zIndex: 1,
      }} />

      {/* ── Right panel (form) ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          px: { xs: 3, sm: 5, md: 7 }, py: 5,
          position: 'relative', zIndex: 1,
          animation: 'scaleIn 0.6s ease both',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>

          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2,
              background: 'linear-gradient(135deg, #c0392b, #96281b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <StorefrontRounded sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: 0.5 }}>RENIC POS</Typography>
          </Box>

          {/* Header */}
          <Box mb={4}>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1.2, mb: 0.8 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)' }}>
              {mode === 'login'
                ? 'Sign in to access your POS terminal'
                : 'Register a new staff account'
              }
            </Typography>
          </Box>

          {/* Tab switcher */}
          <Box
            sx={{
              display: 'flex', mb: 3.5, p: 0.5,
              bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2.5,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {[
              { key: 'login', label: 'Sign In', icon: LoginRounded },
              { key: 'register', label: 'Register', icon: PersonAddRounded },
            ].map(({ key, label, icon: Icon }) => (
              <Box
                key={key} flex={1}
                onClick={() => { setMode(key); setError(''); }}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                  py: 1, borderRadius: 2, cursor: 'pointer',
                  bgcolor: mode === key ? 'rgba(255,255,255,0.1)' : 'transparent',
                  boxShadow: mode === key ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
                  transition: 'all 0.2s',
                  '&:hover': mode !== key ? { bgcolor: 'rgba(255,255,255,0.05)' } : {},
                }}
              >
                <Icon sx={{ fontSize: 15, color: mode === key ? 'white' : 'rgba(255,255,255,0.4)' }} />
                <Typography sx={{
                  fontSize: 13, fontWeight: mode === key ? 700 : 500,
                  color: mode === key ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'color 0.2s',
                }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5, borderRadius: 2, fontSize: 12.5,
                bgcolor: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.35)',
                color: '#ff8a80',
                '& .MuiAlert-icon': { color: '#ff6659' },
              }}
            >
              {error}
            </Alert>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Mobile Number" type="tel" size="small"
                value={loginForm.mobile} onChange={lf('mobile')}
                autoFocus inputProps={{ maxLength: 10 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneAndroidRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment> }}
                sx={inputSx}
              />
              <TextField
                fullWidth label="Password" size="small"
                type={showPwd ? 'text' : 'password'}
                value={loginForm.password} onChange={lf('password')}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd((v) => !v)} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'white' } }}>
                        {showPwd ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />

              {/* Sign in button */}
              <Box
                onClick={loading ? undefined : handleLogin}
                sx={{
                  mt: 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                  py: 1.4, borderRadius: 2,
                  background: loading
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(192,57,43,0.45)',
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': loading ? {} : {
                    background: 'linear-gradient(135deg, #c0392b 0%, #96281b 100%)',
                    boxShadow: '0 6px 24px rgba(192,57,43,0.55)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {loading
                  ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  : <ArrowForwardRounded sx={{ color: 'white', fontSize: 18 }} />
                }
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: loading ? 'rgba(255,255,255,0.4)' : 'white', letterSpacing: 0.4 }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Typography>
              </Box>

              {/* Demo credentials */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                    Quick demo access
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.08)' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <DemoCard
                    role="Admin" mobile="9999999999" pwd="admin123" color="#c0392b"
                    onClick={() => setLoginForm({ mobile: '9999999999', password: 'admin123' })}
                  />
                  <DemoCard
                    role="Cashier" mobile="9876543210" pwd="ravi123" color="#1a237e"
                    onClick={() => setLoginForm({ mobile: '9876543210', password: 'ravi123' })}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Full Name" size="small" autoFocus
                value={regForm.name} onChange={rf('name')}
                InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment> }}
                sx={inputSx}
              />
              <TextField
                fullWidth label="Email Address" type="email" size="small"
                value={regForm.email} onChange={rf('email')}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment> }}
                sx={inputSx}
              />
              <TextField
                fullWidth label="Mobile Number" type="tel" size="small"
                value={regForm.mobile} onChange={rf('mobile')} inputProps={{ maxLength: 10 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneAndroidRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment> }}
                sx={inputSx}
              />
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  fullWidth label="Password" size="small"
                  type={showPwd ? 'text' : 'password'}
                  value={regForm.password} onChange={rf('password')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment> }}
                  helperText="Min 6 characters"
                  sx={inputSx}
                />
                <TextField
                  fullWidth label="Confirm Password" size="small"
                  type={showPwd ? 'text' : 'password'}
                  value={regForm.confirmPassword} onChange={rf('confirmPassword')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockRounded sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} /></InputAdornment> }}
                  sx={inputSx}
                />
              </Box>

              {/* Show/hide */}
              <Box
                onClick={() => setShowPwd((v) => !v)}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.8, cursor: 'pointer', width: 'fit-content', mt: -0.5 }}
              >
                {showPwd
                  ? <VisibilityOffRounded sx={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }} />
                  : <VisibilityRounded sx={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }} />
                }
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'rgba(255,255,255,0.7)' } }}>
                  {showPwd ? 'Hide passwords' : 'Show passwords'}
                </Typography>
              </Box>

              {/* Register button */}
              <Box
                onClick={loading ? undefined : handleRegister}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                  py: 1.4, borderRadius: 2,
                  background: loading
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(26,35,126,0.5)',
                  cursor: loading ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': loading ? {} : {
                    background: 'linear-gradient(135deg, #1a237e 0%, #0d1757 100%)',
                    boxShadow: '0 6px 24px rgba(26,35,126,0.6)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {loading
                  ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  : <PersonAddRounded sx={{ color: 'white', fontSize: 18 }} />
                }
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: loading ? 'rgba(255,255,255,0.4)' : 'white', letterSpacing: 0.4 }}>
                  {loading ? 'Creating account…' : 'Create Account'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()} Renic Departmental Store
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              POS v2.5.0
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}