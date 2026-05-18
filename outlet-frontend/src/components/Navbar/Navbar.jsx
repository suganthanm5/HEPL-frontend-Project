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
  WarningAmberRounded,
} from "@mui/icons-material";
import ModernProfileDrawer from "../ProfileDrawer/ModernProfileDrawer";
import { getCookie, deleteCookie } from "../../utils/cookieUtils";
import { reportService } from "../../services/reportService";
import { getLocations } from "../../services/locationService";
import { getProducts } from "../../services/productService";
import { outletService } from "../../services/outletService";
import { orderService } from "../../services/orderService";
import { useMemo } from "react";
import "./Navbar.css";

// Dynamic notifications list fetched from dashboard summary metrics

/* ── Component ───────────────────────────────────── */
const Navbar = ({ title = "Dashboard" }) => {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  /* User state */
  const [user, setUser] = useState(() => ({
    name: getCookie("username") || "Admin",
    email: getCookie("email") || "admin@company.com",
    role: getCookie("role") || "Administrator",
    profilePicture: localStorage.getItem("profilePicture") || null,
  }));

  /* Clock */
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Dynamic Summary Alerts & Notifications from Live Database Tables */
  const [summary, setSummary] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [outletsList, setOutletsList] = useState([]);
  const [locationsListRaw, setLocationsListRaw] = useState([]);
  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchNavbarData = async () => {
      try {
        const [summ, ords, outs, locs, prods] = await Promise.all([
          reportService.getDashboardSummary().catch(() => null),
          orderService.getAll({ size: 10 }).catch(() => null),
          outletService.getAll(0, 10, "").catch(() => null),
          getLocations(0, 10, "").catch(() => null),
          getProducts(0, 10).catch(() => null)
        ]);

        if (!active) return;
        if (summ) setSummary(summ);
        
        if (ords) {
          const oList = ords.content ?? ords.data?.content ?? ords.data ?? ords;
          if (Array.isArray(oList)) setOrdersList(oList);
        }
        
        if (outs) {
          const ouList = outs.content ?? outs.data?.content ?? outs.data ?? outs;
          if (Array.isArray(ouList)) setOutletsList(ouList);
        }
        
        if (locs) {
          const lList = locs.content ?? locs.data?.content ?? locs.data ?? locs;
          if (Array.isArray(lList)) setLocationsListRaw(lList);
        }
        
        if (prods) {
          const pList = prods.content ?? prods.data?.content ?? prods.data ?? prods;
          if (Array.isArray(pList)) setProductsList(pList);
        }
      } catch (err) {
        console.error("Navbar: Failed to fetch notifications details", err);
      }
    };

    fetchNavbarData();
    return () => {
      active = false;
    };
  }, []);

  const notificationsList = useMemo(() => {
    const list = [];

    // 1. Live Critically Low Stock warning from summary (Urgent)
    if (summary?.lowStockCount > 0) {
      list.push({
        id: "alert-low-stock",
        Icon: WarningAmberRounded,
        text: `${summary.lowStockCount} items running critically low on stock`,
        time: "Action Required",
        color: "#f59e0b",
        onClick: () => navigate("/stock")
      });
    }

    // 2. Live Pending orders count warning from summary (Urgent)
    if (summary?.pendingOrdersCount > 0) {
      list.push({
        id: "alert-pending-orders",
        Icon: StoreRounded,
        text: `${summary.pendingOrdersCount} orders are pending your approval`,
        time: "Action Required",
        color: "#ef4444",
        onClick: () => navigate("/orders")
      });
    }

    // 3. Real-time individual Orders Activity (Pending, Rejected, Completed)
    ordersList.slice(0, 5).forEach((order) => {
      const orderNo = order.orderNo || `ORD-${order.id}`;
      const status = (order.status || "").toUpperCase();
      let text = `Order ${orderNo} status updated`;
      let timeLabel = "Status changed";
      let color = "#7d2ae8";
      
      if (status === "PENDING") {
        text = `Order ${orderNo} is pending approval`;
        timeLabel = "Order pending";
        color = "#ef4444";
      } else if (status === "REJECTED" || status === "CANCELLED") {
        text = `Order ${orderNo} has been rejected`;
        timeLabel = "Order rejected";
        color = "#ea580c";
      } else if (status === "COMPLETED" || status === "DELIVERED") {
        text = `Order ${orderNo} is completed`;
        timeLabel = "Order completed";
        color = "#10b981";
      }

      list.push({
        id: `order-${order.id}-${status}`,
        Icon: StoreRounded,
        text,
        time: timeLabel,
        color,
        onClick: () => navigate("/orders")
      });
    });

    // 4. Real-time Outlets Activity (Newly added Outlets)
    outletsList.slice(0, 3).forEach((outlet) => {
      list.push({
        id: `outlet-${outlet.id}`,
        Icon: StoreRounded,
        text: `New outlet "${outlet.outletName}" registered`,
        time: `Code: ${outlet.outletCode || "Active"}`,
        color: "#7c3aed",
        onClick: () => navigate("/outlet")
      });
    });

    // 5. Real-time Locations Activity (Newly added Locations)
    locationsListRaw.slice(0, 3).forEach((location) => {
      list.push({
        id: `location-${location.id}`,
        Icon: PlaceRounded,
        text: `New location "${location.name}" added to grid`,
        time: `${location.city || "Operational"} node`,
        color: "#0ea5e9",
        onClick: () => navigate("/location")
      });
    });

    // 6. Real-time Products Activity (Newly added Products)
    productsList.slice(0, 3).forEach((product) => {
      list.push({
        id: `product-${product.id}`,
        Icon: AccountTreeRounded,
        text: `New product "${product.name}" added`,
        time: `Code: ${product.productCode || "Active"}`,
        color: "#db2777",
        onClick: () => navigate("/product")
      });
    });

    // Deduplicate notifications by id
    const seenIds = new Set();
    return list.filter(item => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    }).slice(0, 8); // Display at most 8 notifications to keep user experience premium
  }, [summary, ordersList, outletsList, locationsListRaw, productsList, navigate]);

  /* Search */
  const [search, setSearch] = useState("");

  /* Dropdowns */
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  /* Profile updates and sync across tabs */
  useEffect(() => {
    const handleStorageChange = () => {
      setUser({
        name: getCookie("username") || "Admin",
        email: getCookie("email") || "admin@company.com",
        role: getCookie("role") || "Administrator",
        profilePicture: localStorage.getItem("profilePicture") || null,
      });
    };
    
    const handleStorageEvent = (e) => {
      if (e.key === "username" || e.key === "email" || e.key === "role" || e.key === "profilePicture") {
        handleStorageChange();
      }
    };
    
    window.addEventListener("profileUpdated", handleStorageChange);
    window.addEventListener("storage", handleStorageEvent);
    
    return () => {
      window.removeEventListener("profileUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageEvent);
    };
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
    deleteCookie("token");
    deleteCookie("username");
    deleteCookie("email");
    deleteCookie("role");
    deleteCookie("user");
    deleteCookie("outletId");
    navigate("/");
  };

  const handleOpenProfile = () => {
    setUserOpen(false);
    setProfileDrawerOpen(true);
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  /* Avatar initials */
  const initials = (user.name || "A").charAt(0).toUpperCase();

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
                "& input::placeholder": { color: "#7d2ae880", fontSize: "0.85rem" },
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
                {notificationsList.length > 0 && (
                  <Box className="notif-badge">{notificationsList.length}</Box>
                )}
              </ButtonBase>
            </Tooltip>

            {/* Notification dropdown */}
            <Fade in={notifOpen}>
              <Box className="notif-dropdown">
                <Box className="notif-header">
                  <Typography className="notif-header-title">Notifications</Typography>
                  <Typography className="notif-count">{notificationsList.length} new</Typography>
                </Box>

                <List className="notif-list" disablePadding>
                  {notificationsList.map(({ id, Icon, text, time: t, color, onClick }) => (
                    <ListItem
                      key={id}
                      className="notif-item"
                      onClick={() => {
                        if (onClick) onClick();
                        setNotifOpen(false);
                      }}
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

                <Box className="notif-footer" onClick={() => { navigate("/notifications"); setNotifOpen(false); }}>
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
                <Typography className="user-name">{user.name || "User"}</Typography>
                <Typography className="user-role">{user.role || "User"}</Typography>
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
                      <Typography sx={{ fontSize: "13.5px", fontWeight: 500, fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}>
                        My Profile
                      </Typography>
                    </ListItemButton>
                  </ListItem>

                  <ListItem disablePadding sx={{ borderRadius: "12px", overflow: "hidden" }}>
                    <ListItemButton onClick={() => setUserOpen(false)} sx={{ py: 1 }}>
                      <ListItemIcon className="udm-icon" sx={{ minWidth: 30 }}>
                        <SettingsRounded sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      <Typography sx={{ fontSize: "13.5px", fontWeight: 500, fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}>
                        Settings
                      </Typography>
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