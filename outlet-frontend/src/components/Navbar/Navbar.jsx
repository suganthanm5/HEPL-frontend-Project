import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const IconChevron = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconOutlet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
  </svg>
);

const IconDivision = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
    <line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" />
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const notifications = [
  { id: 1, Icon: IconOutlet,   text: "New outlet registered",     time: "2m ago",  color: "#6366f1" },
  { id: 2, Icon: IconLocation, text: "Location data updated",     time: "15m ago", color: "#8b5cf6" },
  { id: 3, Icon: IconDivision, text: "Division report generated", time: "1h ago",  color: "#06b6d4" },
];

const Navbar = ({ title = "Dashboard" }) => {
  const user     = localStorage.getItem("username") || "Admin";
  const navigate = useNavigate();

  const [time, setTime]         = useState(new Date());
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch]     = useState("");
  const dropRef  = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (d) =>
    d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <header className="navbar">

      {/* LEFT */}
      <div className="navbar-left">
        <h1 className="nb-page">{title}</h1>
      </div>

      {/* CENTER — search */}
      <div className="navbar-center">
        <div className="navbar-search">
          <span className="search-icon"><IconSearch /></span>
          <input
            type="text"
            placeholder="Search outlets, locations, divisions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">

        {/* Clock */}
        <div className="navbar-clock">
          <span className="clock-time">{formatTime(time)}</span>
          <span className="clock-date">{formatDate(time)}</span>
        </div>

        <div className="navbar-divider" />

        {/* Bell */}
        <div className="navbar-notif-wrap" ref={notifRef}>
          <button
            className={`navbar-icon-btn ${notifOpen ? "active" : ""}`}
            onClick={() => { setNotifOpen(!notifOpen); setDropOpen(false); }}
            aria-label="Notifications"
          >
            <IconBell />
            <span className="notif-badge">{notifications.length}</span>
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-header-title">Notifications</span>
                <span className="notif-count">{notifications.length} new</span>
              </div>
              <ul className="notif-list">
                {notifications.map(({ id, Icon, text, time: t, color }) => (
                  <li key={id} className="notif-item">
                    <span className="notif-item-icon" style={{ background: `${color}15`, color }}>
                      <Icon />
                    </span>
                    <div className="notif-item-body">
                      <p>{text}</p>
                      <span>{t}</span>
                    </div>
                    <span className="notif-dot" style={{ background: color }} />
                  </li>
                ))}
              </ul>
              <div className="notif-footer">View all notifications</div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="navbar-user-wrap" ref={dropRef}>
          <button
            className={`navbar-user ${dropOpen ? "active" : ""}`}
            onClick={() => { setDropOpen(!dropOpen); setNotifOpen(false); }}
          >
            <div className="user-avatar">{user.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user}</span>
              <span className="user-role">Administrator</span>
            </div>
            <span className="user-chevron"><IconChevron open={dropOpen} /></span>
          </button>

          {dropOpen && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-avatar lg">{user.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="ud-name">{user}</p>
                  <p className="ud-role">Administrator</p>
                </div>
                <span className="ud-status">
                  <span className="ud-status-dot" />
                  Online
                </span>
              </div>
              <ul className="user-dropdown-menu">
                <li>
                  <span className="udm-icon"><IconUser /></span>
                  <span>My Profile</span>
                </li>
                <li>
                  <span className="udm-icon"><IconSettings /></span>
                  <span>Settings</span>
                </li>
              </ul>
              <div className="user-dropdown-footer">
                <button onClick={handleLogout}>
                  <span className="udm-icon"><IconLogout /></span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
