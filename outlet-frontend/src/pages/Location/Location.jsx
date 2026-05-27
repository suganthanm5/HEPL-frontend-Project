import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation, bulkCreateLocations } from "../../services/locationService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatLocationData } from "../../utils/exportUtils";
import BulkUploadModal from "../../components/BulkUploadModal";

import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, InputAdornment, MenuItem, Paper, Select, Skeleton,
  Snackbar, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Grid, Avatar, Tooltip,
  FormControl, ToggleButton, ToggleButtonGroup, Pagination, Stack,
  Divider, Chip, LinearProgress, Fade, Grow, Badge, InputBase,
  Card, CardContent, CardActions, ButtonBase,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import FmdGoodRoundedIcon from "@mui/icons-material/FmdGoodRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

const PAGE_SIZES = [5, 10, 25, 50];

/* ── Gradient avatar color based on first char ── */
const AVATAR_GRADIENTS = [
  ["#7d2ae8", "#a855f7"],
  ["#10b981", "#34d399"],
  ["#0284c7", "#38bdf8"],
  ["#f59e0b", "#fbbf24"],
  ["#ef4444", "#f87171"],
  ["#db2777", "#f472b6"],
  ["#6366f1", "#818cf8"],
  ["#14b8a6", "#2dd4bf"],
];
const getGradient = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
};

/* ── Stat Card ── */
const StatCard = ({ label, value, icon: Icon, color, bg, border, loading }) => (
  <Grow in timeout={400}>
    <Box sx={{
      background: "#fff",
      borderRadius: "14px",
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 2,
      flex: 1,
      minWidth: 160,
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-3px)" },
      position: "relative",
      overflow: "hidden"
    }}>
      <Box sx={{
        width: 46, height: 46, borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: bg, color, flexShrink: 0,
      }}>
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        {loading
          ? <Skeleton width={48} height={28} />
          : <Typography sx={{ fontSize: "28px", fontWeight: 800, color: "#1e1b4b", lineHeight: 1, letterSpacing: "-0.5px", fontFamily: "inherit" }}>{value}</Typography>
        }
        <Typography sx={{ fontSize: "12.5px", color: "#64748b", fontWeight: 500, mt: 0.5, fontFamily: "inherit" }}>{label}</Typography>
      </Box>
    </Box>
  </Grow>
);

/* ── Location Avatar ── */
const LocAvatar = ({ name, size = 36 }) => {
  const [c1, c2] = getGradient(name);
  return (
    <Avatar sx={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      fontSize: size * 0.4, fontWeight: 700, fontFamily: "inherit",
      boxShadow: `0 3px 10px ${c1}40`,
    }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </Avatar>
  );
};

