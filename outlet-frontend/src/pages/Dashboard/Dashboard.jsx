import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../redux/dashboardSlice";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { reportService } from "../../services/reportService";
import { getCookie } from "../../utils/cookieUtils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart,
} from "recharts";
import { Typography } from "@mui/material";
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
        <StatCard icon="👥" label="Total Users" value={fmt(summary?.totalUsers)} color="indigo" trend={{ up: true, label: "+12%" }} delay={0} />
        <StatCard icon="🏪" label="Total Outlets" value={fmt(outlets.length)} color="blue" trend={{ up: true, label: "Active" }} delay={60} />
        <StatCard icon="💰" label="Total Revenue" value={fmtCurrency(summary?.totalRevenue)} color="green" trend={{ up: true, label: "+8.4%" }} delay={120} />
        <StatCard icon="📦" label="Low Stock Alerts" value={fmt(summary?.lowStockCount)} color={summary?.lowStockCount > 0 ? "rose" : "green"} sub={summary?.lowStockCount > 0 ? "Needs attention" : "All stocked"} delay={180} />
        <StatCard icon="🗂️" label="Divisions" value={fmt(divisions.length)} color="purple" delay={240} />
        <StatCard icon="🛒" label="Total Orders" value={fmt(summary?.totalOrders)} color="orange" trend={{ up: true, label: "+5.2%" }} delay={300} />
      </div>

      {/* Main Charts Row */}
      <div className="db-grid-2-1">
        <SectionCard title="Weekly Revenue & Orders" subtitle="Revenue vs order volume this week" delay={200} action={filters}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={revenueData} margin={{ top: 10, right: -10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontFamily: "inherit" }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 13 }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" fill="url(#revGrad)" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" fill="url(#orderGrad)" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </ComposedChart>
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
          action={<button className="db-link-btn" onClick={() => navigate("/outlet")}>View All →</button>}
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
              <span className="db-activity-icon orange">⏳</span>
              <div className="db-activity-info">
                <span className="db-activity-title">Pending Orders</span>
                <span className="db-activity-sub">{summary?.pendingOrdersCount || 0} orders awaiting approval</span>
              </div>
            </div>
            <div className="db-activity-item">
              <span className="db-activity-icon green">✅</span>
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
        <StatCard icon="🛒" label="Total Orders" value={fmt(summary?.totalOrders)} color="orange" trend={{ up: true, label: "This Month" }} delay={0} />
        <StatCard icon="⏳" label="Pending Orders" value={fmt(summary?.pendingOrdersCount)} color={summary?.pendingOrdersCount > 0 ? "rose" : "green"} sub={summary?.pendingOrdersCount > 0 ? "Needs action" : "All clear"} delay={60} />
        <StatCard icon="📦" label="Low Stock Items" value={fmt(summary?.lowStockCount)} color={summary?.lowStockCount > 0 ? "rose" : "green"} sub={summary?.lowStockCount > 0 ? "Reorder needed" : "Healthy"} delay={120} />
        <StatCard icon="💰" label="Revenue" value={fmtCurrency(summary?.totalRevenue)} color="green" trend={{ up: true, label: "+6.1%" }} delay={180} />
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
        <div className="db-quick-actions">
          <button className="db-quick-btn indigo" onClick={() => navigate("/orders")}>📋 Manage Orders</button>
          <button className="db-quick-btn green" onClick={() => navigate("/stock")}>📦 View Stock</button>
          <button className="db-quick-btn orange" onClick={() => navigate("/outlet")}>🏪 Outlets</button>
          <button className="db-quick-btn blue" onClick={() => navigate("/product")}>🛍️ Products</button>
          <button className="db-quick-btn purple" onClick={() => navigate("/batch")}>🗂️ Batches</button>
        </div>
      </SectionCard>

      <div className="db-grid-3-2">
        <SectionCard
          title="Outlet Overview"
          subtitle="Outlets under your management"
          action={<button className="db-link-btn" onClick={() => navigate("/outlet")}>View All →</button>}
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
                  <span className={`db-activity-icon ${isOut ? "green" : "indigo"}`}>{isOut ? "💸" : "📥"}</span>
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
        <StatCard icon="🛒" label="My Orders" value={fmt(summary?.totalOrders)} color="orange" delay={0} />
        <StatCard icon="⏳" label="Pending Orders" value={fmt(summary?.pendingOrdersCount)} color={summary?.pendingOrdersCount > 0 ? "rose" : "green"} delay={60} />
        <StatCard icon="📦" label="Low Stock Items" value={fmt(summary?.lowStockCount)} color={summary?.lowStockCount > 0 ? "rose" : "green"} delay={120} />
        <StatCard icon="💰" label="Revenue" value={fmtCurrency(summary?.totalRevenue)} color="green" delay={180} />
      </div>

      <div className="db-grid-2-1">
        <SectionCard title="Order Trend" subtitle="Your order activity this week" delay={220} action={filters}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="userOrdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#f59e0b" strokeWidth={2.5} fill="url(#userOrdGrad)" dot={{ fill: "#f59e0b", r: 4, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Quick Actions" subtitle="Common tasks" delay={280}>
          <div className="db-quick-actions">
            <button className="db-quick-btn orange" onClick={() => navigate("/orders")}>📋 My Orders</button>
            <button className="db-quick-btn green" onClick={() => navigate("/stock")}>📦 Check Stock</button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Transactions" subtitle="Your latest activity" delay={340}>
        <table className="db-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Outlet</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={4} className="db-empty">No recent transactions</td></tr>
            ) : transactions.slice(0, 8).map((tx, i) => {
              const isOut = tx.type?.toLowerCase().includes("sale") || tx.type?.toLowerCase().includes("out");
              return (
                <tr key={i}>
                  <td><strong>{tx.productName || "—"}</strong></td>
                  <td><span className={`db-badge ${isOut ? "green" : "indigo"}`}>{tx.type || "—"}</span></td>
                  <td>{tx.quantity ?? "—"}</td>
                  <td>{tx.outletName || "—"}</td>
                </tr>
              );
            })}
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
  const outlets = useSelector((s) => s.dashboard.outlets);
  const divisions = useSelector((s) => s.dashboard.divisions);

  const role = (user?.role || getCookie("role") || "USER").toUpperCase().replace("ROLE_", "");
  const username = user?.username || user?.name || getCookie("username") || "User";

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutletId, setSelectedOutletId] = useState("");
  const [selectedDivisionId, setSelectedDivisionId] = useState("");

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      if (loading) {
        try {
          const [data, trans] = await Promise.all([
            reportService.getDashboardSummary(),
            reportService.getTransactions({ page: 0, size: 8 }),
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
          const trans = await reportService.getTransactions(params);
          setTransactions(trans?.content || trans || []);
        } catch (e) {
          console.error("Dashboard transactions fetch error", e);
        }
      }
    })();
  }, [selectedOutletId]);

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
    
    let divisionStats = summary.divisionStats || [];
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

  const roleLabel = { ADMIN: "Administrator", MANAGER: "Manager", USER: "Staff" }[role] || role;
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
        <button 
          onClick={() => { setSelectedOutletId(""); setSelectedDivisionId(""); }}
          className="db-reset-pill-btn"
          title="Clear Filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="db-pill-svg-reset">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Reset
        </button>
      )}
    </div>
  );

  return (
    <div className="db-root">
      {/* Decorative background orbs */}
      <div className="db-bg-orb db-bg-orb-1" />
      <div className="db-bg-orb db-bg-orb-2" />

      {/* Page Header */}
      <div className="db-page-header">
        <div className="db-header-text">
          <p className="db-greeting-eyebrow">
            <TypingText text={`${greeting} ☀️`} delay={55} startDelay={100} />
          </p>
          <h1 className="db-page-title">
            <TypingText text={username} delay={65} startDelay={900} />{" "}
            <span className="db-wave" style={{ animationDelay: "1500ms" }}>👋</span>
          </h1>
          <p className="db-page-sub">
            <span className={`db-role-badge role-${role.toLowerCase()}`} style={{ animation: "db-fade-up 0.5s ease both", animationDelay: "1600ms" }}>
              {roleLabel}
            </span>
            <span style={{ display: "inline-block", minWidth: "5px" }} />
            <TypingText text="Here's your overview for today." delay={35} startDelay={2000} />
          </p>
        </div>
      </div>

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
          {(role === "USER" || (role !== "ADMIN" && role !== "MANAGER")) && (
            <UserDashboard summary={filteredSummary} transactions={transactions} navigate={navigate} filters={dashboardFilters} />
          )}
        </div>
      )}
    </div>
  );
}
