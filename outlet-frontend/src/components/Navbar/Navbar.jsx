import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Badge,
  IconButton,
  InputBase,
  Divider,
  Tooltip,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ButtonBase,
} from "@mui/material";
import {
  SearchRounded,
  NotificationsRounded,
  PersonRounded,
  SettingsRounded,
  LogoutRounded,
  StoreRounded,
  PlaceRounded,
  AccountTreeRounded,
  KeyboardArrowDownRounded,
} from "@mui/icons-material";
import ModernProfileDrawer from "../ProfileDrawer/ModernProfileDrawer";
import "./Navbar.css";

/* ── Static data ─────────────────────────────────── */
const notifications = [
  { id: 1, Icon: StoreRounded, text: "New outlet registered", time: "2m ago", color: "#7d2ae8" },
  { id: 2, Icon: PlaceRounded, text: "Location data updated", time: "15m ago", color: "#a855f7" },
  { id: 3, Icon: AccountTreeRounded, text: "Division report generated", time: "1h ago", color: "#7c3aed" },
];

/* ── Component ───────────────────────────────────── */
const Navbar = ({ title = "Dashboard" }) => {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  /* User state */
  const [user, setUser] = useState({
    name: localStorage.getItem("username") || "Admin",
    email: localStorage.getItem("email") || localStorage.getItem("userEmail") || "admin@company.com",
    role: localStorage.getItem("role") || "Administrator",
    profilePicture: localStorage.getItem("profilePicture") || null,
  });

  /* Clock */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Search */
  const [search, setSearch] = useState("");

  /* Dropdowns */
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  /* Profile updates */
  useEffect(() => {
    const handleStorageChange = () => {
      setUser({
        name: localStorage.getItem("username") || "Admin",
        email: localStorage.getItem("email") || localStorage.getItem("userEmail") || "admin@company.com",
        role: localStorage.getItem("role") || "Administrator",
        profilePicture: localStorage.getItem("profilePicture") || null,
      });
    };
    window.addEventListener("profileUpdated", handleStorageChange);
    return () => window.removeEventListener("profileUpdated", handleStorageChange);
  }, []);

  /* Click-outside to close dropdowns */
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".navbar-notif-wrap")) setNotifOpen(false);
      if (!e.target.closest(".navbar-user-wrap")) setUserOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* Helpers */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handleOpenProfile = () => {
    setUserOpen(false);
    setProfileDrawerOpen(true);
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  /* Avatar initials */
  const initials = user.name.charAt(0).toUpperCase();

  /* ── JSX ──────────────────────────────────────── */
  return (
    <>
      <Box component="header" className="navbar">

        {/* LEFT — Page title */}
        <Box className="navbar-left">
          <Typography className="nb-page" component="h1">
            {title}
          </Typography>
        </Box>

        {/* CENTER — Animated search */}
        <Box className="navbar-center">
          <Box className="navbar-search">
            <Box className="search-icon-nb">
              <SearchRounded sx={{ fontSize: 20, color: "#7d2ae8" }} />
            </Box>
            <InputBase
              inputRef={searchRef}
              placeholder="Search outlets, locations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                flex: 1,
                fontSize: "0.875rem",
                fontFamily: "Poppins, sans-serif",
                color: "#1e1b4b",
                "& input::placeholder": { color: "#a78bfa", fontSize: "0.8rem" },
              }}
            />
            <Typography component="span" className="search-kbd">⌘K</Typography>
          </Box>
        </Box>

        {/* RIGHT */}
        <Box className="navbar-right">

          {/* Clock */}
          <Box className="navbar-clock" sx={{ display: { xs: "none", sm: "flex" } }}>
            <Typography className="clock-time">{formatTime(time)}</Typography>
            <Typography className="clock-date">{formatDate(time)}</Typography>
          </Box>

          <Box className="navbar-divider" sx={{ display: { xs: "none", sm: "block" } }} />

          {/* Notification bell */}
          <Box className="navbar-notif-wrap">
            <Tooltip title="Notifications" placement="bottom">
              <ButtonBase
                className={`navbar-icon-btn${notifOpen ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setNotifOpen((v) => !v); setUserOpen(false); }}
                disableRipple
              >
                <NotificationsRounded sx={{ fontSize: 20 }} />
                <Box className="notif-badge">{notifications.length}</Box>
              </ButtonBase>
            </Tooltip>

            {/* Notification dropdown */}
            <Fade in={notifOpen}>
              <Box className="notif-dropdown">
                <Box className="notif-header">
                  <Typography className="notif-header-title">Notifications</Typography>
                  <Typography className="notif-count">{notifications.length} new</Typography>
                </Box>

                <List className="notif-list" disablePadding>
                  {notifications.map(({ id, Icon, text, time: t, color }) => (
                    <ListItem
                      key={id}
                      className="notif-item"
                      onClick={() => setNotifOpen(false)}
                      disablePadding
                    >
                      <Box
                        className="notif-item-icon"
                        sx={{ background: `${color}18`, color }}
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box className="notif-item-body">
                        <Typography component="p">{text}</Typography>
                        <Typography component="span">{t}</Typography>
                      </Box>
                      <Box className="notif-dot" sx={{ bgcolor: color }} />
                    </ListItem>
                  ))}
                </List>

                <Box className="notif-footer" onClick={() => setNotifOpen(false)}>
                  View all notifications
                </Box>
              </Box>
            </Fade>
          </Box>

          {/* User button */}
          <Box className="navbar-user-wrap">
            <ButtonBase
              className={`navbar-user${userOpen ? " active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setUserOpen((v) => !v); setNotifOpen(false); }}
              disableRipple
            >
              <Avatar
                className="user-avatar"
                src={user.profilePicture || undefined}
                sx={{ width: 36, height: 36, background: "linear-gradient(135deg, #7d2ae8, #a855f7)" }}
              >
                {!user.profilePicture && initials}
              </Avatar>

              <Box className="user-info" sx={{ display: { xs: "none", md: "flex" } }}>
                <Typography className="user-name">{user.name}</Typography>
                <Typography className="user-role">{user.role}</Typography>
              </Box>

              <Box className="user-chevron">
                <KeyboardArrowDownRounded
                  sx={{
                    fontSize: 18,
                    color: "#7d2ae8",
                    transform: userOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </Box>
            </ButtonBase>

            {/* User dropdown */}
            <Fade in={userOpen}>
              <Box className="user-dropdown">

                {/* Header */}
                <Box className="user-dropdown-header">
                  <Avatar
                    className="user-avatar lg"
                    src={user.profilePicture || undefined}
                    sx={{ width: 46, height: 46, background: "rgba(255,255,255,0.25)" }}
                  >
                    {!user.profilePicture && initials}
                  </Avatar>
                  <Box>
                    <Typography className="ud-name">{user.name}</Typography>
                    <Typography className="ud-role">{user.email}</Typography>
                  </Box>
                  <Box className="ud-status">
                    <Box className="ud-status-dot" />
                    Online
                  </Box>
                </Box>

                {/* Menu items */}
                <List component="ul" className="user-dropdown-menu" disablePadding>
                  <ListItem disablePadding sx={{ borderRadius: "12px", overflow: "hidden", mb: 0.5 }}>
                    <ListItemButton onClick={handleOpenProfile} sx={{ py: 1 }}>
                      <ListItemIcon className="udm-icon" sx={{ minWidth: 30 }}>
                        <PersonRounded sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="My Profile" 
                        primaryTypographyProps={{ fontSize: "13.5px", fontWeight: 500, fontFamily: "Poppins, sans-serif" }} 
                      />
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ borderRadius: "12px", overflow: "hidden" }}>
                    <ListItemButton onClick={() => setUserOpen(false)} sx={{ py: 1 }}>
                      <ListItemIcon className="udm-icon" sx={{ minWidth: 30 }}>
                        <SettingsRounded sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Settings" 
                        primaryTypographyProps={{ fontSize: "13.5px", fontWeight: 500, fontFamily: "Poppins, sans-serif" }} 
                      />
                    </ListItemButton>
                  </ListItem>
                </List>

                <Divider sx={{ borderColor: "rgba(125,42,232,0.1)" }} />

                {/* Logout */}
                <Box className="user-dropdown-footer">
                  <ButtonBase
                    component="button"
                    onClick={handleLogout}
                    disableRipple
                    sx={{ width: "100%", textAlign: "left" }}
                  >
                    <Box className="udm-icon">
                      <LogoutRounded sx={{ fontSize: 18, color: "inherit" }} />
                    </Box>
                    Sign Out
                  </ButtonBase>
                </Box>

              </Box>
            </Fade>
          </Box>

        </Box>
      </Box>

      {/* Profile Drawer */}
      <ModernProfileDrawer
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />
    </>
  );
};

export default Navbar;