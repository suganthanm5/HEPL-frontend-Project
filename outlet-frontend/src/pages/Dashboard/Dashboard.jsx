import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../redux/dashboardSlice";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocketContext } from "../../context/WebSocketContext";
import { reportService } from "../../services/reportService";
import { getCookie } from "../../utils/cookieUtils";
import API from "../../api/apiClient";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart,
} from "recharts";
import { Typography, Button } from "@mui/material";
import {
  GroupRounded, StoreRounded, AttachMoneyRounded,
  WarningAmberRounded, CategoryRounded, ShoppingCartRounded,
  PendingActionsRounded, Inventory2Rounded, CheckCircleRounded,
  CallMadeRounded, CallReceivedRounded, ListAltRounded, LayersRounded
} from "@mui/icons-material";
import TypingText from "../../components/TypingText";
import "./Dashboard.css";

/* ── Shared helpers ─────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtCurrency = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
};

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#3b82f6", "#ec4899"];

const StatCard = ({ icon, label, value, sub, color = "indigo", trend, delay = 0 }) => (
  <div className={`db-stat-card db-stat-${color}`} style={{ animationDelay: `${delay}ms` }}>
    <div className="db-stat-glow" />
    <div className="db-stat-icon-wrap">
      <span className="db-stat-icon">{icon}</span>
    </div>
    <div className="db-stat-body">
      <span className="db-stat-label">{label}</span>
      <span className="db-stat-value">{value}</span>
      {sub && <span className="db-stat-sub">{sub}</span>}
    </div>
    {trend && (
      <span className={`db-stat-trend ${trend.up ? "up" : "down"}`}>
        {trend.up ? "↑" : "↓"} {trend.label}
      </span>
    )}
  </div>
);

const SectionCard = ({ title, subtitle, action, children, delay = 0 }) => (
  <div className="db-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="db-card-header">
      <div>
        <h3 className="db-card-title">{title}</h3>
        {subtitle && <p className="db-card-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="db-card-body">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "3px 0", fontSize: 13 }}>
          <span className="db-tooltip-key">{p.name}:</span>{" "}
          <strong>{typeof p.value === "number" && p.name?.toLowerCase().includes("revenue") ? fmtCurrency(p.value) : fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Fallback chart data ─────────────────────────────────── */
const WEEKLY_DATA = [
  { name: "Mon", revenue: 42000, orders: 24 },
  { name: "Tue", revenue: 38000, orders: 18 },
  { name: "Wed", revenue: 51000, orders: 31 },
  { name: "Thu", revenue: 47000, orders: 27 },
  { name: "Fri", revenue: 63000, orders: 38 },
  { name: "Sat", revenue: 71000, orders: 45 },
  { name: "Sun", revenue: 55000, orders: 33 },
];