const Location = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem("itemsPerPage") || "10", 10));
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [allLocations, setAllLocations] = useState([]);

  const [isFormView, setIsFormView] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(() => fetchLocations(controller.signal), 800);
    return () => { clearTimeout(delay); controller.abort(); };
  }, [page, pageSize, search]);

  const showToast = (message, type = "error") => setToast({ message, type });

  const handleInputChange = (value) => {
    if (/[^a-zA-Z\s,]/.test(value)) { showToast("Only letters, spaces, and commas allowed.", "warning"); return; }
    if (value.startsWith(" ") || value.startsWith(",")) { showToast("Cannot start with a space or comma.", "warning"); return; }
    setFormName(value);
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
      setAllLocations(list);
      setTotalPages(res?.totalPages || 1);
      setTotalElements(res?.totalElements || list.length);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load locations.");
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!formName.trim()) return;
    const names = formName.split(",").map(n => n.trim()).filter(Boolean);
    if (!names.length) { showToast("Enter at least one valid location name.", "warning"); return; }
    setSaving(true);
    let ok = 0; const failed = [];
    try {
      for (const name of names) {
        try { await createLocation({ name }); ok++; }
        catch { failed.push(name); }
      }
      if (ok > 0) showToast(ok === 1 ? `"${names[0]}" added!` : `${ok} locations added!`, "success");
      if (failed.length) showToast(`Failed: ${failed.join(", ")}`, "error");
      setPage(1); fetchLocations(); setFormName(""); setIsFormView(false);
    } catch (e) { showToast("Failed to add: " + (e.response?.data?.message || e.message), "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!formName.trim()) return;
    const trimmed = formName.trim();
    setSaving(true);
    try {
      await updateLocation(editModal.id, { name: trimmed });
      fetchLocations(); setEditModal(null); setIsFormView(false); setFormName("");
      showToast(`Updated to "${trimmed}"!`, "success");
    } catch (e) {
      showToast("Failed to update: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const name = deleteModal.name;
    setSaving(true);
    try {
      await deleteLocation(deleteModal.id);
      fetchLocations(); setDeleteModal(null);
      showToast(`"${name}" deleted.`, "success");
    } catch (e) { showToast("Failed to delete: " + (e.response?.data?.message || e.message), "error"); }
    finally { setSaving(false); }
  };

  const openAdd = () => { setEditModal(null); setFormName(""); setIsFormView(true); };
  const openEdit = (loc) => { setEditModal(loc); setFormName(loc.name); setIsFormView(true); };
  const closeForm = () => { setIsFormView(false); setEditModal(null); setFormName(""); };

  const safePage = Math.min(page, totalPages || 1);
  const start = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalElements);
  const formComplete = formName.trim().length > 0;

  // ── TABLE HEAD CELL SX ──
  const thSx = {
    fontWeight: 700, color: "#7d2ae8", fontFamily: "inherit",
    fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 0.8,
    py: 1.5, bgcolor: "#faf5ff",
  };

  return (
    <Box sx={{ fontFamily: "inherit" }}>

      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: "#1e1b4b", fontFamily: "inherit", mb: 0.25 }}>
            <TypingText text="Location Management" />
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#7d2ae8", fontFamily: "inherit", fontWeight: 500 }}>
            Manage geographic locations for your outlets
          </Typography>
        </Box>
        {!isFormView && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={() => fetchLocations()} size="small"
                sx={{ color: "#7d2ae8", bgcolor: "#f5f0ff", "&:hover": { bgcolor: "#ede9fe" } }}>
                <RefreshRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<UploadFileRoundedIcon />}
              sx={{ borderColor: "#10b981", color: "#10b981", fontWeight: 600, fontFamily: "inherit", borderRadius: 2, "&:hover": { bgcolor: "#f0fdf4", borderColor: "#10b981" }, textTransform: "none" }}
              onClick={() => setBulkOpen(true)}>
              Bulk Upload
            </Button>
            <ExportMenu getData={() => formatLocationData(allLocations)} filename="locations" title="Locations Report" backendType="locations" />
            <ButtonBase onClick={openAdd} disableRipple sx={{
              display: "flex", alignItems: "center", gap: 1,
              px: 2.5, py: 1.2, borderRadius: "50px",
              background: "linear-gradient(135deg, #7d2ae8, #a855f7)",
              color: "#fff", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600,
              boxShadow: "0 4px 16px rgba(125,42,232,0.35)",
              transition: "all 0.25s", "&:hover": { transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(125,42,232,0.45)" },
            }}>
              <AddRoundedIcon sx={{ fontSize: 18 }} /> Add Location
            </ButtonBase>
          </Box>
        )}
      </Box>

      {isFormView ? (
        /* ── Full Page Form ── */
        <Fade in>
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            {/* Form Header */}
            <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton onClick={closeForm} sx={{ color: "#64748b" }}><CloseRoundedIcon /></IconButton>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "inherit", fontSize: "1.1rem" }}>
                    {editModal ? "Edit Location" : "Add New Location"}
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontFamily: "inherit", fontSize: "0.75rem" }}>
                    {editModal ? `Updating: ${editModal.name}` : "Create one or multiple locations at once"}
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" color="inherit" onClick={closeForm}
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", fontFamily: "inherit", textTransform: "none", borderRadius: 2 }}>
                  Cancel
                </Button>
                <Button variant="contained"
                  startIcon={editModal ? <CheckRoundedIcon /> : <AddRoundedIcon />}
                  disabled={saving || !formComplete}
                  onClick={editModal ? handleUpdate : handleAdd}
                  sx={{
                    bgcolor: editModal ? "#7d2ae8" : "#10b981",
                    "&:hover": { bgcolor: editModal ? "#6b21c1" : "#059669" },
                    color: "#fff", boxShadow: "none", fontFamily: "inherit",
                    textTransform: "none", borderRadius: 2, fontWeight: 600,
                  }}>
                  {saving ? "Saving…" : editModal ? "Save Changes" : "Create Location"}
                </Button>
              </Stack>
            </Box>

            {/* Form Body */}
            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Typography sx={{ fontWeight: 700, color: "#1e293b", mb: 2.5, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 1, fontSize: "0.875rem" }}>
                    <Box sx={{ width: 4, height: 16, bgcolor: editModal ? "#7d2ae8" : "#10b981", borderRadius: 1 }} />
                    Location Details
                  </Typography>
                  <TextField
                    fullWidth label="Location Name" value={formName}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={editModal ? "" : "e.g. Chennai, Mumbai, Delhi"}
                    helperText={!editModal ? "Separate multiple locations with commas" : ""}
                    variant="outlined"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "inherit" }, mb: 2 }}
                  />
                  {/* Completion bar */}
                  <Box>
                    <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "inherit", mb: 0.5, fontWeight: 600 }}>
                      FORM COMPLETION
                    </Typography>
                    <LinearProgress
                      variant="determinate" value={formComplete ? 100 : 0}
                      sx={{ borderRadius: 4, height: 6, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: editModal ? "#7d2ae8" : "#10b981", borderRadius: 4 } }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  {/* Preview / Tips */}
                  <Box sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#f5f0ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FmdGoodRoundedIcon sx={{ color: "#7d2ae8", fontSize: 20 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: "#1e293b", fontFamily: "inherit", fontSize: "0.875rem" }}>
                        {formName.trim() ? "Preview" : "Quick Tips"}
                      </Typography>
                    </Box>
                    {formName.trim() ? (
                      <Stack spacing={1}>
                        {formName.split(",").map(n => n.trim()).filter(Boolean).map((name, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "#fff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                            <LocAvatar name={name} size={32} />
                            <Typography sx={{ fontWeight: 600, color: "#1e293b", fontFamily: "inherit", fontSize: "0.875rem" }}>{name}</Typography>
                            <Chip label="New" size="small" sx={{ ml: "auto", bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, fontFamily: "inherit", fontSize: "0.65rem", height: 18 }} />
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Box component="ul" sx={{ pl: 2.5, m: 0, color: "#64748b", fontSize: "0.82rem", fontFamily: "inherit" }}>
                        <li style={{ marginBottom: 6 }}>Only letters and spaces allowed</li>
                        <li style={{ marginBottom: 6 }}>Use commas to add multiple locations</li>
                        <li>Names should be concise and clear</li>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Fade>
      ) : (
        <>
          {/* ── Stats Row ── */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <StatCard label="Total Locations" value={loading ? "—" : totalElements} icon={LocationOnRoundedIcon} color="#7d2ae8" bg="#f3e8ff" border="#e9d5ff" loading={loading} />
            <StatCard label="This Page" value={loading ? "—" : locations.length} icon={LayersRoundedIcon} color="#0284c7" bg="#e0f2fe" border="#bae6fd" loading={loading} />
            <StatCard label="Total Pages" value={loading ? "—" : totalPages} icon={TravelExploreRoundedIcon} color="#10b981" bg="#dcfce7" border="#bbf7d0" loading={loading} />
          </Stack>

          {/* ── Error ── */}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontFamily: "inherit" }}>{error}</Alert>}

          {/* ── Toolbar ── */}
          <Box className="table-card" sx={{ bgcolor: "#fff", border: "1px solid rgba(125,42,232,0.08)", borderRadius: 3, mb: 2 }}>
            <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, borderBottom: "1px solid rgba(125,42,232,0.07)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "inherit" }}>All Locations</Typography>
                <Chip label={totalElements} size="small" sx={{ bgcolor: "#f3e8ff", color: "#7d2ae8", fontWeight: 700, fontFamily: "inherit", height: 20, fontSize: "0.7rem" }} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                {/* Page size */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "inherit", whiteSpace: "nowrap" }}>Show</Typography>
                  <Select value={pageSize} size="small"
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); localStorage.setItem("itemsPerPage", e.target.value); }}
                    sx={{ fontFamily: "inherit", fontSize: "0.8rem", borderRadius: 2, "& .MuiSelect-select": { py: 0.5, px: 1.5 } }}>
                    {PAGE_SIZES.map(n => <MenuItem key={n} value={n} sx={{ fontFamily: "inherit", fontSize: "0.875rem" }}>{n}</MenuItem>)}
                  </Select>
                </Box>
                {/* View toggle */}
                <ToggleButtonGroup size="small" value={view} exclusive onChange={(_, v) => v && setView(v)}
                  sx={{ "& .MuiToggleButton-root": { px: 1.5, border: "1px solid #e2e8f0", fontFamily: "inherit" }, "& .Mui-selected": { bgcolor: "#f5f0ff !important", color: "#7d2ae8 !important" } }}>
                  <ToggleButton value="table"><Tooltip title="Table"><TableChartRoundedIcon fontSize="small" /></Tooltip></ToggleButton>
                  <ToggleButton value="card"><Tooltip title="Cards"><GridViewRoundedIcon fontSize="small" /></Tooltip></ToggleButton>
                </ToggleButtonGroup>
                {/* Search */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f5f0ff", border: "1.5px solid transparent", borderRadius: "50px", px: 2, py: 0.8, width: 240, transition: "all 0.3s", "&:focus-within": { borderColor: "#7d2ae8", bgcolor: "#fff", boxShadow: "0 0 0 3px rgba(125,42,232,0.1)" } }}>
                  <SearchRoundedIcon sx={{ fontSize: 17, color: "#7d2ae8", flexShrink: 0 }} />
                  <InputBase placeholder="Search locations…" value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    sx={{ fontSize: "0.875rem", fontFamily: "inherit", color: "#1e1b4b", flex: 1 }}
                  />
                  {search && (
                    <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }} sx={{ p: 0, color: "#94a3b8" }}>
                      <CloseRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            {/* ── TABLE VIEW ── */}
            {view === "table" && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...thSx, width: 60 }}>#</TableCell>
                      <TableCell sx={thSx}>Location Name</TableCell>
                      <TableCell sx={{ ...thSx, width: 140 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton variant="text" width={24} /></TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <Skeleton variant="circular" width={34} height={34} />
                              <Skeleton variant="text" width={140} />
                            </Box>
                          </TableCell>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                        </TableRow>
                      ))
                    ) : locations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 52, color: "#e2e8f0" }} />
                            <Typography sx={{ color: "#94a3b8", fontFamily: "inherit", fontWeight: 600 }}>
                              {search ? `No results for "${search}"` : "No locations yet"}
                            </Typography>
                            {!search && (
                              <Button size="small" variant="contained" startIcon={<AddRoundedIcon />}
                                onClick={openAdd}
                                sx={{ bgcolor: "#7d2ae8", "&:hover": { bgcolor: "#6b21c1" }, boxShadow: "none", textTransform: "none", fontFamily: "inherit", borderRadius: 2 }}>
                                Add First Location
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      locations.map((loc, i) => (
                        <TableRow key={loc.id} hover sx={{ "&:hover": { bgcolor: "#faf5ff" }, "&:last-child td": { borderBottom: 0 } }}>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 700, fontFamily: "inherit", fontSize: "0.8rem" }}>
                            {(safePage - 1) * pageSize + i + 1}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <LocAvatar name={loc.name} size={34} />
                              <Typography sx={{ fontWeight: 600, color: "#1e1b4b", fontFamily: "inherit", fontSize: "0.875rem" }}>
                                {loc.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => openEdit(loc)}
                                  sx={{ color: "#f59e0b", bgcolor: "#fef3c7", borderRadius: 1.5, "&:hover": { bgcolor: "#fde68a" } }}>
                                  <EditRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => setDeleteModal(loc)}
                                  sx={{ color: "#ef4444", bgcolor: "#fee2e2", borderRadius: 1.5, "&:hover": { bgcolor: "#fecaca" } }}>
                                  <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ── CARD VIEW ── */}
            {view === "card" && (
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5 }}>
                          <Skeleton variant="circular" width={44} height={44} sx={{ mb: 1.5 }} />
                          <Skeleton width="70%" height={24} sx={{ mb: 0.5 }} />
                          <Skeleton width="45%" height={18} />
                        </Paper>
                      </Grid>
                    ))
                  ) : locations.length === 0 ? (
                    <Grid item xs={12}>
                      <Box sx={{ py: 8, textAlign: "center" }}>
                        <LocationOnRoundedIcon sx={{ fontSize: 56, color: "#e2e8f0", mb: 1 }} />
                        <Typography sx={{ color: "#94a3b8", fontFamily: "inherit" }}>
                          {search ? `No results for "${search}"` : "No locations yet"}
                        </Typography>
                      </Box>
                    </Grid>
                  ) : (
                    locations.map((loc, i) => {
                      const [c1, c2] = getGradient(loc.name);
                      return (
                        <Grid item xs={12} sm={6} md={4} key={loc.id}>
                          <Paper elevation={0} sx={{
                            border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5,
                            display: "flex", flexDirection: "column",
                            transition: "all 0.2s",
                            "&:hover": { boxShadow: `0 8px 28px ${c1}25`, borderColor: c1, transform: "translateY(-3px)" },
                            position: "relative", overflow: "hidden",
                            "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c1}, ${c2})` },
                          }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                              <LocAvatar name={loc.name} size={44} />
                              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, px: 1.2, py: 0.4, fontFamily: "inherit" }}>
                                #{(safePage - 1) * pageSize + i + 1}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", fontFamily: "inherit", mb: 0.25 }}>
                              {loc.name}
                            </Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", fontFamily: "inherit", mb: 2 }}>Location Node</Typography>
                            <Divider sx={{ mb: 1.5 }} />
                            <Stack direction="row" spacing={1}>
                              <Button size="small" fullWidth startIcon={<EditRoundedIcon />} onClick={() => openEdit(loc)}
                                sx={{ color: "#f59e0b", bgcolor: "#fef3c7", "&:hover": { bgcolor: "#fde68a" }, fontWeight: 600, fontFamily: "inherit", textTransform: "none", borderRadius: 2 }}>
                                Edit
                              </Button>
                              <Button size="small" fullWidth startIcon={<DeleteRoundedIcon />} onClick={() => setDeleteModal(loc)}
                                sx={{ color: "#ef4444", bgcolor: "#fee2e2", "&:hover": { bgcolor: "#fecaca" }, fontWeight: 600, fontFamily: "inherit", textTransform: "none", borderRadius: 2 }}>
                                Delete
                              </Button>
                            </Stack>
                          </Paper>
                        </Grid>
                      );
                    })
                  )}
                </Grid>
              </Box>
            )}
          </Box>

          {/* ── Pagination ── */}
          {!loading && totalElements > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, flexWrap: "wrap", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#64748b", fontFamily: "inherit" }}>
                Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> entries
              </Typography>
              <Pagination count={totalPages} page={safePage} onChange={(_, v) => setPage(v)}
                shape="rounded" size="small"
                sx={{
                  "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 600, fontFamily: "inherit" },
                  "& .Mui-selected": { bgcolor: "#7d2ae8 !important", color: "#fff" },
                }}
              />
            </Box>
          )}

          {/* ── Delete Dialog ── */}
          <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "#1e1b4b", pb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <WarningAmberRoundedIcon sx={{ color: "#ef4444", fontSize: 20 }} />
                </Box>
                Delete Location
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ fontFamily: "inherit", color: "#64748b", fontSize: "0.9rem" }}>
                Delete <strong>"{deleteModal?.name}"</strong>? This cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button variant="outlined" color="inherit" onClick={() => setDeleteModal(null)}
                sx={{ color: "#64748b", borderColor: "#e2e8f0", fontFamily: "inherit", textTransform: "none", borderRadius: 2 }}>
                Cancel
              </Button>
              <Button variant="contained" color="error" startIcon={<DeleteRoundedIcon />}
                disabled={saving} onClick={handleDelete}
                sx={{ boxShadow: "none", fontFamily: "inherit", textTransform: "none", borderRadius: 2, fontWeight: 600 }}>
                {saving ? "Deleting…" : "Delete"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Toast ── */}
          <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <Alert severity={toast?.type === "success" ? "success" : toast?.type === "warning" ? "warning" : "error"}
              onClose={() => setToast(null)} sx={{ borderRadius: 2, fontFamily: "inherit", fontWeight: 500 }}>
              {toast?.message}
            </Alert>
          </Snackbar>

          {/* ── Bulk Upload ── */}
          <BulkUploadModal
            open={bulkOpen} onClose={() => setBulkOpen(false)}
            title="Bulk Upload Locations" accent="#10b981"
            templateHeaders={["name"]}
            templateRows={[["Chennai"], ["Mumbai"], ["Delhi"]]}
            parseRow={(row) => {
              const name = (row["name"] || "").trim();
              if (!name) return { valid: false, error: "Name required" };
              if (/[^a-zA-Z\s]/.test(name)) return { valid: false, error: "Only letters/spaces allowed" };
              return { valid: true, data: { name } };
            }}
            onUpload={(rows) => bulkCreateLocations(rows.map(r => r.name))}
            onDone={() => fetchLocations()}
          />
        </>
      )}
    </Box>
  );
};

export default Location;
