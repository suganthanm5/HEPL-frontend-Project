import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../../services/locationService";

// Material UI imports
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  Avatar,
  Tooltip,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Stack,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";

/* ── MUI Theme ── */
const theme = createTheme({
  palette: {
    primary:   { main: "#10b981" },
    secondary: { main: "#6366f1" },
    error:     { main: "#ef4444" },
    warning:   { main: "#f59e0b" },
  },
  typography: { fontFamily: "inherit" },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, minWidth: 460 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          background: "#fafafa",
          fontSize: "0.78rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#64748b",
        },
      },
    },
  },
});

/* ── Stat Card ── */
const StatCard = ({ label, value, color, bg, icon }) => (
  <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5, display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 160 }}>
    <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color, "& svg": { fontSize: 22 } }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>{label}</Typography>
    </Box>
  </Paper>
);

/* ── Modal Header ── */
const ModalIconHeader = ({ icon, title, subtitle, accent, onClose }) => (
  <DialogTitle sx={{ p: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
      <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}20`, color: accent, "& svg": { fontSize: 20 } }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: "#64748b" }}>{subtitle}</Typography>}
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: "#94a3b8" }}><CloseIcon fontSize="small" /></IconButton>
    </Box>
  </DialogTitle>
);

const PAGE_SIZES = [5, 10, 25, 50];

const Location = () => {
  const [locations,     setLocations]     = useState([]);
  const [allLocations,  setAllLocations]  = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [pageSize,      setPageSize]      = useState(10);
  const [page,          setPage]          = useState(1);
  const [view,          setView]          = useState("table");
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [toast,         setToast]         = useState(null);

  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [addName,  setAddName]  = useState("");
  const [editName, setEditName] = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchLocations(controller.signal);
    return () => controller.abort();
  }, [page, pageSize]);

  useEffect(() => { filterLocations(); }, [search, allLocations, pageSize, page]);

  const showToast = (message, type = "error") => setToast({ message, type });

  const handleInputChange = (value, setter) => {
    if (/[^a-zA-Z\s,]/.test(value)) {
      showToast("Please enter a valid format. Only letters, spaces, and commas are allowed.", "warning");
      return;
    }
    if (value.startsWith(" ") || value.startsWith(",")) {
      showToast("Location name cannot start with a space or comma.", "warning");
      return;
    }
    setter(value);
  };

  const fetchLocations = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await getLocations(0, 1000, "", signal);
      let allLocs = [];
      if (Array.isArray(res)) allLocs = res;
      else if (Array.isArray(res?.content)) allLocs = res.content;
      else if (Array.isArray(res?.data)) allLocs = res.data;
      else if (Array.isArray(res?.data?.content)) allLocs = res.data.content;
      setAllLocations(allLocs);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load locations. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = allLocations;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = allLocations.filter((l) => l.name?.toLowerCase().includes(q));
    }
    const totalFiltered = filtered.length;
    const totalPgs = Math.ceil(totalFiltered / pageSize) || 1;
    const safePg = Math.min(page, totalPgs);
    const startIdx = (safePg - 1) * pageSize;
    setLocations(filtered.slice(startIdx, startIdx + pageSize));
    setTotalPages(totalPgs);
    setTotalElements(totalFiltered);
  };

  const handleAdd = async () => {
    if (!addName.trim()) return;
    const locationNames = addName.split(",").map((n) => n.trim()).filter((n) => n.length > 0);
    if (locationNames.length === 0) { showToast("Please enter at least one valid location name.", "warning"); return; }

    const duplicates = [], validLocations = [];
    locationNames.forEach((name) => {
      if (allLocations.some((l) => l.name?.toLowerCase() === name.toLowerCase())) duplicates.push(name);
      else validLocations.push(name);
    });

    const uniqueValid = [], inputDups = [];
    validLocations.forEach((name) => {
      if (uniqueValid.some((e) => e.toLowerCase() === name.toLowerCase())) inputDups.push(name);
      else uniqueValid.push(name);
    });

    if (duplicates.length > 0) showToast(`These locations already exist: ${duplicates.join(", ")}`, "warning");
    if (inputDups.length > 0)  showToast(`Duplicate entries in input: ${inputDups.join(", ")}`, "warning");
    if (uniqueValid.length === 0) return;

    setSaving(true);
    let successCount = 0;
    const failedLocations = [];
    try {
      for (const name of uniqueValid) {
        try { await createLocation({ name }); successCount++; }
        catch { failedLocations.push(name); }
      }
      if (successCount > 0) {
        showToast(successCount === 1 ? `Location "${uniqueValid[0]}" added successfully!` : `${successCount} locations added successfully!`, "success");
      }
      if (failedLocations.length > 0) showToast(`Failed to add: ${failedLocations.join(", ")}`, "error");
      setPage(1);
      fetchLocations();
      setAddName("");
      setAddModal(false);
    } catch (e) {
      showToast("Failed to add locations: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    const trimmed = editName.trim();
    if (allLocations.some((l) => l.id !== editModal.id && l.name?.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Location "${trimmed}" already exists. Please choose a different name.`, "error");
      return;
    }
    setSaving(true);
    try {
      await updateLocation(editModal.id, { name: trimmed });
      fetchLocations();
      setEditModal(null);
      showToast(`Location updated to "${trimmed}" successfully!`, "success");
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      showToast(msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate")
        ? `Location "${trimmed}" already exists. Please choose a different name.`
        : "Failed to update location: " + msg, "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const name = deleteModal.name;
    setSaving(true);
    try {
      await deleteLocation(deleteModal.id);
      fetchLocations();
      setDeleteModal(null);
      showToast(`Location "${name}" deleted successfully!`, "success");
    } catch (e) {
      showToast("Failed to delete location: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const openEdit = (loc) => { setEditModal(loc); setEditName(loc.name); };

  const safePage = Math.min(page, totalPages || 1);
  const start    = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end      = Math.min(safePage * pageSize, totalElements);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

        {/* ── Hero ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: 3 }}>
          <Button variant="contained" startIcon={<AddIcon />} color="primary"
            sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
            onClick={() => { setAddName(""); setAddModal(true); }}>
            Add Location
          </Button>
        </Box>

        {/* ── Stats ── */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          <StatCard label="Total Locations" value={loading ? "—" : totalElements} color="#10b981" bg="#ecfdf5" icon={<LocationOnIcon />} />
          <StatCard label="Current Page"    value={loading ? "—" : locations.length} color="#6366f1" bg="#eef2ff" icon={<SearchIcon />} />
          <StatCard label="Total Pages"     value={loading ? "—" : totalPages}       color="#f59e0b" bg="#fffbeb" icon={<GridViewIcon />} />
        </Stack>

        {/* ── Error ── */}
        {error && (
          <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        {/* ── Toolbar ── */}
        <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>

            {/* Search */}
            <TextField
              size="small" placeholder="Search locations…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ minWidth: 240, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#94a3b8", fontSize: 18 }} /></InputAdornment>,
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}><CloseIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                }
              }}
            />

            {/* Show entries + View toggle */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: { sm: "auto" } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ color: "#64748b", whiteSpace: "nowrap" }}>Show</Typography>
                <FormControl size="small" sx={{ minWidth: 72 }}>
                  <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                    {PAGE_SIZES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ color: "#64748b" }}>entries</Typography>
              </Stack>

              <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}
                sx={{ "& .MuiToggleButton-root": { px: 1.5, border: "1px solid #e2e8f0" } }}>
                <ToggleButton value="table"><Tooltip title="Table"><TableChartIcon fontSize="small" /></Tooltip></ToggleButton>
                <ToggleButton value="card"><Tooltip title="Cards"><GridViewIcon fontSize="small" /></Tooltip></ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Paper>

        {/* ── Table View ── */}
        {view === "table" && (
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, overflow: "hidden", mb: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 60 }}>#</TableCell>
                    <TableCell>Location Name</TableCell>
                    <TableCell sx={{ width: 160 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [1,2,3,4,5].map((i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton variant="text" width={24} /></TableCell>
                        <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                        <TableCell><Skeleton variant="text" width={100} /></TableCell>
                      </TableRow>
                    ))
                  ) : locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                          <LocationOnIcon sx={{ fontSize: 48, color: "#cbd5e1" }} />
                          <Typography color="text.secondary">{search ? "No locations match your search" : "No locations yet"}</Typography>
                          {!search && (
                            <Button variant="contained" size="small" startIcon={<AddIcon />} color="primary"
                              sx={{ boxShadow: "none" }}
                              onClick={() => { setAddName(""); setAddModal(true); }}>
                              Add First Location
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((loc, i) => (
                      <TableRow key={loc.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>{(safePage - 1) * pageSize + i + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", fontWeight: 700, bgcolor: "#d1fae5", color: "#10b981" }}>
                              {loc.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>{loc.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(loc)}
                                sx={{ color: "#6366f1", bgcolor: "#eef2ff", borderRadius: 1.5, "&:hover": { bgcolor: "#e0e7ff" } }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => setDeleteModal(loc)}
                                sx={{ color: "#ef4444", bgcolor: "#fef2f2", borderRadius: 1.5, "&:hover": { bgcolor: "#fee2e2" } }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* ── Card View ── */}
        {view === "card" && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {loading ? (
              [1,2,3,4,5,6].map((i) => (
                <Grid xs={12} sm={6} md={4} key={i}>
                  <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5 }}>
                    <Skeleton variant="circular" width={44} height={44} sx={{ mb: 1 }} />
                    <Skeleton width="60%" height={24} sx={{ mb: 0.5 }} />
                    <Skeleton width="40%" height={18} />
                  </Paper>
                </Grid>
              ))
            ) : locations.length === 0 ? (
              <Grid xs={12}>
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <LocationOnIcon sx={{ fontSize: 56, color: "#cbd5e1", mb: 1 }} />
                  <Typography color="text.secondary">{search ? "No locations match your search" : "No locations yet"}</Typography>
                </Box>
              </Grid>
            ) : (
              locations.map((loc, i) => (
                <Grid xs={12} sm={6} md={4} key={loc.id}>
                  <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5, display: "flex", flexDirection: "column", transition: "box-shadow .2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,.08)" } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Avatar sx={{ width: 44, height: 44, fontSize: "1rem", fontWeight: 700, bgcolor: "#d1fae5", color: "#10b981" }}>
                        {loc.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>#{(safePage - 1) * pageSize + i + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", mb: 0.5 }}>{loc.name}</Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8", mb: 2 }}>Location Node</Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(loc)}
                        sx={{ flex: 1, color: "#6366f1", bgcolor: "#eef2ff", "&:hover": { bgcolor: "#e0e7ff" }, fontWeight: 600 }}>Edit</Button>
                      <Button size="small" startIcon={<DeleteIcon />} onClick={() => setDeleteModal(loc)}
                        sx={{ flex: 1, color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" }, fontWeight: 600 }}>Delete</Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* ── Pagination ── */}
        {!loading && totalElements > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> entries
            </Typography>
            <Pagination
              count={totalPages} page={safePage} onChange={(_, v) => setPage(v)}
              shape="rounded" size="small"
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 600 },
                "& .Mui-selected": { bgcolor: "#10b981 !important", color: "#fff" },
              }}
            />
          </Box>
        )}

        {/* ── Add Modal ── */}
        <Dialog open={addModal} onClose={() => { setAddModal(false); setAddName(""); }} maxWidth="sm" fullWidth>
          <ModalIconHeader icon={<AddIcon />} title="Add Locations" subtitle="Create one or multiple location nodes" accent="#10b981"
            onClose={() => { setAddModal(false); setAddName(""); }} />
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              autoFocus fullWidth size="small"
              label="Location Names *"
              placeholder="e.g. Chennai, Mumbai, Delhi (separate multiple with commas)"
              value={addName}
              onChange={(e) => handleInputChange(e.target.value, setAddName)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Typography variant="caption" sx={{ color: "#64748b", mt: 1, display: "block" }}>
              💡 Tip: You can add multiple locations at once by separating them with commas
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => { setAddModal(false); setAddName(""); }}>Cancel</Button>
            <Button variant="contained" startIcon={<AddIcon />} color="primary"
              disabled={saving || !addName.trim()} sx={{ boxShadow: "none" }} onClick={handleAdd}>
              {saving ? "Adding…" : "Add Locations"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Edit Modal ── */}
        <Dialog open={!!editModal} onClose={() => setEditModal(null)} maxWidth="sm" fullWidth>
          <ModalIconHeader icon={<EditIcon />} title="Edit Location" subtitle={editModal ? `Editing: ${editModal.name}` : ""} accent="#6366f1"
            onClose={() => setEditModal(null)} />
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              autoFocus fullWidth size="small" label="Location Name *"
              placeholder="Location name"
              value={editName}
              onChange={(e) => handleInputChange(e.target.value, setEditName)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => setEditModal(null)}>Cancel</Button>
            <Button variant="contained" startIcon={<EditIcon />}
              disabled={saving || !editName.trim()}
              sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, color: "#fff", boxShadow: "none" }}
              onClick={handleUpdate}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Modal ── */}
        <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} maxWidth="xs" fullWidth>
          <ModalIconHeader icon={<WarningAmberIcon />} title="Delete Location" subtitle="This action cannot be undone" accent="#ef4444"
            onClose={() => setDeleteModal(null)} />
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "#475569" }}>
              Are you sure you want to delete <strong>"{deleteModal?.name}"</strong>?
            </Typography>
            <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5, display: "block" }}>
              All associated data will be permanently removed.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />}
              disabled={saving} sx={{ boxShadow: "none" }} onClick={handleDelete}>
              {saving ? "Deleting…" : "Delete Location"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Toast ── */}
        <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert
            severity={toast?.type === "success" ? "success" : toast?.type === "warning" ? "warning" : "error"}
            onClose={() => setToast(null)} sx={{ borderRadius: 2, fontWeight: 500 }}>
            {toast?.message}
          </Alert>
        </Snackbar>

      </Box>
    </ThemeProvider>
  );
};

export default Location;
