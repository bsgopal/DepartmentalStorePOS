import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import BillingPage from './pages/BillingPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import BillsPage from './pages/BillsPage';
import CustomersPage from './pages/CustomersPage';
import { CircularProgress, Box } from '@mui/material';
import StaffPage from './pages/StaffPage';
import StockPage from './pages/StockPage';
import ReturnsPage from './pages/ReturnsPage';
import GSTReportPage from './pages/GSTReportPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchasesPage from './pages/PurchasesPage';
import ShiftsPage from './pages/ShiftsPage';



const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress color="primary" />
    </Box>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !['admin', 'manager'].includes(user.role)) return <Navigate to="/billing" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/billing" /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <CartProvider>
              <AppLayout />
            </CartProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/billing" replace />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="dashboard" element={<PrivateRoute adminOnly><DashboardPage /></PrivateRoute>} />
        <Route path="products" element={<PrivateRoute adminOnly><ProductsPage /></PrivateRoute>} />
        <Route path="categories" element={<PrivateRoute adminOnly><CategoriesPage /></PrivateRoute>} />
        <Route path="staff" element={<PrivateRoute adminOnly><StaffPage /></PrivateRoute>} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="customers" element={<PrivateRoute adminOnly><CustomersPage /></PrivateRoute>} />
        <Route path="stock" element={<PrivateRoute adminOnly><StockPage /></PrivateRoute>} />
        <Route path="suppliers" element={<PrivateRoute adminOnly><SuppliersPage /></PrivateRoute>} />
        <Route path="purchases" element={<PrivateRoute adminOnly><PurchasesPage /></PrivateRoute>} />
        <Route path="shifts" element={<PrivateRoute><ShiftsPage /></PrivateRoute>} />
        <Route path="returns" element={<PrivateRoute><ReturnsPage /></PrivateRoute>} />
        <Route path="gst-report" element={<PrivateRoute adminOnly><GSTReportPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/billing" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
