import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, ButtonBase, IconButton, InputBase, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, Tooltip, CircularProgress,
  Snackbar, Alert, Chip, Paper, Grid, Stack, Pagination, FormHelperText
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
import TypingText from "../../components/TypingText";
import PageHeader from "../../components/common/PageHeader";
import { formatUserData } from "../../utils/exportUtils";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "./UserManagement.css";


const ROLE_META = {
  ADMIN: { label: "Admin", cls: "admin", color: "#7d2ae8", bg: "#f3e8ff", Icon: AdminPanelSettingsRounded },
  MANAGER: { label: "Manager", cls: "manager", color: "#0284c7", bg: "#e0f2fe", Icon: ManageAccountsRounded },
  OUTLET_MANAGER: { label: "Outlet Manager", cls: "manager", color: "#0ea5e9", bg: "#e0f2fe", Icon: ManageAccountsRounded },
  USER: { label: "User", cls: "user", color: "#16a34a", bg: "#dcfce7", Icon: PersonRounded },
};

const ROLES = ["ADMIN", "MANAGER", "OUTLET_MANAGER", "USER"];


const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

const emptyForm = { name: "", username: "", email: "", password: "", roles: ["USER"], status: "ACTIVE", outletId: "" };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFormView, setIsFormView] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem('itemsPerPage') || '10', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [dialog, setDialog] = useState({ open: false, mode: "add", data: emptyForm });
  const [delDialog, setDelDialog] = useState({ open: false, id: null, name: "" });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [formErrors, setFormErrors] = useState({});


  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers(page - 1, pageSize, search, signal);
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      load(controller.signal);
    }, 800);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load]);

  useEffect(() => {
    outletService.getAll(0, 1000).then(data => setOutlets(data.content || []));
  }, []);

  const filtered = users; // Backend handles filtering


  const counts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});


  const toast = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });


  const handleSave = async () => {
    const { mode, data } = dialog;
    setFormErrors({});
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
        setFormErrors(errorData);
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
      {/* Header */}
      <PageHeader
        title={<TypingText text="User Management" />}
        subtitle="Manage users and their roles"
        action={
          !isFormView && (
            <Button variant="contained" color="primary" startIcon={<PersonAddRounded />}
              onClick={() => { setFormErrors({}); setDialog({ open: true, mode: "add", data: emptyForm }); setIsFormView(true); }}
              sx={{ borderRadius: 2 }}
            >
              Add User
            </Button>
          )
        }
      />

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <FormContainer>
            <FormHeader
              title={dialog.mode === "add" ? "Add New User" : "Edit User"}
              subtitle={dialog.mode === "add" ? "Fill in the details to create a new user" : `Updating details for ${dialog.data.name || dialog.data.username}`}
              onClose={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }}
              onSave={handleSave}
              saveLabel={dialog.mode === "add" ? "Create User" : "Save Changes"}
              saveIcon={dialog.mode === "add" ? <PersonAddRounded /> : <CheckRounded />}
              colorAccent="primary"
            />

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 3 }}>
                    <FormSectionHeader
                      title="User Details"
                      color={dialog.mode === "add" ? "#10b981" : "#7d2ae8"}
                    />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <TextField fullWidth label="Full Name" placeholder="Enter full name" value={dialog.data.name}
                        onChange={(e) => {
                          setDialog((d) => ({ ...d, data: { ...d.data, name: e.target.value } }));
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                        }}
                        error={!!formErrors.name}
                        helperText={formErrors.name} />

                      <TextField fullWidth label="Username" placeholder="Enter username" value={dialog.data.username}
                        onChange={(e) => {
                          setDialog((d) => ({ ...d, data: { ...d.data, username: e.target.value } }));
                          if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: null }));
                        }}
                        error={!!formErrors.username}
                        helperText={formErrors.username} />

                      <TextField fullWidth label="Email" type="email" placeholder="Enter email" value={dialog.data.email}
                        onChange={(e) => {
                          setDialog((d) => ({ ...d, data: { ...d.data, email: e.target.value } }));
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                        }}
                        error={!!formErrors.email}
                        helperText={formErrors.email} />

                      {dialog.mode === "add" && (
                        <TextField fullWidth label="Password" type="password" placeholder="Enter password" value={dialog.data.password}
                          onChange={(e) => {
                            setDialog((d) => ({ ...d, data: { ...d.data, password: e.target.value } }));
                            if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: null }));
                          }}
                          error={!!formErrors.password}
                          helperText={formErrors.password} />
                      )}

                      <FormControl fullWidth variant="outlined" error={!!(formErrors.role || formErrors.roles)}>
                        <Select
                          value={dialog.data.role || "USER"}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            setDialog((d) => ({ 
                                ...d, 
                                data: { 
                                    ...d.data, 
                                    role: newRole,
                                    ...( (newRole === "ADMIN" || newRole === "MANAGER") ? { outletId: "" } : {} )
                                } 
                            }));
                            if (formErrors.role || formErrors.roles) setFormErrors((prev) => ({ ...prev, role: null, roles: null }));
                          }}
                        >
                          {ROLES.map((r) => (
                            <MenuItem key={r} value={r} sx={{ fontFamily: "inherit" }}>
                              {ROLE_META[r].label}
                            </MenuItem>
                          ))}
                        </Select>
                        {(formErrors.role || formErrors.roles) && (
                          <FormHelperText>{formErrors.role || formErrors.roles}</FormHelperText>
                        )}
                      </FormControl>
                      <FormControl fullWidth variant="outlined" disabled={dialog.data.role === "ADMIN" || dialog.data.role === "MANAGER"}>
                        <Select
                          value={dialog.data.outletId || ""}
                          onChange={(e) => {
                            const newOutletId = e.target.value;
                            setDialog((d) => ({
                              ...d,
                              data: {
                                ...d.data,
                                outletId: newOutletId,
                                role: newOutletId && (d.data.role === "USER" || d.data.role === "OUTLET_MANAGER") ? "OUTLET_MANAGER" : (d.data.role || "USER")
                              }
                            }));
                          }}
                          displayEmpty
                        >
                          <MenuItem value="" sx={{ fontFamily: "inherit", fontStyle: "italic", color: "#94a3b8" }}>No Outlet Assigned</MenuItem>
                          {outlets.map((ot) => (
                            <MenuItem key={ot.id} value={ot.id} sx={{ fontFamily: "inherit" }}>
                              {ot.outletName || ot.name || ot.id}
                            </MenuItem>
                          ))}
                        </Select>
                        {(dialog.data.role === "ADMIN" || dialog.data.role === "MANAGER") && (
                            <FormHelperText>Not applicable for global roles</FormHelperText>
                        )}
                      </FormControl>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5} sx={{ display: "flex" }}>
                  <Box sx={{ p: 4, bgcolor: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    <Avatar sx={{ width: 120, height: 120, mb: 2, background: "linear-gradient(135deg, #7d2ae8, #a855f7)", fontSize: "3rem", fontWeight: 700, boxShadow: "0 8px 16px rgba(125,42,232,0.2)" }}>
                      {initials(dialog.data.name || dialog.data.username)}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "inherit" }}>
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
                        fontFamily: "inherit"
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </FormContainer>
        </Box>
      ) : (
        <>
          {/* Stat Cards */}
          <Box className="stat-cards-row">
            <Box className="stat-card stat-indigo">
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
              const theme = r === "ADMIN" ? "purple" : r === "MANAGER" ? "blue" : "green";
              return (
                <Box className={`stat-card stat-${theme}`} key={r}>
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
              <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "inherit" }}>
                All Users
              </Typography>
              <ExportMenu getData={() => formatUserData(filtered)} filename="users" title="User Report" backendType="users" />
              <Box className="table-search">
                <SearchRounded sx={{ fontSize: 18, color: "#7d2ae8", flexShrink: 0 }} />
                <InputBase
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "inherit", color: "#1e1b4b" }}
                />
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {["User", "Username", "Email", "Role", "Assigned Outlet", "Actions"].map((h) => (
                      <TableCell key={h} sx={{ fontFamily: "inherit" }}>
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
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "inherit" }}>
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
                              <Typography sx={{ fontWeight: 600, color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "inherit" }}>
                                {u.name || u.username}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "inherit" }}>{u.username}</TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "inherit" }}>{u.email}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                size="small"
                                label={meta.label}
                                sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600, fontFamily: "inherit", borderRadius: "8px" }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const isGlobalRole = u.role === "ADMIN" || u.role === "MANAGER";
                              if (isGlobalRole) {
                                return (
                                  <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", fontFamily: "inherit" }}>
                                    Not Applicable
                                  </Typography>
                                );
                              }

                              const outletName = u.outletName || u.outlet?.outletName || u.outlet?.name || (u.outletId ? outlets.find(o => String(o.id) === String(u.outletId))?.outletName || outlets.find(o => String(o.id) === String(u.outletId))?.name : null);
                              return outletName && outletName !== "—" ? (
                                <Chip
                                  size="small"
                                  label={outletName}
                                  sx={{
                                    bgcolor: "#f8fafc",
                                    color: "#334155",
                                    fontWeight: 600,
                                    fontFamily: "inherit",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1"
                                  }}
                                />
                              ) : (
                                <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", fontFamily: "inherit" }}>
                                  Not Assigned
                                </Typography>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                              <Tooltip title="Edit user">
                                <IconButton
                                  size="small"
                                  onClick={() => { setDialog({ open: true, mode: "edit", data: { ...u } }); setIsFormView(true); }}
                                  sx={{ color: "#f59e0b", background: "#fef3c7", "&:hover": { background: "#fde68a" } }}
                                >
                                  <EditRounded sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete user">
                                <IconButton
                                  size="small"
                                  onClick={() => setDelDialog({ open: true, id: u.id, name: u.name || u.username })}
                                  sx={{ color: "#ef4444", background: "#fee2e2", "&:hover": { background: "#fecaca" } }}
                                >
                                  <DeleteRounded sx={{ fontSize: 16 }} />
                                </IconButton>
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
          {/* Pagination */}
          {!loading && totalElements > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Showing <strong>{totalElements === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalElements)}</strong> of <strong>{totalElements}</strong> entries
              </Typography>
              <Pagination
                count={totalPages} page={page} onChange={(_, v) => setPage(v)}
                shape="rounded" size="small"
                sx={{
                  "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 600, fontFamily: "inherit" },
                  "& .Mui-selected": { bgcolor: "#7d2ae8 !important", color: "#fff" },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Add/Edit Dialog (REPLACED) */}
      {/* Add/Edit Dialog (REPLACED) */}

      {/* Delete Confirm Dialog */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, id: null, name: "" })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "#1e1b4b" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "inherit", color: "#64748b", fontSize: "0.9rem" }}>
            Are you sure you want to delete <strong>{delDialog.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setDelDialog({ open: false, id: null, name: "" })}
            sx={{ borderRadius: 2, color: "#64748b", borderColor: "#e2e8f0" }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ borderRadius: 2, boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "inherit" }}>
          {snack.msg}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default UserManagement;

