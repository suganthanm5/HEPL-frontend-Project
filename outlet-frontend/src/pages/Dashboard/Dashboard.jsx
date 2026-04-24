import { useState, useMemo, useEffect } from "react";
import { Paper, Card, CardContent, Button, Typography, Box } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../redux/dashboardSlice";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import "./Dashboard.css";

/* ── Icons ── */
const IcOutlet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const IcDivision = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
    <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
  </svg>
);
const IcTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IcArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
  </svg>
);

/* ── Color palette ── */
const COLORS = {
  outlet:   { main: "#6366f1", light: "#eef2ff", dark: "#4f46e5" },
  location: { main: "#10b981", light: "#ecfdf5", dark: "#059669" },
  division: { main: "#f59e0b", light: "#fffbeb", dark: "#d97706" },
  total:    { main: "#06b6d4", light: "#ecfeff", dark: "#0891b2" },
};
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b"];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="ct-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="ct-val" style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ label, value, icon, color, sub, loading, trend }) => (
  <Paper elevation={4} sx={{
    p: 2,
    borderRadius: 3,
    background: `linear-gradient(135deg, ${color.light} 0%, ${color.main}22 100%)`,
    boxShadow: `0 2px 12px 0 ${color.main}22`,
    minWidth: 180,
    minHeight: 120,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    mb: 2,
    transition: 'transform 0.18s, box-shadow 0.18s',
    cursor: 'pointer',
    '&:hover': {
      boxShadow: `0 6px 24px 0 ${color.main}44`,
      transform: 'translateY(-4px) scale(1.03)'
    }
  }}>
    <Box className="sc-top" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className="sc-icon" sx={{ fontSize: 32 }}>{icon}</Box>
      {trend !== undefined && (
        <span className={`sc-trend ${trend >= 0 ? "up" : "down"}`}>
          <IcTrend /> {Math.abs(trend)}%
        </span>
      )}
    </Box>
    <Typography variant="h5" className="sc-value" sx={{ fontWeight: 700, mt: 1 }}>
      {loading ? <span className="skel-val" /> : value}
    </Typography>
    <Typography variant="subtitle2" className="sc-label" sx={{ color: color.dark, fontWeight: 500 }}>
      {label}
    </Typography>
    {sub && <Typography variant="caption" className="sc-sub" sx={{ color: 'text.secondary' }}>{sub}</Typography>}
  </Paper>
);

/* ── Progress Row ── */
const ProgressRow = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="prog-row">
      <div className="prog-meta">
        <span className="prog-label">{label}</span>
        <span className="prog-val" style={{ color }}>{value}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="prog-pct">{pct}%</span>
    </div>
  );
};