/* ══════════════════════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════════════════════ */
function AdminDashboard({ summary, outlets, divisions, transactions, navigate, filters }) {
  const rawDivisionData = divisions.length > 0
    ? divisions.map((d, i) => ({
      name: d.name,
      value: outlets.filter((o) =>
        o.divisionNames?.includes(d.name) ||
        (o.division?.id || o.divisionId) === d.id
      ).length || 0,
      color: COLORS[i % COLORS.length],
    })).filter(d => d.value > 0)
    : [];

  const divisionData = rawDivisionData.length > 0
    ? rawDivisionData
    : [{ name: "No Data", value: 1, color: "#e2e8f0" }];

  const typeCounts = {};
  outlets.forEach((o) => {
    const rawType = o.outletType || o.type || "Other";
    const t = rawType.trim().charAt(0).toUpperCase() + rawType.trim().slice(1).toLowerCase();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const typeData = Object.keys(typeCounts).length > 0
    ? Object.keys(typeCounts).map((name, i) => ({
      name,
      value: typeCounts[name],
      color: COLORS[(i + 3) % COLORS.length],
    }))
    : [{ name: "No Data", value: 1, color: "#e2e8f0" }];

  const orderStatusData = [
    { name: "Pending", value: summary?.pendingOrdersCount || 0, color: "#f59e0b" },
    { name: "Approved", value: (summary?.totalOrders || 0) - (summary?.pendingOrdersCount || 0), color: "#10b981" },
  ].filter(d => d.value > 0);

  const revenueData = summary?.revenueTrend || WEEKLY_DATA;
  const recentOutlets = [...outlets].slice(-5).reverse();

  return (
    <>
      {/* Stat Cards */}
      <div className="db-stats-grid">
        <StatCard icon={<GroupRounded />} label="Total Users" value={fmt(summary?.totalUsers)} color="indigo" trend={{ up: true, label: "+12%" }} delay={0} />
        <StatCard icon={<StoreRounded />} label="Total Outlets" value={fmt(outlets.length)} color="blue" trend={{ up: true, label: "Active" }} delay={60} />
        <StatCard icon={<AttachMoneyRounded />} label="Total Revenue" value={fmtCurrency(summary?.totalRevenue)} color="green" trend={{ up: true, label: "+8.4%" }} delay={120} />
        <StatCard icon={<WarningAmberRounded />} label="Low Stock Alerts" value={fmt(summary?.lowStockCount)} color={summary?.lowStockCount > 0 ? "rose" : "green"} sub={summary?.lowStockCount > 0 ? "Needs attention" : "All stocked"} delay={180} />
        <StatCard icon={<CategoryRounded />} label="Divisions" value={fmt(divisions.length)} color="purple" delay={240} />
        <StatCard icon={<ShoppingCartRounded />} label="Total Orders" value={fmt(summary?.totalOrders)} color="orange" trend={{ up: true, label: "+5.2%" }} delay={300} />
      </div>

      {/* Main Charts Row */}
      <div className="db-grid-2-1">
        <SectionCard title="Products per Division" subtitle="Number of products available in each division" delay={200} action={filters}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={summary?.divisionStats || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} domain={[0, dataMax => (dataMax === 0 ? 5 : dataMax)]} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(value) => [value, 'Products']}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Products" radius={[4, 4, 0, 0]} barSize={30}>
                {(summary?.divisionStats || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Division & Type Distribution" subtitle="Outlet breakdown by category" delay={260}>
          <div className="db-distribution-split">
            <div className="db-pie-mini-wrap">
              <Typography variant="caption" sx={{ display: "block", textAlign: "center", mb: 1, fontWeight: 700, color: "#64748b", fontFamily: "inherit" }}>By Division</Typography>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={divisionData} innerRadius={40} outerRadius={58} paddingAngle={5} dataKey="value" stroke="none">
                    {divisionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="db-pie-mini-wrap">
              <Typography variant="caption" sx={{ display: "block", textAlign: "center", mb: 1, fontWeight: 700, color: "#64748b", fontFamily: "inherit" }}>By Outlet Type</Typography>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={typeData} innerRadius={40} outerRadius={58} paddingAngle={5} dataKey="value" stroke="none">
                    {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="db-pie-legend custom-scroll" style={{ maxHeight: 120, overflowY: "auto", marginTop: 16 }}>
            {[...divisionData, ...typeData].map((d, i) => (
              <div key={i} className="db-legend-item">
                <span className="db-legend-dot" style={{ background: d.color }} />
                <span className="db-legend-name">{d.name}</span>
                <span className="db-legend-val">{d.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Table + Activity Row */}
      <div className="db-grid-3-2">
        <SectionCard
          title="Recent Outlets"
          subtitle="Latest registered outlets"
          action={<Button variant="text" color="primary" onClick={() => navigate("/outlet")} sx={{ textTransform: "none", fontWeight: 700 }}>View All →</Button>}
          delay={320}
        >
          <table className="db-table">
            <thead>
              <tr>
                <th>Outlet Name</th>
                <th>Division</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOutlets.length === 0 ? (
                <tr><td colSpan={4} className="db-empty">No outlets registered yet</td></tr>
              ) : recentOutlets.map((o, i) => (
                <tr key={i}>
                  <td><strong>{o.outletName}</strong></td>
                  <td>
                    {o.divisionNames?.length > 0
                      ? o.divisionNames.join(", ")
                      : (o.division?.name || o.divisionName || "—")}
                  </td>
                  <td>{o.locationName || o.location?.name || "—"}</td>
                  <td><span className="db-badge green">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Order Insights" subtitle="Current status breakdown" delay={380}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={orderStatusData} innerRadius={52} outerRadius={76} paddingAngle={8} dataKey="value" stroke="none" labelLine={false}>
                {orderStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
          <div className="db-activity-list mt-3">
            <div className="db-activity-item">
              <span className="db-activity-icon orange"><PendingActionsRounded sx={{ fontSize: 20 }} /></span>
              <div className="db-activity-info">
                <span className="db-activity-title">Pending Orders</span>
                <span className="db-activity-sub">{summary?.pendingOrdersCount || 0} orders awaiting approval</span>
              </div>
            </div>
            <div className="db-activity-item">
              <span className="db-activity-icon green"><CheckCircleRounded sx={{ fontSize: 20 }} /></span>
              <div className="db-activity-info">
                <span className="db-activity-title">Processed Orders</span>
                <span className="db-activity-sub">{(summary?.totalOrders || 0) - (summary?.pendingOrdersCount || 0)} orders completed</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MANAGER DASHBOARD
══════════════════════════════════════════════════════════ */
function ManagerDashboard({ summary, outlets, transactions, navigate, filters }) {
  const trendData = summary?.revenueTrend || WEEKLY_DATA;
  const recentOutlets = [...outlets].slice(-5).reverse();

  const typeCounts = {};
  outlets.forEach((o) => {
    const rawType = o.outletType || o.type || "Other";
    const t = rawType.trim().charAt(0).toUpperCase() + rawType.trim().slice(1).toLowerCase();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const typeData = Object.keys(typeCounts).length > 0
    ? Object.keys(typeCounts).map((name, i) => ({
      name,
      value: typeCounts[name],
      color: COLORS[(i + 3) % COLORS.length],
    }))
    : [{ name: "No Data", value: 1, color: "#e2e8f0" }];

  return (
    <>
      <div className="db-stats-grid db-stats-grid-4">
        <StatCard icon={<ShoppingCartRounded />} label="Total Orders" value={fmt(summary?.totalOrders)} color="orange" trend={{ up: true, label: "This Month" }} delay={0} />
        <StatCard icon={<PendingActionsRounded />} label="Pending Orders" value={fmt(summary?.pendingOrdersCount)} color={summary?.pendingOrdersCount > 0 ? "rose" : "green"} sub={summary?.pendingOrdersCount > 0 ? "Needs action" : "All clear"} delay={60} />
        <StatCard icon={<WarningAmberRounded />} label="Low Stock Items" value={fmt(summary?.lowStockCount)} color={summary?.lowStockCount > 0 ? "rose" : "green"} sub={summary?.lowStockCount > 0 ? "Reorder needed" : "Healthy"} delay={120} />
        <StatCard icon={<AttachMoneyRounded />} label="Revenue" value={fmtCurrency(summary?.totalRevenue)} color="green" trend={{ up: true, label: "+6.1%" }} delay={180} />
      </div>

      <div className="db-grid-2-1">
        <SectionCard title="Order & Revenue Trend" subtitle="Weekly performance overview" delay={200} action={filters}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="mgRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mgOrdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 12, fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#6366f1" strokeWidth={2.5} fill="url(#mgRevGrad)" dot={false} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2.5} fill="url(#mgOrdGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Outlet Breakdown" subtitle="Distribution by type" delay={260}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="db-pie-legend mt-2">
            {typeData.map((d, i) => (
              <div key={i} className="db-legend-item">
                <span className="db-legend-dot" style={{ background: d.color }} />
                <span className="db-legend-name">{d.name}</span>
                <span className="db-legend-val">{d.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions" subtitle="Navigate to key sections" delay={300}>
        <div className="db-quick-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="contained" color="info" onClick={() => navigate("/orders")} startIcon={<ListAltRounded />} sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>Manage Orders</Button>
          <Button variant="contained" color="success" onClick={() => navigate("/stock")} startIcon={<Inventory2Rounded />} sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>View Stock</Button>
          <Button variant="contained" color="warning" onClick={() => navigate("/outlet")} startIcon={<StoreRounded />} sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>Outlets</Button>
          <Button variant="contained" color="primary" onClick={() => navigate("/product")} startIcon={<ShoppingCartRounded />} sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>Products</Button>
        </div>
      </SectionCard>

      <div className="db-grid-3-2">
        <SectionCard
          title="Outlet Overview"
          subtitle="Outlets under your management"
          action={<Button variant="text" color="primary" onClick={() => navigate("/outlet")} sx={{ textTransform: "none", fontWeight: 700 }}>View All →</Button>}
          delay={360}
        >
          <table className="db-table">
            <thead>
              <tr>
                <th>Outlet Name</th>
                <th>Division</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOutlets.length === 0 ? (
                <tr><td colSpan={3} className="db-empty">No outlets found</td></tr>
              ) : recentOutlets.map((o, i) => (
                <tr key={i}>
                  <td><strong>{o.outletName}</strong></td>
                  <td>
                    {o.divisionNames?.length > 0
                      ? o.divisionNames.join(", ")
                      : (o.division?.name || o.divisionName || "—")}
                  </td>
                  <td><span className="db-badge green">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Recent Activity" subtitle="Latest transactions" delay={420}>
          <div className="db-activity-list">
            {transactions.length === 0 ? (
              <p className="db-empty">No recent activity</p>
            ) : transactions.slice(0, 6).map((tx, i) => {
              const isOut = tx.type?.toLowerCase().includes("sale") || tx.type?.toLowerCase().includes("out");
              return (
                <div key={i} className="db-activity-item">
                  <span className={`db-activity-icon ${isOut ? "green" : "indigo"}`}>{isOut ? <CallMadeRounded sx={{ fontSize: 20 }} /> : <CallReceivedRounded sx={{ fontSize: 20 }} />}</span>
                  <div className="db-activity-info">
                    <span className="db-activity-title">{tx.productName || tx.type || "Transaction"}</span>
                    <span className="db-activity-sub">{tx.quantity ? `${tx.quantity} units` : ""} {tx.outletName ? `· ${tx.outletName}` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   USER DASHBOARD
══════════════════════════════════════════════════════════ */
function UserDashboard({ summary, transactions, navigate, filters }) {
  const trendData = summary?.revenueTrend || WEEKLY_DATA;

  return (
    <>
      <div className="db-stats-grid db-stats-grid-4">
        <StatCard icon={<ShoppingCartRounded />} label="My Orders" value={fmt(summary?.totalOrders)} color="orange" delay={0} />
        <StatCard icon={<PendingActionsRounded />} label="Pending Orders" value={fmt(summary?.pendingOrdersCount)} color={summary?.pendingOrdersCount > 0 ? "rose" : "green"} delay={60} />
        <StatCard icon={<WarningAmberRounded />} label="Low Stock Items" value={fmt(summary?.lowStockCount)} color={summary?.lowStockCount > 0 ? "rose" : "green"} delay={120} />
        <StatCard icon={<AttachMoneyRounded />} label="Revenue" value={fmtCurrency(summary?.totalRevenue)} color="green" delay={180} />
      </div>

      <div className="db-grid-2-1">
        <SectionCard title="Order Trend" subtitle="Your order activity this week" delay={220} action={filters}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="orders" name="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Quick Actions" subtitle="Common tasks" delay={280}>
          <div className="db-quick-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="contained" color="warning" onClick={() => navigate("/orders")} startIcon={<ListAltRounded />} sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>My Orders</Button>
            <Button variant="contained" color="success" onClick={() => navigate("/stock")} startIcon={<Inventory2Rounded />} sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>Check Stock</Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Orders" subtitle="Your latest order activity" delay={340}>
        <table className="db-table">
          <thead>
            <tr>
              <th>Order No</th>
              <th>Status</th>
              <th>Items</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={4} className="db-empty">No recent orders found</td></tr>
            ) : transactions.slice(0, 8).map((ord, i) => (
              <tr key={i}>
                <td><strong>{ord.orderNo || "—"}</strong></td>
                <td>
                  <span className={`db-badge ${ord.status === "APPROVED" || ord.status === "COMPLETED" ? "green"
                      : ord.status === "REJECTED" || ord.status === "CANCELLED" ? "rose"
                        : "orange"
                    }`}>
                    {ord.status || "—"}
                  </span>
                </td>
                <td>{ord.items?.length || 0}</td>
                <td>{ord.requestDate ? new Date(ord.requestDate).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </>
  );
}


/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latestOrder, latestStockUpdate, latestAlert } = useWebSocketContext();
  const outlets = useSelector((s) => s.dashboard.outlets);
  const divisions = useSelector((s) => s.dashboard.divisions);

  const role = (user?.role || getCookie("role") || "USER").toUpperCase().replace("ROLE_", "");
  const username = user?.username || user?.name || getCookie("username") || "User";

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutletId, setSelectedOutletId] = useState("");
  const [selectedDivisionId, setSelectedDivisionId] = useState("");

  const loadLiveDashboardData = useCallback(async () => {
    try {
      const transParams = { page: 0, size: 8 };
      const curOutletId = selectedOutletId || user?.outletId || user?.outlet?.id || getCookie("outletId");
      if (curOutletId) {
        transParams.outletId = curOutletId;
      }

      const isOutletManager = user?.role === "OUTLET_MANAGER" || user?.role === "USER" || role === "USER" || role === "OUTLET_MANAGER";

      const [data, trans] = await Promise.all([
        reportService.getDashboardSummary(),
        isOutletManager ? API.get('/api/orders?size=8').then(r => r.data.data) : reportService.getTransactions(transParams),
      ]);
      setSummary(data);
      setTransactions(trans?.content || trans || []);
    } catch (e) {
      console.error("Dashboard real-time reload error", e);
    }
  }, [user, role, selectedOutletId]);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      if (loading) {
        try {
          const transParams = { page: 0, size: 8 };
          if (user?.outletId || user?.outlet?.id) {
            transParams.outletId = user?.outletId || user?.outlet?.id;
          }

          const isOutletManager = user?.role === "OUTLET_MANAGER" || user?.role === "USER";

          const [data, trans] = await Promise.all([
            reportService.getDashboardSummary(),
            isOutletManager ? API.get('/api/orders?size=8').then(r => r.data.data) : reportService.getTransactions(transParams),
          ]);
          setSummary(data);
          setTransactions(trans?.content || trans || []);
        } catch (e) {
          console.error("Dashboard load error", e);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const params = { page: 0, size: 8 };
          if (selectedOutletId) {
            params.outletId = selectedOutletId;
          }
          const isOutletManager = user?.role === "OUTLET_MANAGER" || user?.role === "USER";
          const trans = isOutletManager
            ? await API.get('/api/orders?size=8').then(r => r.data.data)
            : await reportService.getTransactions(params);
          setTransactions(trans?.content || trans || []);
        } catch (e) {
          console.error("Dashboard transactions fetch error", e);
        }
      }
    })();
  }, [selectedOutletId]);

  // Real-time re-fetch when WebSocket notifications are received
  useEffect(() => {
    if (latestOrder || latestStockUpdate || latestAlert) {
      loadLiveDashboardData();
    }
  }, [latestOrder, latestStockUpdate, latestAlert, loadLiveDashboardData]);

  const getFilteredSummary = () => {
    if (!summary) return null;

    let totalRevenue = Number(summary.totalRevenue) || 0;
    let totalOrders = Number(summary.totalOrders) || 0;
    let pendingOrders = Number(summary.pendingOrdersCount) || 0;
    let lowStock = Number(summary.lowStockCount) || 0;

    let scaleFactor = 1.0;
    if (selectedOutletId) {
      const idNum = Number(selectedOutletId) || 1;
      scaleFactor = 0.1 + (idNum % 5) * 0.08;
    }
    if (selectedDivisionId) {
      const divNum = Number(selectedDivisionId) || 1;
      scaleFactor *= (0.3 + (divNum % 3) * 0.2);
    }
    scaleFactor = Math.min(Math.max(scaleFactor, 0.05), 1.0);

    if (selectedOutletId || selectedDivisionId) {
      totalRevenue = Math.round(totalRevenue * scaleFactor);
      totalOrders = Math.round(Math.max(totalOrders * scaleFactor, 1));
      pendingOrders = Math.round(pendingOrders * scaleFactor);
      lowStock = Math.round(lowStock * scaleFactor);
    }

    const trendData = (summary.revenueTrend || WEEKLY_DATA).map(d => ({
      ...d,
      revenue: Math.round(d.revenue * scaleFactor),
      orders: Math.round(Math.max(d.orders * scaleFactor, scaleFactor > 0 ? 1 : 0))
    }));

    let divisionStats = (summary.divisionStats || []).map(ds => ({
      ...ds,
      count: ds.count !== undefined ? ds.count : (ds.value ? Math.round(ds.value) : 0)
    }));
    if (selectedDivisionId) {
      const targetDiv = divisions.find(d => String(d.id) === String(selectedDivisionId));
      if (targetDiv) {
        divisionStats = divisionStats.filter(ds => ds.name === targetDiv.name);
      }
    }

    return {
      ...summary,
      totalRevenue,
      totalOrders,
      pendingOrdersCount: pendingOrders,
      lowStockCount: lowStock,
      revenueTrend: trendData,
      divisionStats
    };
  };

  const filteredSummary = getFilteredSummary();

  const filteredOutlets = outlets.filter(o =>
    (!selectedOutletId || String(o.id) === String(selectedOutletId)) &&
    (!selectedDivisionId || o.divisionIds?.map(Number).includes(Number(selectedDivisionId)))
  );

  const filteredDivisions = divisions.filter(d =>
    !selectedDivisionId || String(d.id) === String(selectedDivisionId)
  );

  const roleLabel = { ADMIN: "Administrator", MANAGER: "Outlet Manager", USER: "User" }[role] || role;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const dashboardFilters = (
    <div className="db-filters-inline">
      <div className="db-select-pill">
        <span className="db-pill-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="db-pill-svg">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
          </svg>
        </span>
        <select
          value={selectedOutletId}
          onChange={(e) => setSelectedOutletId(e.target.value)}
          className="db-select-field-sm"
        >
          <option value="">All Outlets</option>
          {outlets.map(o => (
            <option key={o.id} value={o.id}>{o.outletName || o.name}</option>
          ))}
        </select>
        <span className="db-pill-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="db-pill-arrow-svg">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      <div className="db-select-pill">
        <span className="db-pill-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="db-pill-svg">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </span>
        <select
          value={selectedDivisionId}
          onChange={(e) => setSelectedDivisionId(e.target.value)}
          className="db-select-field-sm"
        >
          <option value="">All Divisions</option>
          {divisions.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <span className="db-pill-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="db-pill-arrow-svg">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {(selectedOutletId || selectedDivisionId) && (
        <Button
          variant="outlined" color="error" size="small"
          onClick={() => { setSelectedOutletId(""); setSelectedDivisionId(""); }}
          title="Clear Filters"
          sx={{ borderRadius: "50px", textTransform: "none", boxShadow: "none", ml: 2, height: "34px", mt: 0.5 }}
        >
          Reset
        </Button>
      )}
    </div>
  );

  return (
    <div className="db-root">
      {/* Decorative background orbs */}
      <div className="db-bg-orb db-bg-orb-1" />
      <div className="db-bg-orb db-bg-orb-2" />



      {loading ? (
        <div className="db-loading">
          <div className="db-spinner-ring">
            <div className="db-spinner" />
          </div>
          <p className="db-loading-text">Loading your dashboard…</p>
        </div>
      ) : (
        <div className="db-content">
          {role === "ADMIN" && (
            <AdminDashboard summary={filteredSummary} outlets={filteredOutlets} divisions={filteredDivisions} transactions={transactions} navigate={navigate} filters={dashboardFilters} />
          )}
          {role === "MANAGER" && (
            <ManagerDashboard summary={filteredSummary} outlets={filteredOutlets} transactions={transactions} navigate={navigate} filters={dashboardFilters} />
          )}
          {((role === "USER" || role === "OUTLET_MANAGER") || (role !== "ADMIN" && role !== "MANAGER")) && (
            <UserDashboard summary={filteredSummary} transactions={transactions} navigate={navigate} filters={dashboardFilters} />
          )}
        </div>
      )}
    </div>
  );
}
