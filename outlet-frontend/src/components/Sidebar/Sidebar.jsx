import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/division",
    label: "Division",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="5" y2="17" />
        <line x1="12" y1="7" x2="19" y2="17" />
      </svg>
    ),
  },
  {
    to: "/location",
    label: "Location",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    to: "/outlet",
    label: "Outlet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: "/product",
    label: "Product",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/");
  };

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        {!collapsed && <span className="brand-name">OutletMS</span>}
      </div>

      {/* Hamburger Toggle */}
      <button
        className={`sidebar-toggle ${collapsed ? "is-open" : ""}`}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label="Toggle sidebar"
      >
        <span className="hb-line" />
        <span className="hb-line" />
        <span className="hb-line" />
      </button>

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="nav-section-label">MAIN MENU</span>}
        {navItems.map(({ to, icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            title={collapsed ? label : ""}
          >
            <span className="nav-icon">{icon}</span>
            {!collapsed && <span className="nav-label">{label}</span>}
            {!collapsed && badge && <span className="nav-badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout} title={collapsed ? "Logout" : ""}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