export default function Dashboard() {
  const dispatch  = useDispatch();
  const outlets   = useSelector(s => s.dashboard.outlets);
  const locations = useSelector(s => s.dashboard.locations);
  const divisions = useSelector(s => s.dashboard.divisions);
  const loading   = useSelector(s => s.dashboard.loading);

  useEffect(() => { dispatch(fetchDashboardData()); }, [dispatch]);

  const user = localStorage.getItem("username") || "Admin";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const fullGreeting = `${greeting}, ${user}`;

  const [typedText, setTypedText] = useState("");
  useEffect(() => {
    setTypedText("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(fullGreeting.slice(0, i));
      if (i >= fullGreeting.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [fullGreeting]);

  const total = outlets.length + locations.length + divisions.length;

  /* Bar chart — category comparison */
  const barData = [
    { name: "Outlets",   value: outlets.length,   fill: COLORS.outlet.main },
    { name: "Locations", value: locations.length, fill: COLORS.location.main },
    { name: "Divisions", value: divisions.length, fill: COLORS.division.main },
  ];

  /* Area chart — simulated growth (last 6 months) */
  const areaData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun"];
    return months.map((m, i) => ({
      month: m,
      Outlets:   Math.max(0, outlets.length   - (5 - i) * Math.ceil(outlets.length   / 6)),
      Locations: Math.max(0, locations.length - (5 - i) * Math.ceil(locations.length / 6)),
      Divisions: Math.max(0, divisions.length - (5 - i) * Math.ceil(divisions.length / 6)),
    }));
  }, [outlets, locations, divisions]);

  /* Pie */
  const pieData = barData.filter((d) => d.value > 0).map((d) => ({ name: d.name, value: d.value }));

  /* Recent items */
  const recentOutlets   = [...outlets].slice(-5).reverse();
  const recentLocations = [...locations].slice(-4).reverse();
  const recentDivisions = [...divisions].slice(-4).reverse();

  const max = Math.max(outlets.length, locations.length, divisions.length, 1);

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main" style={{
        background: "linear-gradient(120deg, #e0e7ff 0%, #f0fdfa 100%)",
        minHeight: "100vh"
      }}>
        <Navbar title="Dashboard" />
        <div className="page-content">

          {/* ── Top Bar ── */}
          <div className="db-topbar">
            <div>
              <h2 className="db-greeting">{typedText}<span className="db-cursor">|</span></h2>
              <p className="db-sub"></p>
            </div>

          </div>

          {/* ── Stat Cards ── */}
          <Box className="stats-grid" sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3
          }}>
            <StatCard label="Total Outlets"   value={outlets.length}   icon={<IcOutlet />}   color={COLORS.outlet}   sub="Registered stores"   loading={loading} trend={12} />
            <StatCard label="Total Locations" value={locations.length} icon={<IcLocation />} color={COLORS.location} sub="Active regions"       loading={loading} trend={8}  />
            <StatCard label="Total Divisions" value={divisions.length} icon={<IcDivision />} color={COLORS.division} sub="Operational units"    loading={loading} trend={5}  />
            <StatCard label="Total Records"   value={total}            icon={<IcTrend />}    color={COLORS.total}    sub="Across all modules"  loading={loading} />
          </Box>

          {/* ── Main Grid ── */}
          <div className="main-grid">

            {/* ── Area Chart ── */}
            <div className="db-card span-2">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Growth Overview</h3>
                  <p className="card-sub">Cumulative records across all modules</p>
                </div>
                <div className="legend-row">
                  {["Outlets","Locations","Divisions"].map((k, i) => (
                    <span key={k} className="legend-item">
                      <span className="legend-dot" style={{ background: PIE_COLORS[i] }} />{k}
                    </span>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    {["Outlets","Locations","Divisions"].map((k, i) => (
                      <linearGradient key={k} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={PIE_COLORS[i]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={PIE_COLORS[i]} stopOpacity={0}   />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  {["Outlets","Locations","Divisions"].map((k, i) => (
                    <Area key={k} type="monotone" dataKey={k} stroke={PIE_COLORS[i]} strokeWidth={2.5}
                      fill={`url(#g${i})`} dot={false} activeDot={{ r: 5, fill: PIE_COLORS[i] }} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Bar Chart ── */}
            <div className="db-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Category Breakdown</h3>
                  <p className="card-sub">Current totals by type</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={40} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--hover-bg)" }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Pie Chart ── */}
            <div className="db-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Distribution</h3>
                  <p className="card-sub">Share by category</p>
                </div>
              </div>
              {pieData.length === 0 ? (
                <div className="empty-chart">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={52} outerRadius={80} paddingAngle={4}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8}
                      wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Progress Card ── */}
            <div className="db-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Relative Scale</h3>
                  <p className="card-sub">Each module vs highest count</p>
                </div>
              </div>
              <div className="prog-list">
                <ProgressRow label="Outlets"   value={outlets.length}   max={max} color={COLORS.outlet.main}   />
                <ProgressRow label="Locations" value={locations.length} max={max} color={COLORS.location.main} />
                <ProgressRow label="Divisions" value={divisions.length} max={max} color={COLORS.division.main} />
              </div>
              <div className="prog-total-row">
                <span>Total Records</span>
                <span className="prog-total-val">{loading ? "—" : total}</span>
              </div>
            </div>

            {/* ── Recent Outlets ── */}
            <div className="db-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Outlets</h3>
                  <p className="card-sub">Latest {recentOutlets.length} added</p>
                </div>
                <span className="badge" style={{ "--bc": COLORS.outlet.main, "--bl": COLORS.outlet.light }}>
                  {outlets.length} total
                </span>
              </div>
              {loading ? <SkeletonList n={4} /> : recentOutlets.length === 0
                ? <EmptyMsg text="No outlets yet" />
                : <ActivityList items={recentOutlets} nameKey="outletName" color={COLORS.outlet.main} />
              }
            </div>

            {/* ── Recent Locations ── */}
            <div className="db-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Locations</h3>
                  <p className="card-sub">Latest {recentLocations.length} added</p>
                </div>
                <span className="badge" style={{ "--bc": COLORS.location.main, "--bl": COLORS.location.light }}>
                  {locations.length} total
                </span>
              </div>
              {loading ? <SkeletonList n={4} /> : recentLocations.length === 0
                ? <EmptyMsg text="No locations yet" />
                : <ActivityList items={recentLocations} nameKey="name" color={COLORS.location.main} />
              }
            </div>

            {/* ── Recent Divisions ── */}
            <div className="db-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent Divisions</h3>
                  <p className="card-sub">Latest {recentDivisions.length} added</p>
                </div>
                <span className="badge" style={{ "--bc": COLORS.division.main, "--bl": COLORS.division.light }}>
                  {divisions.length} total
                </span>
              </div>
              {loading ? <SkeletonList n={4} /> : recentDivisions.length === 0
                ? <EmptyMsg text="No divisions yet" />
                : <ActivityList items={recentDivisions} nameKey="name" color={COLORS.division.main} />
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
const ActivityList = ({ items, nameKey, color }) => (
  <ul className="act-list">
    {items.map((item, i) => (
      <li key={item.id ?? i} className="act-item">
        <span className="act-avatar" style={{ background: `${color}20`, color }}>{(item[nameKey] ?? "?").charAt(0).toUpperCase()}</span>
        <span className="act-name">{item[nameKey] ?? "—"}</span>
        <span className="act-arrow"><IcArrow /></span>
      </li>
    ))}
  </ul>
);

const SkeletonList = ({ n }) => (
  <div className="skel-list">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="skel-row">
        <span className="skel-circle" />
        <span className="skel-line" style={{ width: `${55 + (i % 3) * 15}%` }} />
      </div>
    ))}
  </div>
);

const EmptyMsg = ({ text }) => (
  <div className="empty-msg">{text}</div>
);
