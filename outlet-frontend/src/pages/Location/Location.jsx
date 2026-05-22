import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation, bulkCreateLocations } from "../../services/locationService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatLocationData } from "../../utils/exportUtils";

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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BulkUploadModal from "../../components/BulkUploadModal";

/* ── MUI Theme ── */
const theme = createTheme({
  palette: {
    primary: { main: "#10b981" },
    secondary: { main: "#6366f1" },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
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
const StatCard = ({ label, value, color, bg, icon, gradient, border }) => (
  <Paper
    elevation={0}
    sx={{
      border: `1.5px solid ${border}`,
      borderRadius: "16px",
      p: 2.5,
      display: "flex",
      alignItems: "center",
      gap: 2,
      flex: 1,
      minWidth: 160,
      background: gradient,
      transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.22s",
      "&:hover": {
        transform: "translateY(-5px) scale(1.01)",
        boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
        borderColor: color
      }
    }}
  >
    <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", background: bg, color, "& svg": { fontSize: 22 } }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e1b4b", lineHeight: 1.1 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{label}</Typography>
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
  const [locations, setLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem('itemsPerPage') || '10', 10));
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [addName, setAddName] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [isFormView, setIsFormView] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(() => {
      fetchLocations(controller.signal);
    }, 800);
    return () => { clearTimeout(delay); controller.abort(); };
  }, [page, pageSize, search]);

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
      const res = await getLocations(page - 1, pageSize, search, signal);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (Array.isArray(res?.content)) list = res.content;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.content)) list = res.data.content;
      
      setLocations(list);
      setTotalPages(res?.totalPages || 1);
      setTotalElements(res?.totalElements || list.length);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load locations. Check API connection.");
    } finally {
      setLoading(false);
    }
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
    if (inputDups.length > 0) showToast(`Duplicate entries in input: ${inputDups.join(", ")}`, "warning");
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
      setIsFormView(false);
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
      setEditModal(null); setIsFormView(false);
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

  const openEdit = (loc) => { setEditModal(loc); setEditName(loc.name); setIsFormView(true); };

  const safePage = Math.min(page, totalPages || 1);
  const start = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalElements);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

        {/* ── Hero ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}>
              <TypingText text="Location Management" />
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Manage geographic locations for your outlets
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="outlined" startIcon={<UploadFileIcon />}
              sx={{ borderColor: "#10b981", color: "#10b981", fontWeight: 600, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#f0fdf4", borderColor: "#10b981" } }}
              onClick={() => setBulkOpen(true)}>
              Bulk Upload
            </Button>
            <ExportMenu getData={() => formatLocationData(allLocations)} filename="locations" title="Locations Report" backendType="locations" />
            <Button variant="contained" startIcon={<AddIcon />} color="primary"
              sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
              onClick={() => { setAddName(""); setIsFormView(true); setEditModal(null); }}>
              Add Location
            </Button>
          </Box>
        </Box>

        {isFormView ? (
          /* ── Full Page Form View ── */
          <Box className="animate-fade-in">
            <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <IconButton onClick={() => { setIsFormView(false); setEditModal(null); setAddName(""); }} sx={{ color: "#64748b" }}>
                    <CloseIcon />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                      {editModal ? "Edit Location" : "Add New Location"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {editModal ? `Updating details for ${editModal.name}` : "Fill in the details to create a new location node"}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" color="inherit" onClick={() => { setIsFormView(false); setEditModal(null); setAddName(""); }}
                    sx={{ color: "#64748b", borderColor: "#e2e8f0" }}>
                    Cancel
                  </Button>
                  <Button variant="contained" startIcon={editModal ? <EditIcon /> : <AddIcon />}
                    disabled={saving || (editModal ? !editName.trim() : !addName.trim())}
                    sx={{ bgcolor: editModal ? "#6366f1" : "#10b981", "&:hover": { bgcolor: editModal ? "#4f46e5" : "#059669" }, color: "#fff", boxShadow: "none" }}
                    onClick={editModal ? handleUpdate : handleAdd}>
                    {saving ? "Saving…" : editModal ? "Save Changes" : "Create Location"}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 4, height: 16, bgcolor: editModal ? "#6366f1" : "#10b981", borderRadius: 1 }} />
                        Location Details
                      </Typography>
                      <TextField
                        fullWidth
                        label="Location Name"
                        value={editModal ? editName : addName}
                        onChange={(e) => handleInputChange(e.target.value, editModal ? setEditName : setAddName)}
                        required
                        placeholder={editModal ? "" : "e.g. Chennai, Mumbai (comma separated for multiple)"}
                        helperText={!editModal && "You can add multiple locations by separating them with commas"}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>Quick Tips</Typography>
                      <ul style={{ paddingLeft: 20, margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                        <li>Location names should be concise.</li>
                        <li>Only letters and spaces are allowed.</li>
                        <li>Use commas to bulk-add multiple locations at once.</li>
                      </ul>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Box>
        ) : (
          <>
            {/* ── Stats ── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
              <StatCard label="Total Locations" value={loading ? "—" : totalElements} color="#15803d" bg="#ecfdf5" icon={<LocationOnIcon />} gradient="linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" border="#dcfce7" />
              <StatCard label="Current Page" value={loading ? "—" : locations.length} color="#4f46e5" bg="#eef2ff" icon={<SearchIcon />} gradient="linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)" border="#e0e7ff" />
              <StatCard label="Total Pages" value={loading ? "—" : totalPages} color="#b45309" bg="#fffbeb" icon={<GridViewIcon />} gradient="linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" border="#fef3c7" />
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
                        [1, 2, 3, 4, 5].map((i) => (
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
                                  onClick={() => { setAddName(""); setIsFormView(true); setEditModal(null); }}>
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
                  [1, 2, 3, 4, 5, 6].map((i) => (
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

            {/* ── Add Modal (REPLACED) ── */}

            {/* ── Edit Modal (REPLACED) ── */}

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

            {/* ── Bulk Upload Modal ── */}
            <BulkUploadModal
              open={bulkOpen}
              onClose={() => setBulkOpen(false)}
              title="Bulk Upload Locations"
              accent="#10b981"
              templateHeaders={["name"]}
              templateRows={[["Chennai"], ["Mumbai"], ["Delhi"]]}
              parseRow={(row, rowNum) => {
                const name = (row["name"] || "").trim();
                if (!name) return { valid: false, error: "Name is required" };
                if (/[^a-zA-Z\s]/.test(name)) return { valid: false, error: "Only letters and spaces allowed" };
                return { valid: true, data: { name } };
              }}
              onUpload={(rows) => bulkCreateLocations(rows.map((r) => r.name))}
              onDone={() => { fetchLocations(); }}
            />
          </>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Location;
