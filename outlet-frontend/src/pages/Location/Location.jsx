import { useEffect, useState } from "react";
import { getLocations, createLocation, updateLocation, deleteLocation, bulkCreateLocations } from "../../services/locationService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatLocationData } from "../../utils/exportUtils";
import BulkUploadModal from "../../components/BulkUploadModal";
import { FormContainer, FormHeader, FormSectionHeader } from "../../components/common/FormComponents";
import "../UserManagement/UserManagement.css";

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
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b", mb: 0.25 }}>
            <TypingText text="Location Management" />
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
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
            <Button variant="outlined" color="primary" startIcon={<UploadFileRoundedIcon />}
              onClick={() => setBulkOpen(true)}
              sx={{ borderRadius: 2.5, px: 2, py: 1, textTransform: "none", fontWeight: 600, fontFamily: "inherit" }}>
              Bulk Upload
            </Button>
            <ExportMenu getData={() => formatLocationData(allLocations)} filename="locations" title="Locations Report" backendType="locations" />
            <Button variant="contained" color="primary" startIcon={<AddRoundedIcon />}
              onClick={openAdd}
              sx={{ borderRadius: 2.5, px: 2.5, py: 1, fontWeight: 600, fontFamily: "inherit", boxShadow: "none" }}>
              Add Location
            </Button>
          </Box>
        )}
      </Box>

      {isFormView ? (
        /* ── Full Page Form ── */
        <Fade in>
          <Box>
            <FormContainer>
              <FormHeader
                title={editModal ? "Edit Location" : "Add New Location"}
                subtitle={editModal ? `Updating: ${editModal.name}` : "Create one or multiple locations at once"}
                onClose={closeForm}
                onSave={editModal ? handleUpdate : handleAdd}
                saving={saving}
                saveDisabled={!formComplete}
                saveLabel={editModal ? "Save Changes" : "Create Location"}
                saveIcon={editModal ? <EditRoundedIcon /> : <AddRoundedIcon />}
                colorAccent="primary"
              />

              {/* Form Body */}
              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={7}>
                    <FormSectionHeader
                      title="Location Details"
                      color={editModal ? "#7d2ae8" : "#10b981"}
                    />
                    <TextField
                      fullWidth
                      label="Location Name"
                      value={formName}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={editModal ? "" : "e.g. Chennai, Mumbai, Delhi"}
                      helperText={!editModal ? "Separate multiple locations with commas" : ""}
                      sx={{ mb: 2 }}
                    />
                    {/* Completion bar */}
                    <Box>
                      <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", fontFamily: "inherit", mb: 0.5, fontWeight: 600 }}>
                        FORM COMPLETION
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={formComplete ? 100 : 0}
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
            </FormContainer>
          </Box>
        </Fade>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <Box className="stat-cards-row">
            {[
              { label: "Total Locations", value: totalElements, icon: LocationOnRoundedIcon, theme: "purple", color: "#7d2ae8", bg: "#f3e8ff" },
              { label: "This Page", value: locations.length, icon: LayersRoundedIcon, theme: "blue", color: "#0284c7", bg: "#e0f2fe" },
              { label: "Total Pages", value: totalPages, icon: TravelExploreRoundedIcon, theme: "green", color: "#10b981", bg: "#dcfce7" },
            ].map((s, i) => (
              <Box className={`stat-card stat-${s.theme}`} key={i}>
                <Box className="stat-card-icon" sx={{ background: s.bg }}>
                  <s.icon sx={{ fontSize: 22, color: s.color }} />
                </Box>
                <Box>
                  <Typography className="stat-card-value">{loading ? "—" : s.value}</Typography>
                  <Typography className="stat-card-label">{s.label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

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
                              <Button size="small" variant="contained" color="primary" startIcon={<AddRoundedIcon />}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, boxShadow: "none" }}
                                onClick={openAdd}>
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
                        <Grid item xs={12} sm={6} md={6} lg={4} key={loc.id}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 4,
                              border: "1px solid #f1f5f9",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-6px)",
                                boxShadow: "0 15px 30px rgba(0,0,0,0.08)",
                                borderColor: "#e2e8f0"
                              }
                            }}
                          >
                            <Box sx={{ position: "relative", mb: 2 }}>
                              <Avatar
                                variant="rounded"
                                sx={{
                                  width: "100%",
                                  height: 160,
                                  background: `linear-gradient(135deg, ${c1}15, ${c2}25)`,
                                  borderRadius: 3,
                                  border: "1px solid #f1f5f9",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <LocAvatar name={loc.name} size={64} />
                              </Avatar>
                              <Typography variant="caption" sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(255,255,255,0.9)", px: 1, py: 0.5, borderRadius: 1.5, color: "#94a3b8", fontWeight: 600, backdropFilter: "blur(4px)" }}>
                                #{(safePage - 1) * pageSize + i + 1}
                              </Typography>
                            </Box>
                            
                            <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", mb: 0.5 }}>
                              {loc.name}
                            </Typography>
                            <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mb: 2 }}>Location Node</Typography>
                            
                            <Divider sx={{ mb: 1.5 }} />
                            
                            <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                              <Button
                                size="small"
                                fullWidth
                                variant="outlined"
                                startIcon={<EditRoundedIcon />}
                                onClick={() => openEdit(loc)}
                                sx={{
                                  borderRadius: 2,
                                  color: "#6366f1",
                                  borderColor: "#eef2ff",
                                  bgcolor: "#fefefe",
                                  "&:hover": { bgcolor: "#eef2ff", borderColor: "#6366f1" },
                                  textTransform: "none",
                                  fontWeight: 600
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                fullWidth
                                variant="contained"
                                color="error"
                                startIcon={<DeleteRoundedIcon />}
                                onClick={() => setDeleteModal(loc)}
                                sx={{
                                  borderRadius: 2,
                                  boxShadow: "none",
                                  bgcolor: "#fef2f2",
                                  color: "#ef4444",
                                  "&:hover": { bgcolor: "#fee2e2", boxShadow: "none" },
                                  textTransform: "none",
                                  fontWeight: 600
                                }}
                              >
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
