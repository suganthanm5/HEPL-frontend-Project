import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  InputBase,
  ButtonBase,
} from "@mui/material";
import {
  DashboardRounded,
  AccountTreeRounded,
  PlaceRounded,
  StoreRounded,
  InventoryRounded,
  StorefrontRounded,
  LogoutRounded,
  DarkModeRounded,
  LightModeRounded,
  SearchRounded,
  ChevronLeftRounded,
  PeopleRounded,
  InventoryRounded as BatchIcon,
  SwapHorizRounded,
  ShoppingCartRounded,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

/* All nav items with role visibility */
const ALL_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardRounded />, roles: ["ADMIN", "MANAGER", "USER"] },
  { to: "/users", label: "User Management", icon: <PeopleRounded />, roles: ["ADMIN"] },
  { to: "/division", label: "Division", icon: <AccountTreeRounded />, roles: ["ADMIN"] },
  { to: "/location", label: "Location", icon: <PlaceRounded />, roles: ["ADMIN"] },
  { to: "/outlet", label: "Outlet", icon: <StoreRounded />, roles: ["ADMIN", "MANAGER"] },
  { to: "/product", label: "Product", icon: <InventoryRounded />, roles: ["ADMIN", "MANAGER"] },
  { to: "/batch", label: "Batch", icon: <BatchIcon />, roles: ["ADMIN", "MANAGER"] },
  { to: "/stock", label: "Stock", icon: <SwapHorizRounded />, roles: ["ADMIN", "MANAGER", "USER"] },
  { to: "/orders", label: "Orders", icon: <ShoppingCartRounded />, roles: ["ADMIN", "MANAGER", "USER"] },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const searchInputRef = useRef(null);

  // ── Theme ─────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return saved === "dark" || (!saved && sysDark);
  });

  // Persist theme preference — only the sidebar class changes, NOT body
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // ── Search ────────────────────────────────────────────────
  const [search, setSearch] = useState("");

  const handleSearchClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => searchInputRef.current?.focus(), 420);
    }
  };

  // ── Mobile overlay close ──────────────────────────────────
  useEffect(() => {
    const handleBodyClick = (e) => {
      if (
        window.innerWidth <= 768 &&
        !collapsed &&
        !e.target.closest(".new-sidebar")
      ) {
        setCollapsed(true);
        document.body.classList.remove("sidebar-open");
      }
    };
    document.addEventListener("click", handleBodyClick);
    return () => document.removeEventListener("click", handleBodyClick);
  }, [collapsed, setCollapsed]);

  // Keep body class in sync for mobile overlay
  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.classList.toggle("sidebar-open", !collapsed);
    }
  }, [collapsed]);

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ── Toggle ────────────────────────────────────────────────
  const handleToggle = () => setCollapsed((prev) => !prev);

  // Filtered nav: first by role, then by search
  const filteredNav = ALL_NAV
    .filter((item) => !item.roles || !role || item.roles.includes(role))
    .filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box
      component="aside"
      className={`new-sidebar${collapsed ? " collapsed" : ""}${isDark ? " dark-theme" : ""}`}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <Box className="sidebar-header">
        <Box className="header-logo">
          <StorefrontRounded sx={{ fontSize: 22, color: "#fff" }} />
        </Box>

        <Typography component="span" className="header-brand-name">
          OutletMS
        </Typography>

        <ButtonBase
          className="sidebar-toggle-btn"
          onClick={handleToggle}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeftRounded className="toggle-icon" sx={{ fontSize: "1.75rem" }} />
        </ButtonBase>
      </Box>

      {/* ── Content ────────────────────────────────────── */}
      <Box className="sidebar-content">

        {/* Search */}
        <Box className="new-search-form" onClick={handleSearchClick}>
          <SearchRounded
            className="search-icon"
            sx={{ color: "var(--color-text-placeholder)", fontSize: "1.3rem" }}
          />
          <InputBase
            inputRef={searchInputRef}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ style: { pointerEvents: collapsed ? "none" : "auto" } }}
            sx={{
              ml: "15px",
              flex: 1,
              fontSize: "1rem",
              fontFamily: "Poppins, sans-serif",
              color: "var(--color-text-primary)",
              "& input::placeholder": { color: "var(--color-text-placeholder)" },
            }}
          />
        </Box>

        {/* Section label */}
        <Typography component="div" className="nav-section-label">
          Main Menu
        </Typography>

        {/* Menu links */}
        <List className="new-menu-list" disablePadding>
          {filteredNav.map(({ to, label, icon }) => (
            <ListItem key={to} disablePadding>
              <NavLink
                to={to}
                title={collapsed ? label : ""}
                className={({ isActive }) =>
                  `new-menu-link${isActive ? " active" : ""}`
                }
              >
                <Box component="span" className="menu-icon">{icon}</Box>
                <Typography component="span" className="new-menu-label">
                  {label}
                </Typography>
              </NavLink>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* ── Footer ─────────────────────────────────────── */}
      <Box className="new-sidebar-footer">

        {/* Theme toggle */}
        <ButtonBase className="theme-toggle" onClick={toggleTheme} disableRipple>
          <Box component="span" className="theme-label">
            {isDark ? (
              <LightModeRounded sx={{ fontSize: "1.3rem", color: "var(--color-text-primary)" }} />
            ) : (
              <DarkModeRounded sx={{ fontSize: "1.3rem", color: "var(--color-text-primary)" }} />
            )}
            <Typography component="span" className="theme-text">
              {isDark ? "Light Mode" : "Dark Mode"}
            </Typography>
          </Box>

          <Box className="theme-toggle-track">
            <Box className="theme-toggle-indicator" />
          </Box>
        </ButtonBase>

        {/* Logout */}
        <ButtonBase
          className="logout-btn"
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : ""}
          disableRipple
        >
          <Box component="span" className="menu-icon">
            <LogoutRounded sx={{ fontSize: "1.2rem" }} />
          </Box>
          <Typography component="span" className="new-menu-label">
            Sign Out
          </Typography>
        </ButtonBase>

      </Box>
    </Box>
  );
};

export default Sidebar;