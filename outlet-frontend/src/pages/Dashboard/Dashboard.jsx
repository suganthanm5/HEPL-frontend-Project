import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../redux/dashboardSlice";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  BarChart, Bar, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { reportService } from "../../services/reportService";

import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  Avatar,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Button,
  FormControl,
} from "@mui/material";

import StoreIcon from "@mui/icons-material/Store";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import InventoryIcon from "@mui/icons-material/Inventory";

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const outlets = useSelector((s) => s.dashboard.outlets);
  const locations = useSelector((s) => s.dashboard.locations);
  const divisions = useSelector((s) => s.dashboard.divisions);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    dispatch(fetchDashboardData());
    const loadSummary = async () => {
      try {
        const [data, trans] = await Promise.all([
          reportService.getDashboardSummary(),
          reportService.getTransactions({ page: 0, size: 5 })
        ]);
        setSummary(data);
        setRecentTransactions(trans?.content || trans || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setSummaryLoading(false);
      }
    };
    loadSummary();
  }, [dispatch]);

  /* ── Typing animation ── */
  const user = localStorage.getItem("username") || "Admin";
  const welcomeMessage = `Welcome back, ${user}! Here's what's happening in your outlet system today.`;
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setTypedText("");
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      if (i < welcomeMessage.length) {
        setTypedText(welcomeMessage.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, [welcomeMessage]);

  /* ── Stats & Role ── */
  const role = localStorage.getItem("role")?.replace('ROLE_', '').toUpperCase() || "USER";

  const stats = {
    totalUsers: summary?.totalUsers || 0,
    totalRevenue: summary?.totalRevenue || 0,
    lowStockCount: summary?.lowStockCount || 0,
    totalOrders: summary?.totalOrders || 0,
    pendingOrdersCount: summary?.pendingOrdersCount || 0,
    totalOutlets: outlets.length,
    totalDivisions: divisions.length,
    totalLocations: locations.length,
  };

  /* ── Chart data ── */
  const [performanceFilter, setPerformanceFilter] = useState("This Month");

  const getPerformanceData = (filter) => {
    if (summary?.performanceTrend) {
      return summary.performanceTrend;
    }


    switch (filter) {
      case "Last Month":
        return [
          { date: "01 Apr", value: 45 }, { date: "07 Apr", value: 52 },
          { date: "14 Apr", value: 48 }, { date: "21 Apr", value: 65 },
          { date: "28 Apr", value: 70 }, { date: "30 Apr", value: 68 },
        ];
      default:
        return [
          { date: "01 May", value: 50 }, { date: "07 May", value: 55 },
          { date: "14 May", value: 50 }, { date: "21 May", value: 75 },
          { date: "28 May", value: 80 }, { date: "31 May", value: 78 },
        ];
    }
  };

  const getDivisionData = () => {
    if (summary?.divisionStats && summary.divisionStats.length > 0) {
      const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#3b82f6", "#ec4899"];
      return summary.divisionStats.map((d, i) => ({
        name: d.name,
        value: Math.round(d.value),
        color: colors[i % colors.length],
      }));
    }

    if (outlets.length > 0 && divisions.length > 0) {
      const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#3b82f6", "#ec4899"];
      return divisions.map((div, i) => {
        const count = outlets.filter(o => o.division?.id === div.id).length;
        const percentage = (count / outlets.length) * 100;
        return {
          name: div.name,
          value: Math.round(percentage) || 0,
          color: colors[i % colors.length]
        };
      }).filter(d => d.value > 0);
    }

    return [
      { name: "Retail", value: 100, color: "#6366f1" },
    ];
  };

  const getSalesData = () => {
    if (summary?.revenueTrend) {
      return summary.revenueTrend;
    }
    return [
      { name: "Mon", sales: 4000, orders: 24, target: 3500 },
      { name: "Tue", sales: 3000, orders: 18, target: 3500 },
      { name: "Wed", sales: 2000, orders: 15, target: 3500 },
      { name: "Thu", sales: 2780, orders: 20, target: 3500 },
      { name: "Fri", sales: 1890, orders: 12, target: 3500 },
      { name: "Sat", sales: 2390, orders: 19, target: 3500 },
      { name: "Sun", sales: 3490, orders: 22, target: 3500 },
    ];
  };

  const getTargetData = () => {
    if (role === "ADMIN") {
      return [
        { subject: 'Sales', A: 120, fullMark: 150 },
        { subject: 'Orders', A: 98, fullMark: 150 },
        { subject: 'Users', A: 86, fullMark: 150 },
        { subject: 'Inventory', A: 99, fullMark: 150 },
        { subject: 'Growth', A: 85, fullMark: 150 },
        { subject: 'Loyalty', A: 65, fullMark: 150 },
      ];
    }
    return [
      { subject: 'Efficiency', A: 110, fullMark: 150 },
      { subject: 'Orders', A: 130, fullMark: 150 },
      { subject: 'Attendance', A: 140, fullMark: 150 },
      { subject: 'Accuracy', A: 115, fullMark: 150 },
      { subject: 'Support', A: 90, fullMark: 150 },
      { subject: 'Stock', A: 120, fullMark: 150 },
    ];
  };

  const attendanceData = getPerformanceData(performanceFilter);
  const outletsByDivision = getDivisionData();
  const currentPerformance = attendanceData[attendanceData.length - 1];

  const handleFilterChange = (e) => setPerformanceFilter(e.target.value);
  const recentOutlets = [...outlets].slice(-4).reverse();

  /* ── Custom Tooltip ── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 1, p: 1 }}>
          <Typography variant="caption" display="block">{label}</Typography>
          <Typography variant="caption">
            Value:{" "}
            <Box component="span" sx={{ color: "#3B82F6", fontWeight: 600 }}>
              {payload[0].value}
            </Box>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  /* ── Design System ── */
  const cardPalette = {
    indigo: { main: "#6366f1", bg: "#f5f3ff", gradient: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" },
    green: { main: "#10b981", bg: "#f0fdf4", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" },
    orange: { main: "#f59e0b", bg: "#fffbeb", gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" },
    rose: { main: "#ef4444", bg: "#fef2f2", gradient: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)" },
    blue: { main: "#3b82f6", bg: "#eff6ff", gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)" },
  };

  const StatCard = ({ color, icon, label, value, growth, growthColor }) => (
    <Card sx={{
      flex: 1, borderRadius: 4, position: "relative", overflow: "hidden", border: "1px solid #f1f5f9", height: "100%", minHeight: 110,
      transition: "transform 0.3s ease, box-shadow 0.3s ease", "&:hover": { transform: "translateY(-5px)", boxShadow: "0 12px 24px rgba(0,0,0,0.05)" }
    }}>
      <Box sx={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: cardPalette[color].bg, opacity: 0.5 }} />
      <CardContent sx={{ minHeight: 110, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Avatar sx={{ background: cardPalette[color].gradient, color: "#fff", width: 54, height: 54, boxShadow: `0 4px 12px ${cardPalette[color].main}44` }}>{icon}</Avatar>
          <Chip label={growth} size="small" sx={{ bgcolor: (growthColor || cardPalette[color].main) + "11", color: growthColor || cardPalette[color].main, fontWeight: 700, borderRadius: 1 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 0.5 }}>{label}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#1e293b" }}>{value}</Typography>
      </CardContent>
    </Card>
  );

  const FilterSelect = () => (
    <FormControl size="small"><Select value={performanceFilter} onChange={handleFilterChange} sx={{ fontSize: 13 }}>
      <MenuItem value="This Month">This Month</MenuItem>
      <MenuItem value="Last Month">Last Month</MenuItem>
      <MenuItem value="Last 3 Months">Last 3 Months</MenuItem>
    </Select></FormControl>
  );

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#1e293b" sx={{ letterSpacing: "-1px" }}>Dashboard</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{typedText}</Typography>
      </Box>

      {/* ── Role Based Stats ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {role === "ADMIN" ? (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="indigo"
                icon={<StoreIcon />}
                label="Total Users"
                value={stats.totalUsers}
                growth="+12% ↑"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="orange"
                icon={<InventoryIcon />}
                label="Global Low Stock"
                value={stats.lowStockCount}
                growth={stats.lowStockCount > 0 ? "Alert" : "Stable"}
                growthColor={stats.lowStockCount > 0 ? "#ef4444" : "#10b981"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="indigo"
                icon={<AttachMoneyIcon />}
                label="Total Revenue"
                value={`₹${(stats.totalRevenue / 100000).toFixed(1)}L`}
                growth="+8.4% ↑"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="blue"
                icon={<StoreIcon />}
                label="Total Outlets"
                value={stats.totalOutlets}
                growth="Active"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="orange"
                icon={<NotificationsIcon />}
                label="Active Orders"
                value={stats.totalOrders}
                growth="Processing"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="rose"
                icon={<NotificationsIcon />}
                label="Pending Orders"
                value={stats.pendingOrdersCount}
                growth={stats.pendingOrdersCount > 0 ? "Priority" : "Clear"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="green"
                icon={<InventoryIcon />}
                label="Low Stock"
                value={stats.lowStockCount}
                growth={stats.lowStockCount > 0 ? "Check" : "Healthy"}
                growthColor={stats.lowStockCount > 0 ? "#ef4444" : "#10b981"}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                color="indigo"
                icon={<AttachMoneyIcon />}
                label="Revenue"
                value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
                growth="This Month"
              />
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3} alignItems="stretch">
        {/* Row 1: Primary Metrics & Performance */}
        {(role === "ADMIN" || role === "MANAGER") && (
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 4, height: "100%", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <CardHeader
                title={<Typography variant="h6" fontWeight={800} color="#1e293b">Outlet Performance</Typography>}
                subheader="Real-time efficiency metrics"
                action={<FilterSelect />}
                sx={{ borderBottom: "1px solid #f8fafc", px: 3, pt: 3 }}
              />
              <CardContent sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column" }}>
                <Box sx={{ mb: 4, display: "flex", gap: 4 }}>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">PEAK RATE</Typography>
                    <Typography variant="h5" fontWeight={800} color="#10b981">84.2%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">CURRENT STATUS</Typography>
                    <Typography variant="h5" fontWeight={800} color="#6366f1">Operational</Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 320, width: "100%", mt: "auto" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceData}>
                      <defs><linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={4}
                        fill="url(#colorPerf)"
                        dot={{ fill: "#6366f1", r: 6, stroke: "#fff", strokeWidth: 3 }}
                        activeDot={{ r: 8, stroke: "#fff", strokeWidth: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Revenue Bar - Admin & Manager */}
        {(role === "ADMIN" || role === "MANAGER") && (
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, height: "100%", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <CardHeader title={<Typography variant="h6" fontWeight={800}>Revenue Stream</Typography>} subheader="Weekly targets vs actual" sx={{ borderBottom: "1px solid #f8fafc", px: 3, pt: 3 }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSalesData()} barGap={8} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: "#f8fafc" }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar dataKey="sales" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={24} name="Actual Revenue" />
                      <Bar dataKey="target" fill="#e2e8f0" radius={[8, 8, 0, 0]} barSize={24} name="Target Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Division Pie - Admin only */}
        {role === "ADMIN" && (
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 4, height: "100%", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <CardHeader title={<Typography variant="h6" fontWeight={800}>Division Analysis</Typography>} subheader="Market distribution" sx={{ borderBottom: "1px solid #f8fafc", px: 3, pt: 3 }} />
              <CardContent sx={{ height: 320, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={outletsByDivision} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                      {outletsByDivision.map((e, i) => <Cell key={i} fill={e.color} cornerRadius={6} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {divisions.length > 0 && (
                  <Box sx={{ position: "absolute", textAlign: "center" }}>
                    <Typography variant="h4" fontWeight={900} color="#1e293b">{divisions.length}</Typography>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 2 }}>DIVISIONS</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Row 2: Secondary Insights */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}>
            <Card sx={{ borderRadius: 4, flex: 1, border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <CardHeader title={<Typography variant="h6" fontWeight={800}>KPI Targets</Typography>} subheader={role === "USER" ? "Personal performance" : "Team goals"} sx={{ borderBottom: "1px solid #f8fafc", px: 3, pt: 3 }} />
              <CardContent sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={65} margin={{ top: 20, right: 30, bottom: 20, left: 30 }} data={getTargetData()}>
                    <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} />
                    <Radar name="Performance" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, flex: 1, border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <CardHeader title={<Typography variant="h6" fontWeight={800}>Recent Activity</Typography>} subheader="Latest system events" sx={{ borderBottom: "1px solid #f8fafc", px: 3, pt: 3 }} />
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((tx, i) => {
                      const isSale = tx.type?.toLowerCase().includes("sale") || tx.type?.toLowerCase().includes("out");
                      return (
                        <Box key={i} sx={{ display: "flex", gap: 2.5 }}>
                          <Avatar sx={{
                            background: isSale
                              ? "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                              : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                            color: "#fff", width: 44, height: 44, borderRadius: 2,
                            boxShadow: isSale ? "0 4px 10px #10b98133" : "0 4px 10px #6366f133"
                          }}>
                            {isSale ? <AttachMoneyIcon /> : <InventoryIcon />}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={800} color="#1e293b" noWrap>{tx.productName || tx.type || "Transaction"}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              {tx.quantity ? `${tx.quantity} units` : ""} {tx.outletName ? `at ${tx.outletName}` : ""}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
                      <NotificationsIcon sx={{ fontSize: 32, mb: 1, opacity: 0.3 }} />
                      <Typography variant="body2">No recent activity</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Recent Reg - Admin & Manager */}
        {(role === "ADMIN" || role === "MANAGER") && (
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 4, height: "100%", border: "1px solid #f1f5f9", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <CardHeader
                title={<Typography variant="h6" fontWeight={800}>Recent Registrations</Typography>}
                subheader="Newest network additions"
                action={<Button size="small" onClick={() => navigate("/outlet")} sx={{ textTransform: "none", fontWeight: 800 }}>View All</Button>}
                sx={{ borderBottom: "1px solid #f8fafc", px: 3, pt: 3 }}
              />
              <CardContent sx={{ p: 0 }}>
                {recentOutlets.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                    <StoreIcon sx={{ fontSize: 44, mb: 1, opacity: 0.2 }} />
                    <Typography variant="body1" fontWeight={600}>No outlets registered yet</Typography>
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, py: 2, pl: 3, color: "#64748b" }}>OUTLET</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>DIVISION</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentOutlets.map((o, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ py: 2, pl: 3, fontWeight: 700, color: "#1e293b" }}>{o.outletName}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#475569" }}>{o.division?.name}</TableCell>
                          <TableCell><Chip label="Active" size="small" sx={{ bgcolor: "#f0fdf4", color: "#10b981", fontWeight: 800, fontSize: 10 }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}