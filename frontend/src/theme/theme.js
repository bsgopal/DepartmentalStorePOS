import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#c0392b',
      dark: '#96281b',
      light: '#e74c3c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1a237e',
      dark: '#0d1757',
      light: '#3949ab',
      contrastText: '#ffffff',
    },
    success: { main: '#2e7d32', light: '#4caf50' },
    warning: { main: '#f59e0b', light: '#fbbf24' },
    error: { main: '#c0392b' },
    background: { default: '#f0f2f5', paper: '#ffffff' },
    text: { primary: '#1a1a2e', secondary: '#6b7280' },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 6 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #c0392b 0%, #96281b 100%)' },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #1a237e 0%, #0d1757 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: '0.7rem' } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, backgroundColor: '#f8f9fa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
  },
});

export default theme;
