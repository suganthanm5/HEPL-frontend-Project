import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, ButtonBase, IconButton, InputBase, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, Tooltip, CircularProgress,
  Snackbar, Alert, Chip, Paper, Grid, Stack,
} from "@mui/material";
import {
  PersonAddRounded, SearchRounded, EditRounded,
  DeleteRounded, PeopleRounded, AdminPanelSettingsRounded,
  ManageAccountsRounded, PersonRounded, CloseRounded,
  CheckRounded,
} from "@mui/icons-material";
import { userService } from "../../services/userService";
import { outletService } from "../../services/outletService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import { formatUserData } from "../../utils/exportUtils";
import "./UserManagement.css";

/* ── Static stat colours ───────────────────────── */
const ROLE_META = {
  ADMIN: { label: "Admin", cls: "admin", color: "#7d2ae8", bg: "#f3e8ff", Icon: AdminPanelSettingsRounded },
  MANAGER: { label: "Manager", cls: "manager", color: "#0284c7", bg: "#e0f2fe", Icon: ManageAccountsRounded },
  USER: { label: "User", cls: "user", color: "#16a34a", bg: "#dcfce7", Icon: PersonRounded },
};

const ROLES = ["ADMIN", "MANAGER", "USER"];


const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

const emptyForm = { name: "", username: "", email: "", password: "", roles: ["USER"], status: "ACTIVE", outletId: "" };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormView, setIsFormView] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "add", data: emptyForm });
  const [delDialog, setDelDialog] = useState({ open: false, id: null, name: "" });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });


  const load = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[DEBUG] Fetching users...');
      const data = await userService.getAllUsers();
      console.log('[DEBUG] Users fetched:', data);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[DEBUG] Failed to load users:", err);
      console.error("[DEBUG] Error response:", err.response?.data);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    outletService.getAll(0, 1000).then(data => setOutlets(data.content || []));
  }, [load]);

  
  const filtered = users.filter((u) =>
    [u.name, u.username, u.email, u.role]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );


  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});


  const toast = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  
  const handleSave = async () => {
    const { mode, data } = dialog;
    try {
      if (mode === "add") {
        await userService.createUser(data);
        toast("User created successfully");
      } else {
        await userService.updateUser(data.id, data);
        toast("User updated successfully");
      }
      setDialog({ open: false, mode: "add", data: emptyForm });
      setIsFormView(false);
      load();
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      const errorData = err.response?.data?.data;

      if (errorData && typeof errorData === 'object') {
        
        const messages = Object.entries(errorData)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(" | ");
        toast(messages || "Validation failed", "error");
      } else {
        const msg = err.response?.data?.message || "Operation failed";
        toast(msg, "error");
      }
    }
  };


  const handleDelete = async () => {
    try {
      await userService.deleteUser(delDialog.id);
      toast("User deleted");
      setDelDialog({ open: false, id: null, name: "" });
      load();
    } catch {
      toast("Delete failed", "error");
    }
  };


  return (
    <Box className="user-mgmt-page">

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton onClick={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }} sx={{ color: "#64748b" }}>
                  <CloseRounded />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "Poppins, sans-serif" }}>
                    {dialog.mode === "add" ? "Add New User" : "Edit User"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "Poppins, sans-serif" }}>
                    {dialog.mode === "add" ? "Fill in the details to create a new user" : `Updating details for ${dialog.data.name || dialog.data.username}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button variant="outlined" color="inherit"
                  onClick={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }}
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", borderRadius: "50px", textTransform: "none", px: 3 }}>
                  Cancel
                </Button>
                <Button variant="contained" startIcon={<CheckRounded />}
                  onClick={handleSave}
                  sx={{
                    borderRadius: "50px",
                    background: "linear-gradient(135deg, #7d2ae8, #a855f7)",
                    color: "#fff",
                    textTransform: "none",
                    px: 4,
                    boxShadow: "0 4px 12px rgba(125,42,232,0.35)",
                    "&:hover": { background: "linear-gradient(135deg, #6b21c1, #9333ea)" }
                  }}>
                  {dialog.mode === "add" ? "Create User" : "Save Changes"}
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Full Name</Typography>
                      <TextField fullWidth size="small" placeholder="Enter full name" value={dialog.data.name}
                        onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, name: e.target.value } }))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
                    </Box>
                    <Box>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Username</Typography>
                      <TextField fullWidth size="small" placeholder="Enter username" value={dialog.data.username}
                        onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, username: e.target.value } }))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
                    </Box>
                    <Box>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Email</Typography>
                      <TextField fullWidth size="small" type="email" placeholder="Enter email" value={dialog.data.email}
                        onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, email: e.target.value } }))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
                    </Box>
                    {dialog.mode === "add" && (
                      <Box>
                        <Typography className="dialog-field-label" sx={{ mb: 1 }}>Password</Typography>
                        <TextField fullWidth size="small" type="password" placeholder="Enter password" value={dialog.data.password}
                          onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, password: e.target.value } }))}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
                      </Box>
                    )}
                    <Box>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Role</Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={dialog.data.role || "USER"}
                          onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, role: e.target.value } }))}
                          sx={{ borderRadius: 2, fontFamily: "Poppins, sans-serif" }}
                        >
                          {ROLES.map((r) => (
                            <MenuItem key={r} value={r} sx={{ fontFamily: "Poppins, sans-serif" }}>
                              {ROLE_META[r].label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ p: 4, bgcolor: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <Avatar sx={{ width: 120, height: 120, mb: 2, background: "linear-gradient(135deg, #7d2ae8, #a855f7)", fontSize: "3rem", fontWeight: 700 }}>
                      {initials(dialog.data.name || dialog.data.username)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>
                      {dialog.data.name || "New User"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
                      @{dialog.data.username || "username"}
                    </Typography>
                    <Chip
                      label={ROLE_META[dialog.data.role || "USER"].label}
                      sx={{
                        bgcolor: ROLE_META[dialog.data.role || "USER"].bg,
                        color: ROLE_META[dialog.data.role || "USER"].color,
                        fontWeight: 700,
                        fontFamily: "Poppins, sans-serif"
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      ) : (
        <>
          {/* Header */}
          <Box className="page-header">
            <Box className="page-header-left">
              <Typography className="page-title">User Management</Typography>
              <Typography className="page-subtitle">Manage users and their roles</Typography>
            </Box>
            <ButtonBase
              onClick={() => { setDialog({ open: true, mode: "add", data: emptyForm }); setIsFormView(true); }}
              sx={{
                display: "flex", alignItems: "center", gap: 1,
                px: 2.5, py: 1.2, borderRadius: "50px",
                background: "linear-gradient(135deg, #7d2ae8, #a855f7)",
                color: "#fff", fontFamily: "Poppins, sans-serif",
                fontSize: "0.875rem", fontWeight: 600,
                boxShadow: "0 4px 16px rgba(125,42,232,0.35)",
                transition: "all 0.25s ease",
                "&:hover": { transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(125,42,232,0.45)" },
              }}
              disableRipple
            >
              <PersonAddRounded sx={{ fontSize: 18 }} />
              Add User
            </ButtonBase>
          </Box>


          {/* Stat Cards */}
          <Box className="stat-cards-row">
            <Box className="stat-card">
              <Box className="stat-card-icon" sx={{ background: "#f5f0ff" }}>
                <PeopleRounded sx={{ color: "#7d2ae8", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography className="stat-card-value">{users.length}</Typography>
                <Typography className="stat-card-label">Total Users</Typography>
              </Box>
            </Box>
            {ROLES.map((r) => {
              const meta = ROLE_META[r];
              return (
                <Box className="stat-card" key={r}>
                  <Box className="stat-card-icon" sx={{ background: meta.bg }}>
                    <meta.Icon sx={{ color: meta.color, fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography className="stat-card-value">{counts[r] || 0}</Typography>
                    <Typography className="stat-card-label">{meta.label}s</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Table */}
          <Box className="table-card">
            <Box className="table-toolbar">
              <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>
                All Users
              </Typography>
              <ExportMenu getData={() => formatUserData(filtered)} filename="users" title="User Report" backendType="users" />
              <Box className="table-search">
                <SearchRounded sx={{ fontSize: 18, color: "#7d2ae8", flexShrink: 0 }} />
                <InputBase
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}
                />
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: "#faf5ff" }}>
                    {["User", "Username", "Email", "Role", "Status", "Actions"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#7d2ae8", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress sx={{ color: "#7d2ae8" }} size={32} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => {
                      const meta = ROLE_META[u.role] || ROLE_META.USER;
                      return (
                        <TableRow key={u.id} hover sx={{ "&:hover": { background: "#faf5ff" } }}>
                          <TableCell sx={{ py: 1.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Avatar sx={{ width: 34, height: 34, background: `linear-gradient(135deg, ${meta.color}, #a855f7)`, fontSize: "0.8rem", fontWeight: 700 }}>
                                {initials(u.name || u.username)}
                              </Avatar>
                              <Typography sx={{ fontWeight: 600, color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>
                                {u.name || u.username}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{u.username}</TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{u.email}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Typography className={`role-chip ${meta.cls}`}>{meta.label}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box className={`status-chip ${u.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                              <Box className="status-dot" sx={{ background: u.status?.toLowerCase() === "active" ? "#16a34a" : "#ef4444" }} />
                              {u.status || "Active"}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                              <Tooltip title="Edit user">
                                <ButtonBase
                                  className="action-btn edit"
                                  onClick={() => { setDialog({ open: true, mode: "edit", data: { ...u } }); setIsFormView(true); }}
                                  disableRipple
                                >
                                  <EditRounded sx={{ fontSize: 16 }} />
                                </ButtonBase>
                              </Tooltip>
                              <Tooltip title="Delete user">
                                <ButtonBase
                                  className="action-btn delete"
                                  onClick={() => setDelDialog({ open: true, id: u.id, name: u.name || u.username })}
                                  disableRipple
                                >
                                  <DeleteRounded sx={{ fontSize: 16 }} />
                                </ButtonBase>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      {/* Add/Edit Dialog (REPLACED) */}
      {/* Add/Edit Dialog (REPLACED) */}

      {/* Delete Confirm Dialog */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, id: null, name: "" })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#1e1b4b" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "Poppins, sans-serif", color: "#64748b", fontSize: "0.9rem" }}>
            Are you sure you want to delete <strong>{delDialog.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <ButtonBase onClick={() => setDelDialog({ open: false, id: null, name: "" })} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
            Cancel
          </ButtonBase>
          <ButtonBase onClick={handleDelete} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "#ef4444", color: "#fff", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600, boxShadow: "0 4px 12px rgba(239,68,68,0.35)" }}>
            Delete
          </ButtonBase>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "Poppins, sans-serif" }}>
          {snack.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default UserManagement;
