import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  IconButton, Box, Typography, Divider, Tooltip 
} from "@mui/material";
import {
  DashboardRounded,
  AccountTreeRounded,
  PlaceRounded,
  StoreRounded,
  InventoryRounded,
  MenuRounded,
  LogoutRounded,
  StorefrontRounded
} from "@mui/icons-material";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardRounded /> },
  { to: "/division", label: "Division", icon: <AccountTreeRounded /> },
  { to: "/location", label: "Location", icon: <PlaceRounded /> },
  { to: "/outlet", label: "Outlet", icon: <StoreRounded /> },
  { to: "/product", label: "Product", icon: <InventoryRounded /> },
];

const drawerWidth = 260;
const collapsedWidth = 80;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate("/");
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: collapsed ? collapsedWidth : drawerWidth,
          boxSizing: "border-box",
          transition: "width 0.3s ease",
          overflowX: "hidden",
          borderRight: "none",
        },
      }}
    >
      {/* Header & Brand */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        p: 2,
        height: 72,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, overflow: "hidden" }}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center",
            alignItems: "center",
            width: 40, 
            height: 40,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            flexShrink: 0,
          }}>
            <StorefrontRounded />
          </Box>
          {!collapsed && (
            <Typography variant="h6" fontWeight="bold" noWrap>
              OutletMS
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 2, display: "flex", justifyContent: collapsed ? "center" : "flex-end" }}>
        <IconButton onClick={() => setCollapsed(!collapsed)} size="small" sx={{ color: "inherit", opacity: 0.7 }}>
          <MenuRounded />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, py: 2 }}>
        {!collapsed && (
          <Typography variant="overline" sx={{ px: 3, mb: 1, display: "block", color: "inherit", opacity: 0.5, fontWeight: 600 }}>
            MAIN MENU
          </Typography>
        )}
        <List sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems.map(({ to, label, icon }) => (
            <Tooltip title={collapsed ? label : ""} placement="right" key={to}>
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={to}
                  sx={{
                    borderRadius: 2,
                    justifyContent: collapsed ? "center" : "flex-start",
                    position: "relative",
                    color: "inherit",
                    opacity: 0.8,
                    "&.active": {
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      opacity: 1,
                      "& .MuiListItemIcon-root": {
                        color: "#ffffff",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
                      opacity: 1,
                      "& .MuiListItemIcon-root": {
                        color: "#ffffff",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: "center",
                      color: "inherit",
                      transition: "color 0.2s",
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>

      {/* Footer / Logout */}
      <Box sx={{ p: 2 }}>
        <List disablePadding>
          <Tooltip title={collapsed ? "Logout" : ""} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  color: "inherit",
                  opacity: 0.8,
                  "&:hover": {
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    opacity: 1,
                    "& .MuiListItemIcon-root": {
                      color: "#ef4444",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  <LogoutRounded />
                </ListItemIcon>
                {!collapsed && <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 500 }} />}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
