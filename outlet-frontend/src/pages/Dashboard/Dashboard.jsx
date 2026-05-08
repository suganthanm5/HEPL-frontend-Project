import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../redux/dashboardSlice";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { userService } from "../../services/userService";
import "./Dashboard.css";

/* ── Icons ── */
const IcStore = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" />
  </svg>
);
const IcLocation = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);
const IcBox = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" />
  </svg>
);
const IcDollar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 15h2c0 1.08 1.37 2 3 2s3-.92 3-2c0-1.1-1.04-1.5-3.24-2.03C9.64 12.44 7 11.78 7 9c0-1.79 1.47-3.31 3.5-3.82V3h3v2.18C15.53 5.69 17 7.21 17 9h-2c0-1.08-1.37-2-3-2s-3 .92-3 2c0 1.1 1.04 1.5 3.24 2.03C14.36 11.56 17 12.22 17 15c0 1.79-1.47 3.31-3.5 3.82V21h-3v-2.18C8.47 18.31 7 16.79 7 15z" />
  </svg>
);
const IcMoreVert = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);
const IcTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
  </svg>
);
const IcBell = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);
const IcCalendar = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
  </svg>
);
const IcArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 17l5-5-5-5v10z" />
  </svg>
);

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const outlets = useSelector(s => s.dashboard.outlets);
  const locations = useSelector(s => s.dashboard.locations);
  const divisions = useSelector(s => s.dashboard.divisions);
  const loading = useSelector(s => s.dashboard.loading);

  useEffect(() => { dispatch(fetchDashboardData()); }, [dispatch]);

  const user = localStorage.getItem("username") || "Admin";
  const welcomeMessage = `Welcome back, ${user}! Here's what's happening in your outlet system today.`;

  // Typing animation state
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Typing animation effect
  useEffect(() => {
    setTypedText("");
    setIsTyping(true);
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < welcomeMessage.length) {
        setTypedText(welcomeMessage.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // Typing speed: 50ms per character

    return () => clearInterval(typingInterval);
  }, [welcomeMessage]);

  // Calculate totals
  const role = localStorage.getItem("role") || "USER";
  const totalOutlets = outlets.length;
  const totalLocations = locations.length;
  const totalProducts = divisions.reduce((sum, div) => sum + (div.products?.length || 0), 0);
  const totalRevenue = totalProducts * 595; // Mock revenue calculation

  // Filter state for both charts
  const [performanceFilter, setPerformanceFilter] = useState("This Month");

  // Generate different data sets based on filter for performance
  const getPerformanceData = (filter) => {
    switch (filter) {
      case "This Month":
        return [
          { date: "01 May", value: 50, percentage: 50 },
          { date: "07 May", value: 55, percentage: 55 },
          { date: "14 May", value: 50, percentage: 50 },
          { date: "21 May", value: 75, percentage: 75 },
          { date: "28 May", value: 80, percentage: 80 },
          { date: "31 May", value: 78, percentage: 78 },
        ];
      case "Last Month":
        return [
          { date: "01 Apr", value: 45, percentage: 45 },
          { date: "07 Apr", value: 52, percentage: 52 },
          { date: "14 Apr", value: 48, percentage: 48 },
          { date: "21 Apr", value: 65, percentage: 65 },
          { date: "28 Apr", value: 70, percentage: 70 },
          { date: "30 Apr", value: 68, percentage: 68 },
        ];
      case "Last 3 Months":
        return [
          { date: "Mar", value: 42, percentage: 42 },
          { date: "Mar", value: 48, percentage: 48 },
          { date: "Apr", value: 55, percentage: 55 },
          { date: "Apr", value: 62, percentage: 62 },
          { date: "May", value: 70, percentage: 70 },
          { date: "May", value: 78, percentage: 78 },
        ];
      default:
        return [
          { date: "01 May", value: 50, percentage: 50 },
          { date: "07 May", value: 55, percentage: 55 },
          { date: "14 May", value: 50, percentage: 50 },
          { date: "21 May", value: 75, percentage: 75 },
          { date: "28 May", value: 80, percentage: 80 },
          { date: "31 May", value: 78, percentage: 78 },
        ];
    }
  };

  // Generate different data sets based on filter for division
  const getDivisionData = (filter) => {
    switch (filter) {
      case "This Month":
        return [
          { name: "Retail", value: 35, color: "#3B82F6" },
          { name: "Wholesale", value: 25, color: "#10B981" },
          { name: "Franchise", value: 20, color: "#F59E0B" },
          { name: "Online", value: 10, color: "#EF4444" },
          { name: "Others", value: 10, color: "#8B5CF6" },
        ];
      case "Last Month":
        return [
          { name: "Retail", value: 40, color: "#3B82F6" },
          { name: "Wholesale", value: 20, color: "#10B981" },
          { name: "Franchise", value: 18, color: "#F59E0B" },
          { name: "Online", value: 12, color: "#EF4444" },
          { name: "Others", value: 10, color: "#8B5CF6" },
        ];
      case "Last 3 Months":
        return [
          { name: "Retail", value: 38, color: "#3B82F6" },
          { name: "Wholesale", value: 22, color: "#10B981" },
          { name: "Franchise", value: 19, color: "#F59E0B" },
          { name: "Online", value: 11, color: "#EF4444" },
          { name: "Others", value: 10, color: "#8B5CF6" },
        ];
      default:
        return [
          { name: "Retail", value: 35, color: "#3B82F6" },
          { name: "Wholesale", value: 25, color: "#10B981" },
          { name: "Franchise", value: 20, color: "#F59E0B" },
          { name: "Online", value: 10, color: "#EF4444" },
          { name: "Others", value: 10, color: "#8B5CF6" },
        ];
    }
  };

  // Get current data based on filter
  const attendanceData = getPerformanceData(performanceFilter);
  const outletsByDivision = getDivisionData(performanceFilter);

  // Get the latest performance percentage for display
  const currentPerformance = attendanceData[attendanceData.length - 1];
  const performanceDate = performanceFilter === "Last 3 Months" ? "May" :
    performanceFilter === "Last Month" ? "30 Apr" : "31 May";

  // Handle filter change
  const handleFilterChange = (e) => {
    setPerformanceFilter(e.target.value);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">
            Performance: <span className="tooltip-percentage">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Recent Outlets
  const recentOutlets = [...outlets].slice(-4).reverse();

  // Announcements
  const announcements = [
    {
      id: 1,
      icon: <IcBell />,
      title: "New Outlet Opening",
      description: "New outlet will be opened on 25 May 2024.",
      time: "2h ago",
      color: "#3B82F6"
    },
    {
      id: 2,
      icon: <IcCalendar />,
      title: "Monthly Review",
      description: "Monthly performance review scheduled.",
      time: "5h ago",
      color: "#F59E0B"
    },
    {
      id: 3,
      icon: <IcBox />,
      title: "New Products Added",
      description: "New products are added this month.",
      time: "1d ago",
      color: "#10B981"
    }
  ];

  // Upcoming Events
  const upcomingEvents = [
    { date: "25", month: "MAY", title: "Outlet Opening", time: "25 May 2024, 10:00 AM", color: "#3B82F6" },
    { date: "01", month: "JUN", title: "Staff Training", time: "01 June 2024, 09:00 AM", color: "#10B981" },
    { date: "15", month: "JUN", title: "Board Meeting", time: "15 June 2024, 11:00 AM", color: "#F59E0B" }
  ];

  return (
    <>
      {/* Header */}
      <div className="edu-header">
        <div className="edu-header-left">
          <h1>Dashboard</h1>
          <p className="typing-text">
            {typedText}
            {isTyping && <span className="typing-cursor">|</span>}
          </p>
        </div>
      </div>

      {/* Stats Cards - Role Based */}
      <div className="edu-stats">
        {role === "ADMIN" ? (
          <>
            <div className="stat-card blue">
              <div className="stat-icon"><IcStore /></div>
              <div className="stat-content">
                <div className="stat-label">Total Users</div>
                <div className="stat-number">12</div>
                <div className="stat-growth"><IcTrendUp /> +2 new this week</div>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon"><IcBox /></div>
              <div className="stat-content">
                <div className="stat-label">Global Low Stock</div>
                <div className="stat-number">8 Items</div>
                <div className="stat-growth" style={{ color: "#ef4444" }}>Needs Attention</div>
              </div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon"><IcDollar /></div>
              <div className="stat-content">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-number">${totalRevenue.toLocaleString()}</div>
                <div className="stat-growth"><IcTrendUp /> +15% Monthly</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card orange">
              <div className="stat-icon"><IcBell /></div>
              <div className="stat-content">
                <div className="stat-label">Pending Approvals</div>
                <div className="stat-number">4 Orders</div>
                <div className="stat-growth">Awaiting Review</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon"><IcStore /></div>
              <div className="stat-content">
                <div className="stat-label">Outlet Stock</div>
                <div className="stat-number">2,450 Units</div>
                <div className="stat-growth"><IcTrendUp /> Healthy Level</div>
              </div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon"><IcTrendUp /></div>
              <div className="stat-content">
                <div className="stat-label">Recent Transfers</div>
                <div className="stat-number">12 Today</div>
                <div className="stat-growth">All Completed</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="edu-grid">
        {/* Attendance Overview */}
        <div className="edu-card attendance-card">
          <div className="card-header">
            <div className="card-title">
              <h3>Outlet Performance</h3>
            </div>
            <div className="card-filter">
              <select value={performanceFilter} onChange={handleFilterChange}>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="Last 3 Months">Last 3 Months</option>
              </select>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-info">
              <div className="chart-percentage">
                <span className="percentage">{currentPerformance.value}%</span>
                <span className="date">{performanceDate}</span>
                <span className="label">Performance: {currentPerformance.value}%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={attendanceData}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAttendance)"
                  dot={{
                    fill: '#3B82F6',
                    strokeWidth: 2,
                    stroke: '#ffffff',
                    r: 4
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#3B82F6',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    style: { cursor: 'pointer' }
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outlets by Division */}
        <div className="edu-card pie-card">
          <div className="card-header">
            <div className="card-title">
              <h3>Outlets by Division</h3>
            </div>
            <div className="card-filter">
              <select value={performanceFilter} onChange={handleFilterChange}>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="Last 3 Months">Last 3 Months</option>
              </select>
            </div>
          </div>
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={outletsByDivision}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {outletsByDivision.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-center">
              <div className="pie-total">{divisions.length}</div>
              <div className="pie-label">Total</div>
            </div>
            <div className="pie-legend">
              {outletsByDivision.map((item, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: item.color }}></div>
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-percent">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="edu-card announcements-card">
          <div className="card-header">
            <div className="card-title">
              <h3><IcBell /> Announcements</h3>
            </div>
            <div className="card-menu">
              <IcMoreVert />
            </div>
          </div>
          <div className="announcements-list">
            {announcements.map(announcement => (
              <div key={announcement.id} className="announcement-item">
                <div className="announcement-icon" style={{ color: announcement.color }}>
                  {announcement.icon}
                </div>
                <div className="announcement-content">
                  <h4>{announcement.title}</h4>
                  <p>{announcement.description}</p>
                  <span className="announcement-time">{announcement.time}</span>
                </div>
              </div>
            ))}
            <div className="view-all-announcements" onClick={() => navigate('/dashboard')}>
              <span>View All Announcements</span>
              <IcArrowRight />
            </div>
          </div>
        </div>

        {/* Recent Outlets */}
        <div className="edu-card recent-card">
          <div className="card-header">
            <div className="card-title">
              <h3>Recent Outlets</h3>
            </div>
            <div className="view-all-btn" onClick={() => navigate('/outlet')}>View All</div>
          </div>
          <div className="recent-table">
            <div className="table-header">
              <div className="th">#</div>
              <div className="th">Name</div>
              <div className="th">Division</div>
              <div className="th">Location</div>
              <div className="th">Registration Date</div>
              <div className="th">Status</div>
              <div className="th"></div>
            </div>
            {recentOutlets.map((outlet, index) => (
              <div key={outlet.id || index} className="table-row">
                <div className="td">{index + 1}</div>
                <div className="td">
                  <div className="user-info">
                    <div className="user-avatar">
                      {(outlet.outletName || "O").charAt(0).toUpperCase()}
                    </div>
                    <span>{outlet.outletName ? outlet.outletName.replace(/\b\w/g, l => l.toUpperCase()) : "Unknown Outlet"}</span>
                  </div>
                </div>
                <div className="td">{outlet.division?.name ? outlet.division.name.replace(/\b\w/g, l => l.toUpperCase()) : "General"}</div>
                <div className="td">{outlet.location?.name ? outlet.location.name.replace(/\b\w/g, l => l.toUpperCase()) : "N/A"}</div>
                <div className="td">{new Date().toLocaleDateString()}</div>
                <div className="td">
                  <span className="status-badge active">Active</span>
                </div>
                <div className="td">
                  <IcMoreVert />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="edu-card events-card">
          <div className="card-header">
            <div className="card-title">
              <h3><IcCalendar /> Upcoming Events</h3>
            </div>
            <div className="card-menu">
              <IcMoreVert />
            </div>
          </div>
          <div className="events-list">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-date" style={{ backgroundColor: event.color }}>
                  <div className="event-month">{event.month}</div>
                  <div className="event-day">{event.date}</div>
                </div>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  <p>{event.time}</p>
                </div>
              </div>
            ))}
            <div className="view-all-events" onClick={() => navigate('/dashboard')}>
              <span>View All Events</span>
              <IcArrowRight />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}