import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Avatar, Chip, Tooltip, IconButton,
  Divider, Badge,
} from '@mui/material';
import {
  PointOfSaleRounded, DashboardRounded, Inventory2Rounded,
  ReceiptLongRounded, PeopleRounded, LogoutRounded, MenuRounded,
  StorefrontRounded, CategoryRounded, AccessTimeRounded,
  LocalShippingRounded,
  ShoppingCartRounded,
  ScheduleRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BadgeRounded } from '@mui/icons-material';
import {  AssignmentReturnRounded, AccountBalanceRounded } from '@mui/icons-material';

const DRAWER_WIDTH = 220;

const navItems = [
  { label: 'Billing', icon: PointOfSaleRounded, path: '/billing', roles: ['admin', 'cashier', 'manager'] },
  { label: 'Dashboard', icon: DashboardRounded, path: '/dashboard', roles: ['admin', 'manager'] },
  { label: 'Products', icon: Inventory2Rounded, path: '/products', roles: ['admin', 'manager'] },
  { label: 'Categories', icon: CategoryRounded, path: '/categories', roles: ['admin', 'manager'] },
  { label: 'Bills History', icon: ReceiptLongRounded, path: '/bills', roles: ['admin', 'cashier', 'manager'] },
  { label: 'Customers', icon: PeopleRounded, path: '/customers', roles: ['admin', 'manager'] },
  { label: 'Staff', icon: BadgeRounded, path: '/staff', roles: ['admin', 'manager'] },
  { label: 'Stock', icon: Inventory2Rounded, path: '/stock', roles: ['admin', 'manager'] },
  { label: 'Suppliers', icon: LocalShippingRounded, path: '/suppliers', roles: ['admin', 'manager'] },
  { label: 'Purchases', icon: ShoppingCartRounded, path: '/purchases', roles: ['admin', 'manager'] },
  { label: 'Shifts', icon: ScheduleRounded, path: '/shifts', roles: ['admin', 'manager', 'cashier'] },
  { label: 'Returns', icon: AssignmentReturnRounded, path: '/returns', roles: ['admin', 'manager', 'cashier'] },
  { label: 'GST Report', icon: AccountBalanceRounded, path: '/gst-report', roles: ['admin', 'manager'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const visibleNav = navItems.filter((n) => n.roles.includes(user?.role));

  const roleColor = { admin: 'error', manager: 'warning', cashier: 'success' };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            background: 'linear-gradient(180deg, #1a237e 0%, #0d1757 100%)',
            color: 'white',
            border: 'none',
            overflowX: 'hidden',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                background: '#c0392b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <StorefrontRounded sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={18} letterSpacing={1} lineHeight={1.1}>
                Renic
              </Typography>
              <Typography fontSize={9} sx={{ opacity: 0.6, letterSpacing: 2 }}>
                POS SYSTEM
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User info */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar
              sx={{ width: 36, height: 36, background: '#c0392b', fontSize: 14, fontWeight: 700 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={600} noWrap>{user?.name}</Typography>
              <Chip
                label={user?.role?.toUpperCase()} size="small"
                color={roleColor[user?.role] || 'default'}
                sx={{ height: 16, fontSize: 9, fontWeight: 700 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.6 }}>
            <AccessTimeRounded sx={{ fontSize: 12 }} />
            <Typography fontSize={11}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Box>
          {user?.counter !== '0' && (
            <Typography fontSize={11} sx={{ opacity: 0.6 }}>
              Counter #{user?.counter}
            </Typography>
          )}
        </Box>

        {/* Nav */}
        <List sx={{ py: 1, flex: 1 }}>
          {visibleNav.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <ListItem key={path} disablePadding sx={{ mb: 0.5, px: 1 }}>
                <ListItemButton
                  onClick={() => navigate(path)}
                  sx={{
                    borderRadius: 2, py: 1,
                    background: active ? 'rgba(192,57,43,0.9)' : 'transparent',
                    '&:hover': { background: active ? 'rgba(192,57,43,0.9)' : 'rgba(255,255,255,0.08)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon sx={{ fontSize: 20, color: active ? 'white' : 'rgba(255,255,255,0.6)' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: 13, fontWeight: active ? 700 : 400,
                      color: active ? 'white' : 'rgba(255,255,255,0.75)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Logout */}
        <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <ListItemButton
            onClick={logout}
            sx={{ borderRadius: 2, '&:hover': { background: 'rgba(255,255,255,0.08)' } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutRounded sx={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}
            />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
