import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  CircularProgress, Divider, Avatar, List, ListItem, ListItemText,
} from '@mui/material';
import {
  TrendingUpRounded, ShoppingCartRounded, Inventory2Rounded,
  PeopleRounded, WarningAmberRounded, ReceiptRounded,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { getDashboardStats } from '../api';

const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Avatar sx={{ bgcolor: bgColor, width: 48, height: 48 }}>
        <Icon sx={{ color, fontSize: 24 }} />
      </Avatar>
      <Box>
        <Typography fontSize={13} color="text.secondary" fontWeight={500}>{title}</Typography>
        <Typography variant="h5" fontWeight={800} lineHeight={1.2}>{value}</Typography>
        {subtitle && <Typography fontSize={12} color="text.secondary" mt={0.25}>{subtitle}</Typography>}
      </Box>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress color="primary" />
    </Box>
  );

  const { stats, weeklyData = [], recentBills = [] } = data || {};

  const chartData = weeklyData.map((d) => ({
    date: new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
    revenue: Math.round(d.revenue),
    bills: d.bills,
  }));

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 3, bgcolor: '#f0f2f5' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} color="secondary.main">Dashboard</Typography>
        <Typography color="text.secondary" fontSize={13}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        {[
          {
            title: "Today's Revenue", icon: TrendingUpRounded,
            value: `₹${(stats?.todayRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            color: '#c0392b', bgColor: '#fce8e6', subtitle: 'Total sales today',
          },
          {
            title: "Today's Bills", icon: ReceiptRounded,
            value: stats?.todayBills || 0,
            color: '#1a237e', bgColor: '#e8eaf6', subtitle: 'Transactions completed',
          },
          {
            title: 'Active Products', icon: Inventory2Rounded,
            value: stats?.totalProducts || 0,
            color: '#2e7d32', bgColor: '#e8f5e9', subtitle: `${stats?.lowStock || 0} low stock`,
          },
          {
            title: 'Total Customers', icon: PeopleRounded,
            value: stats?.totalCustomers || 0,
            color: '#e65100', bgColor: '#fff3e0', subtitle: 'Registered members',
          },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.title}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* Revenue chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Weekly Revenue (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v, n) => [n === 'revenue' ? `₹${v.toLocaleString()}` : v, n === 'revenue' ? 'Revenue' : 'Bills']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="revenue" fill="#c0392b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Bills trend */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Recent Bills
              </Typography>
              {recentBills.length === 0 ? (
                <Typography color="text.secondary" fontSize={13} textAlign="center" mt={4}>
                  No bills today yet
                </Typography>
              ) : (
                <List dense disablePadding>
                  {recentBills.map((bill, i) => (
                    <React.Fragment key={bill._id}>
                      <ListItem disablePadding sx={{ py: 0.75 }}>
                        <Avatar
                          sx={{ width: 32, height: 32, mr: 1.5, bgcolor: '#f0f2f5', color: 'text.secondary', fontSize: 12, fontWeight: 700 }}
                        >
                          {i + 1}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography fontSize={12} fontWeight={600} noWrap>
                                {bill.billNumber}
                              </Typography>
                              <Typography fontSize={12} fontWeight={800} color="primary.main">
                                ₹{bill.totalAmount?.toFixed(0)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
                              <Typography fontSize={11} color="text.secondary">
                                {bill.customerName || 'Walk-in'}
                              </Typography>
                              <Chip
                                label={bill.paymentMethod?.toUpperCase()}
                                size="small"
                                sx={{ height: 16, fontSize: 9, fontWeight: 700 }}
                                color={bill.paymentMethod === 'cash' ? 'default' : 'secondary'}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {i < recentBills.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Low stock warning */}
        {stats?.lowStock > 0 && (
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid', borderColor: 'warning.main', bgcolor: '#fffde7' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningAmberRounded sx={{ color: 'warning.main', fontSize: 28 }} />
                <Box>
                  <Typography fontWeight={700} color="warning.dark">
                    {stats.lowStock} products are running low on stock
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    Please restock these items to avoid stockouts. Go to Products &gt; filter by low stock.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
