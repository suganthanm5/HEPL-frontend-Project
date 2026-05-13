import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, ButtonBase, InputBase, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, Tooltip, CircularProgress,
  Snackbar, Alert, Chip,
} from "@mui/material";
import {
  PersonAddRounded, SearchRounded, EditRounded,
  DeleteRounded, PeopleRounded, AdminPanelSettingsRounded,
  ManageAccountsRounded, PersonRounded, CloseRounded,
  CheckRounded,
} from "@mui/icons-material";
import { userService } from "../../services/userService";
import { outletService } from "../../services/outletService";
import "./UserManagement.css";

/* ── Static stat colours ───────────────────────── */
const ROLE_META = {
  ADMIN: { label: "Admin", cls: "admin", color: "#7d2ae8", bg: "#f3e8ff", Icon: AdminPanelSettingsRounded },
  MANAGER: { label: "Manager", cls: "manager", color: "#0284c7", bg: "#e0f2fe", Icon: ManageAccountsRounded },
  USER: { label: "User", cls: "user", color: "#16a34a", bg: "#dcfce7", Icon: PersonRounded },
};

const ROLES = ["ADMIN", "MANAGER", "USER"];

/* ── Helpers ───────────────────────────────────── */
const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

const emptyForm = { name: "", username: "", email: "", password: "", role: "USER", status: "ACTIVE", outletId: "" };

/* ══════════════════════════════════════════════════
   UserManagement Page
══════════════════════════════════════════════════ */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState({ open: false, mode: "add", data: emptyForm });
  const [delDialog, setDelDialog] = useState({ open: false, id: null, name: "" });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  /* ── Load users ── */
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

  /* ── Filter ── */
  const filtered = users.filter((u) =>
    [u.name, u.username, u.email, u.role]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  /* ── Counts ── */
  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  /* ── Snack helper ── */
  const toast = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  /* ── Save (add / edit) ── */
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
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed";
      toast(msg, "error");
    }
  };

  /* ── Delete ── */
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

  /* ── JSX ── */
  return (
    <Box className="user-mgmt-page">

      {/* Header */}
      <Box className="page-header">
        <Box className="page-header-left">
          <Typography className="page-title">User Management</Typography>
          <Typography className="page-subtitle">Manage users and their roles</Typography>
        </Box>
        <ButtonBase
          onClick={() => setDialog({ open: true, mode: "add", data: emptyForm })}
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
                        <Typography className={`role-chip ${meta.cls}`}>{meta.label}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box className={`status-chip ${u.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                          <Box className="status-dot" sx={{ background: u.status?.toLowerCase() === "active" ? "#16a34a" : "#ef4444" }} />
                          {u.status || "Active"}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.75 }}>
                          <Tooltip title="Edit role">
                            <ButtonBase
                              className="action-btn edit"
                              onClick={() => setDialog({ open: true, mode: "edit", data: { ...u } })}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: "add", data: emptyForm })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle className="user-dialog-title">
          {dialog.mode === "add" ? "Add New User" : "Edit User"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography className="dialog-field-label">Full Name</Typography>
              <TextField fullWidth size="small" placeholder="Enter full name" value={dialog.data.name}
                onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, name: e.target.value } }))}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
            </Box>
            <Box>
              <Typography className="dialog-field-label">Username</Typography>
              <TextField fullWidth size="small" placeholder="Enter username" value={dialog.data.username}
                onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, username: e.target.value } }))}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
            </Box>
            <Box>
              <Typography className="dialog-field-label">Email</Typography>
              <TextField fullWidth size="small" type="email" placeholder="Enter email" value={dialog.data.email}
                onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, email: e.target.value } }))}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
            </Box>
            {dialog.mode === "add" && (
              <Box>
                <Typography className="dialog-field-label">Password</Typography>
                <TextField fullWidth size="small" type="password" placeholder="Enter password" value={dialog.data.password}
                  onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, password: e.target.value } }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
              </Box>
            )}
            <Box>
              <Typography className="dialog-field-label">Role</Typography>
              <FormControl fullWidth size="small">
                <Select value={dialog.data.role}
                  onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, role: e.target.value } }))}
                  sx={{ borderRadius: 2, fontFamily: "Poppins, sans-serif" }}>
                  {ROLES.map((r) => <MenuItem key={r} value={r} sx={{ fontFamily: "Poppins, sans-serif" }}>{ROLE_META[r].label}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography className="dialog-field-label">Assigned Outlet</Typography>
              <FormControl fullWidth size="small">
                <Select 
                  value={dialog.data.outletId || ""}
                  onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, outletId: e.target.value } }))}
                  sx={{ borderRadius: 2, fontFamily: "Poppins, sans-serif" }}
                  displayEmpty
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {outlets.map((o) => (
                    <MenuItem key={o.id} value={o.id} sx={{ fontFamily: "Poppins, sans-serif" }}>
                      {o.outletName} ({o.outletCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <ButtonBase onClick={() => setDialog({ open: false, mode: "add", data: emptyForm })} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>
            Cancel
          </ButtonBase>
          <ButtonBase onClick={handleSave} disableRipple
            sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2.5, py: 1, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600, boxShadow: "0 4px 12px rgba(125,42,232,0.35)" }}>
            <CheckRounded sx={{ fontSize: 16 }} />
            {dialog.mode === "add" ? "Create" : "Save"}
          </ButtonBase>
        </DialogActions>
      </Dialog>

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
