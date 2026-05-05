import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, IconButton, InputBase, Badge, Avatar, Menu, MenuItem,
  Box, Typography, Divider, Paper
} from "@mui/material";
import {
  SearchRounded,
  NotificationsRounded,
  PersonRounded,
  SettingsRounded,
  LogoutRounded,
  StoreRounded,
  PlaceRounded,
  AccountTreeRounded
} from "@mui/icons-material";
import ModernProfileDrawer from '../ProfileDrawer/ModernProfileDrawer';

const notifications = [
  { id: 1, Icon: StoreRounded, text: "New outlet registered", time: "2m ago", color: "#6366f1" },
  { id: 2, Icon: PlaceRounded, text: "Location data updated", time: "15m ago", color: "#8b5cf6" },
  { id: 3, Icon: AccountTreeRounded, text: "Division report generated", time: "1h ago", color: "#06b6d4" },
];

const Navbar = ({ title = "Dashboard" }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: localStorage.getItem("username") || "Admin",
    email: localStorage.getItem("email") || localStorage.getItem("userEmail") || "admin@company.com",
    role: localStorage.getItem("role") || "Administrator",
    profilePicture: localStorage.getItem("profilePicture") || null
  });

  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState("");
  
  // Dropdown anchors
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleStorageChange = () => {
      setUser({
        name: localStorage.getItem("username") || "Admin",
        email: localStorage.getItem("email") || localStorage.getItem("userEmail") || "admin@company.com",
        role: localStorage.getItem("role") || "Administrator",
        profilePicture: localStorage.getItem("profilePicture") || null
      });
    };

    // Listen for custom profile update event
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const handleOpenProfile = () => {
    setAnchorElUser(null);
    setProfileDrawerOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 4 } }}>
        {/* LEFT */}
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 200 }}>
          <Typography variant="h5" color="inherit" fontWeight="bold">
            {title}
          </Typography>
        </Box>

        {/* CENTER — search */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: 400,
              p: '2px 12px',
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              '&:focus-within': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <SearchRounded sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }} />
            <InputBase
              sx={{ ml: 1, flex: 1, color: 'inherit' }}
              placeholder="Search outlets, locations, divisions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Typography variant="caption" sx={{ 
              border: '1px solid', borderColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: 1, px: 0.5, color: 'rgba(255, 255, 255, 0.7)',
              display: { xs: 'none', lg: 'block' }
            }}>
              ⌘K
            </Typography>
          </Paper>
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 200, justifyContent: "flex-end" }}>
          
          {/* Clock */}
          <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" color="inherit" fontWeight={600} lineHeight={1.2}>
              {formatTime(time)}
            </Typography>
            <Typography variant="caption" sx={{ color: "inherit", opacity: 0.7 }}>
              {formatDate(time)}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ my: 1, display: { xs: "none", sm: "block" }, borderColor: "rgba(255, 255, 255, 0.2)" }} />

          {/* Bell */}
          <IconButton onClick={(e) => setAnchorElNotif(e.currentTarget)} sx={{ color: "inherit" }}>
            <Badge badgeContent={notifications.length} color="error" overlap="circular">
              <NotificationsRounded sx={{ color: 'inherit' }} />
            </Badge>
          </IconButton>
          
          {/* Notifications Menu */}
          <Menu
            anchorEl={anchorElNotif}
            open={Boolean(anchorElNotif)}
            onClose={() => setAnchorElNotif(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { width: 320, mt: 1.5, borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>{notifications.length} new</Typography>
            </Box>
            <Divider />
            {notifications.map(({ id, Icon, text, time: t, color }) => (
              <MenuItem key={id} sx={{ p: 2, gap: 2 }} onClick={() => setAnchorElNotif(null)}>
                <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 40, height: 40 }}>
                  <Icon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.primary" fontWeight={500}>{text}</Typography>
                  <Typography variant="caption" color="text.secondary">{t}</Typography>
                </Box>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              </MenuItem>
            ))}
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>View all notifications</Typography>
            </Box>
          </Menu>

          {/* User */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={(e) => setAnchorElUser(e.currentTarget)}
          >
            <Avatar 
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', width: 40, height: 40 }}
              src={user.profilePicture}
            >
              {!user.profilePicture && user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight="bold" color="inherit">{user.name}</Typography>
              <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}>{user.role}</Typography>
            </Box>
          </Box>

          {/* User Menu */}
          <Menu
            anchorEl={anchorElUser}
            open={Boolean(anchorElUser)}
            onClose={() => setAnchorElUser(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { width: 240, mt: 1.5, borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}
                src={user.profilePicture}
              >
                {!user.profilePicture && user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.role}</Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={handleOpenProfile} sx={{ gap: 2, py: 1.5 }}>
              <PersonRounded fontSize="small" sx={{ color: 'text.secondary' }} />
              My Profile
            </MenuItem>
            <MenuItem onClick={() => setAnchorElUser(null)} sx={{ gap: 2, py: 1.5 }}>
              <SettingsRounded fontSize="small" sx={{ color: 'text.secondary' }} />
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ gap: 2, py: 1.5, color: 'error.main' }}>
              <LogoutRounded fontSize="small" color="inherit" />
              Sign Out
            </MenuItem>
          </Menu>

        </Box>
      </Toolbar>
      
      {/* Profile Drawer */}
      <ModernProfileDrawer 
        open={profileDrawerOpen} 
        onClose={() => setProfileDrawerOpen(false)} 
      />
    </AppBar>
  );
};

export default Navbar;
