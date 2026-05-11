import { useEffect, useState, useMemo } from "react";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { getOutlets, createOutlet, updateOutlet, deleteOutlet } from "../../services/outletService";
import { getLocations } from "../../services/locationService";
import { getDivisions } from "../../services/devisionService";

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
  Chip,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Stack,
  Divider,
} from "@mui/material";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";

// Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";

/* ── MUI Theme ── */
const theme = createTheme({
  palette: {
    primary: { main: "#6366f1" },
    secondary: { main: "#8b5cf6" },
    error: { main: "#ef4444" },
    info: { main: "#06b6d4" },
    success: { main: "#10b981" },
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
        paper: { borderRadius: 16, minWidth: 520 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          background: "linear-gradient(90deg, #0f172a, #1e1b4b)",
          color: "rgba(255,255,255,0.6)",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          padding: "14px 18px",
        },
        body: {
          padding: "13px 18px",
          borderBottom: "1px solid #f8fafc",
          verticalAlign: "middle",
          fontSize: "14px",
        },
      },
    },
  },
});

/* ── Styled Table Components ── */
const StyledTableRow = styled(TableRow)(() => ({
  "&:hover": { backgroundColor: "#fafbff" },
  "&:last-child td": { borderBottom: "none" },
}));

const StyledTableContainer = styled(TableContainer)(() => ({
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)",
  overflow: "hidden",
  marginBottom: "20px",
}));

/* ── Constants ── */
const OUTLET_TYPES = ["Retail", "Wholesale", "Franchise", "Online", "Distribution", "Warehouse", "Corporate", "Branch Office"];

const TYPE_COLOR = {
  Retail: { bg: "#eef2ff", color: "#6366f1" },
  Wholesale: { bg: "#ecfdf5", color: "#10b981" },
  Franchise: { bg: "#fffbeb", color: "#f59e0b" },
  Online: { bg: "#ecfeff", color: "#06b6d4" },
  Distribution: { bg: "#fdf4ff", color: "#a855f7" },
  Warehouse: { bg: "#fff7ed", color: "#f97316" },
  Corporate: { bg: "#f0fdf4", color: "#22c55e" },
  "Branch Office": { bg: "#fef2f2", color: "#ef4444" },
};

const EMPTY_FORM = {
  outletName: "", address: "", locationId: "", locationName: "",
  mappings: {}, outletType: "", ownerName: "",
};

const PAGE_SIZES = [5, 10, 25, 50];

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

export default function Outlet() {
  const [outlets, setOutlets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [view, setView] = useState("table");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const showToast = (message, type = "error") => setToast({ message, type });

  /* ── Validation helpers ── */
  const handleOutletNameChange = (e) => {
    const value = e.target.value;
    if (value.startsWith(" ")) { showToast("Outlet name cannot start with a space.", "warning"); return; }
    if (/\d/.test(value)) { showToast("Outlet name cannot contain numbers.", "warning"); return; }
    if (/[\u0900-\u097F]/.test(value)) { showToast("Please enter outlet name in English only.", "warning"); return; }
    setForm((f) => ({ ...f, outletName: value }));
  };

  const handleOwnerNameChange = (e) => {
    const value = e.target.value;
    if (value.startsWith(" ")) { showToast("Owner name cannot start with a space.", "warning"); return; }
    if (/\d/.test(value)) { showToast("Owner name cannot contain numbers.", "warning"); return; }
    if (/[\u0900-\u097F]/.test(value)) { showToast("Please enter owner name in English only.", "warning"); return; }
    setForm((f) => ({ ...f, ownerName: value }));
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    if (value.startsWith(" ")) { showToast("Address cannot start with a space.", "warning"); return; }
    setForm((f) => ({ ...f, address: value }));
  };

  const validateForm = () => {
    if (!form.outletName.trim()) { showToast("Outlet name is required.", "error"); return false; }
    if (!form.locationId) { showToast("Location is required.", "error"); return false; }
    if (!form.outletType) { showToast("Outlet type is required.", "error"); return false; }
    if (!form.ownerName.trim()) { showToast("Owner name is required.", "error"); return false; }
    if (!form.address.trim()) { showToast("Address is required.", "error"); return false; }
    if (!Object.values(form.mappings).some((pids) => pids.length > 0)) {
      showToast("At least one division and product must be selected.", "error"); return false;
    }
    return true;
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(false, controller.signal);
    return () => controller.abort();
  }, []);

  const extractList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.content)) return val.content;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.data?.content)) return val.data.content;
    return [];
  };

  const fetchAll = async (silent = false, signal) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [oRes, lRes, dRes] = await Promise.allSettled([
        getOutlets(0, 1000, "", signal),
        getLocations(0, 1000, "", signal),
        getDivisions(0, 1000, "", signal),
      ]);

      if (lRes.status === "fulfilled") {
        const list = extractList(lRes.value);
        setLocations(list.map(l => ({ ...l, name: l.name || l.locationName })));
      } else {
        setLocations([]);
      }

      if (dRes.status === "fulfilled") {
        const list = extractList(dRes.value);
        setDivisions(list.map(d => ({ ...d, name: d.name || d.divisionName })));
      } else {
        setDivisions([]);
      }

      if (oRes.status === "fulfilled") {
        const httpStatus = oRes.value?.data?.httpStatus;
        if (httpStatus === 401 || httpStatus === 403) return;
        const raw = extractList(oRes.value);
        const enriched = raw.map((o) => {
          let divObjs = [];
          if (Array.isArray(o.divisions)) {
            divObjs = o.divisions;
          } else if (Array.isArray(o.mappings) && o.mappings.length > 0) {
            const divisionMap = new Map();
            o.mappings.forEach((mapping) => {
              const divId = mapping.divisionId || mapping.division?.id;
              const divName = mapping.divisionName || mapping.division?.name;
              if (divId) {
                if (!divisionMap.has(divId)) divisionMap.set(divId, { id: divId, name: divName, products: [] });
                const prodId = mapping.productId || mapping.product?.id;
                const prodName = mapping.productName || mapping.product?.name;
                const prodCode = mapping.productCode || mapping.product?.productCode;
                if (prodId) divisionMap.get(divId).products.push({ id: prodId, name: prodName, productCode: prodCode });
              }
            });
            divObjs = Array.from(divisionMap.values());
          } else if (o.division) {
            divObjs = [o.division];
          }

          let allProducts = [];
          divObjs.forEach((d) => {
            if (Array.isArray(d.products))
              allProducts = allProducts.concat(d.products.map((p) => ({ ...p, divisionName: d.name })));
          });

          return {
            ...o,
            locationName: o.locationName || o.location?.name || null,
            divisions: divObjs,
            divisionIds: divObjs.map((d) => d.id).filter(Boolean),
            divisionNames: divObjs.map((d) => d.name).filter(Boolean),
            productNames: allProducts.map((p) => p.name).filter(Boolean),
            allProducts,
            ownerName: o.ownerName ?? null,
            address: o.address ?? null,
          };
        });
        setOutlets(enriched);
      }
    } catch (e) {
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleDivisionSelect = (divisionId) => {
    if (!divisionId) return;
    const division = divisions.find((d) => d.id == divisionId);
    if (!division || selectedDivisions.find((d) => d.id == divisionId)) return;
    const next = [...selectedDivisions, division];
    setSelectedDivisions(next);
    setForm((f) => ({ ...f, mappings: { ...f.mappings, [divisionId]: [] } }));
    updateAvailableProducts(next);
  };

  const removeDivision = (divisionId) => {
    const next = selectedDivisions.filter((d) => d.id != divisionId);
    setSelectedDivisions(next);
    setForm((f) => { const m = { ...f.mappings }; delete m[divisionId]; return { ...f, mappings: m }; });
    updateAvailableProducts(next);
  };

  const updateAvailableProducts = (divisionList) => {
    setAvailableProducts(
      divisionList.flatMap((d) =>
        (d.products || []).map((p) => ({ ...p, divisionId: d.id, divisionName: d.name, displayName: `${p.name} (${d.name})` }))
      )
    );
  };

  const handleProductSelect = (productId) => {
    if (!productId) return;
    const product = availableProducts.find((p) => p.id == productId);
    if (!product) return;
    const divisionId = product.divisionId;
    setForm((f) => {
      const curr = f.mappings[divisionId] || [];
      if (!curr.includes(Number(productId))) {
        return { ...f, mappings: { ...f.mappings, [divisionId]: [...curr, Number(productId)] } };
      }
      return f;
    });
  };

  const removeProduct = (divisionId, productId) => {
    setForm((f) => ({
      ...f,
      mappings: { ...f.mappings, [divisionId]: (f.mappings[divisionId] || []).filter((pid) => pid != productId) },
    }));
  };

  const buildPayload = (id = null) => {
    const locId = form.locationId
      ? Number(form.locationId)
      : locations.find((l) => l.name === form.locationName)?.id ?? null;
    const mappings = Object.entries(form.mappings).flatMap(([divId, prodIds]) =>
      prodIds.map((pid) => ({ divisionId: Number(divId), productId: Number(pid) }))
    );
    const payload = { outletName: form.outletName.trim(), address: form.address.trim(), locationId: locId, outletType: form.outletType, ownerName: form.ownerName.trim(), mappings };
    if (id) payload.id = id;
    return payload;
  };

  const refreshLocations = async () => {
    try {
      const res = await getLocations(0, 100);
      const list = extractList(res);
      setLocations(list);
      return list;
    } catch { return []; }
  };

  const openAddModal = async () => {
    setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]);
    setAddModal(true); await refreshLocations();
  };

  const openEditModal = async (o) => {
    const locs = await refreshLocations();
    const locId = o.locationId ? String(o.locationId) : String(locs.find((l) => l.name === (o.locationName || ""))?.id ?? "");
    const mappings = {};
    const selectedDivs = [];
    (o.divisions ?? []).forEach((d) => { mappings[d.id] = (d.products ?? []).map((p) => p.id); selectedDivs.push(d); });
    setSelectedDivisions(selectedDivs);
    updateAvailableProducts(selectedDivs);
    setForm({ outletName: o.outletName ?? "", address: o.address ?? "", locationId: locId, locationName: o.locationName ?? "", mappings, outletType: o.outletType ?? "", ownerName: o.ownerName ?? "" });
    setEditModal(o);
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createOutlet(buildPayload());
      await fetchAll(true);
      setAddModal(false); setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]);
      showToast("Outlet added successfully!", "success");
    } catch (e) {
      showToast("Failed to add outlet: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await updateOutlet(editModal.id, buildPayload(editModal.id));
      await fetchAll(true);
      setEditModal(null); setForm(EMPTY_FORM); setSelectedDivisions([]); setAvailableProducts([]);
      showToast("Outlet updated successfully!", "success");
    } catch (e) {
      showToast("Failed to update outlet: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const allFilterProducts = useMemo(() => {
    const list = divisions.flatMap((d) =>
      (d.products || []).map((p) => ({ ...p, name: `${p.name} (${d.name})` }))
    );
    // Remove duplicates by id
    const unique = [];
    const seen = new Set();
    list.forEach(p => {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    });
    return unique;
  }, [divisions]);

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteOutlet(deleteModal.id);
      await fetchAll(true);
      setDeleteModal(null);
      showToast("Outlet deleted successfully!", "success");
    } catch (e) {
      showToast("Failed to delete outlet: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    let result = outlets.filter((o) =>
      [o.outletName, o.outletType, o.locationName, o.location, o.ownerName]
        .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );
    if (locationFilter) result = result.filter((o) => String(o.locationId) === String(locationFilter) || o.locationName?.toLowerCase().includes(locationFilter.toLowerCase()));
    if (typeFilter) result = result.filter((o) => o.outletType === typeFilter);
    if (divisionFilter) result = result.filter((o) => (o.divisionIds || []).some(id => String(id) === String(divisionFilter)));
    if (productFilter) result = result.filter((o) => (o.allProducts || []).some(p => String(p.id) === String(productFilter)));
    return result;
  }, [outlets, search, locationFilter, typeFilter, divisionFilter, productFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, filtered.length);

  /* ── Form Fields ── */
  const renderFormFields = () => (
    <Stack spacing={2} sx={{ pt: 1, overflow: "visible" }}>
      <Grid container spacing={2} sx={{ overflow: "visible" }}>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Outlet Name" required
            name="outletName" value={form.outletName} onChange={handleOutletNameChange} placeholder="e.g. Main Branch" />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Owner Name" required
            name="ownerName" value={form.ownerName} onChange={handleOwnerNameChange} placeholder="e.g. John Doe" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ overflow: "visible" }}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>
              Location <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <SearchableSelect
              options={locations}
              value={form.locationId}
              onChange={(id, name) => setForm((f) => ({ ...f, locationId: id, locationName: name }))}
              placeholder="— Select location —"
              searchPlaceholder="Search locations..."
              required
            />
            {locations.length === 0 && (
              <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5, display: "block" }}>
                ⚠️ No locations loaded. Please check the Location page.
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>
              Outlet Type <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <SearchableSelect
              options={OUTLET_TYPES.map(t => ({ id: t, name: t }))}
              value={form.outletType}
              onChange={(id) => setForm((f) => ({ ...f, outletType: id }))}
              placeholder="— Select type —"
              searchPlaceholder="Search types..."
              required
            />
          </Box>
        </Grid>
      </Grid>

      <TextField fullWidth size="small" label="Address" required multiline rows={2}
        name="address" value={form.address} onChange={handleAddressChange} placeholder="e.g. 123 Main St, City" />

      {/* Divisions & Products */}
      <Box>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 1 }}>
          Divisions & Products <span style={{ color: "#ef4444" }}>*</span>
          <span style={{ fontWeight: 400, marginLeft: 6, color: "#94a3b8" }}>(select division then its products)</span>
        </Typography>

        <Grid container spacing={2} sx={{ mb: 1.5, overflow: "visible" }}>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>Select Division</Typography>
            <SearchableSelect
              options={divisions.filter((d) => !selectedDivisions.find((sd) => sd.id === d.id))}
              value=""
              onChange={handleDivisionSelect}
              placeholder="— Add division —"
              searchPlaceholder="Search divisions..."
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>Select Product</Typography>
            <SearchableSelect
              options={availableProducts.filter((p) => {
                const curr = form.mappings[p.divisionId] || [];
                return !curr.includes(p.id);
              })}
              value=""
              onChange={handleProductSelect}
              placeholder="— Add product —"
              searchPlaceholder="Search products..."
              disabled={selectedDivisions.length === 0}
            />
          </Grid>
        </Grid>

        {/* Selected mappings */}
        {selectedDivisions.length > 0 && (
          <Stack spacing={1.5}>
            {selectedDivisions.map((division) => {
              const selectedProducts = (form.mappings[division.id] || [])
                .map((pid) => availableProducts.find((p) => p.id === pid))
                .filter(Boolean);
              return (
                <Paper key={division.id} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#1e293b" }}>{division.name}</Typography>
                    <IconButton size="small" onClick={() => removeDivision(division.id)} sx={{ color: "#ef4444", p: 0.3 }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ p: 1.5 }}>
                    {selectedProducts.length === 0 ? (
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>No products selected</Typography>
                    ) : (
                      <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {selectedProducts.map((product) => (
                          <Chip
                            key={product.id}
                            label={product.name}
                            size="small"
                            onDelete={() => removeProduct(division.id, product.id)}
                            sx={{ bgcolor: "#eef2ff", color: "#6366f1", fontWeight: 600, fontSize: "0.72rem" }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

        {/* ── Hero ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b" }}>Outlet Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} color="primary"
            sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
            onClick={openAddModal}>
            Add Outlet
          </Button>
        </Box>

        {/* ── Stats ── */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          <StatCard label="Total Outlets" value={loading ? "—" : outlets.length} color="#6366f1" bg="#eef2ff" icon={<HomeWorkIcon />} />
          <StatCard label="Filtered" value={loading ? "—" : filtered.length} color="#10b981" bg="#ecfdf5" icon={<SearchIcon />} />
          <StatCard label="Locations Used" value={loading ? "—" : [...new Set(outlets.map((o) => o.locationName).filter(Boolean))].length} color="#f59e0b" bg="#fffbeb" icon={<LocationOnIcon />} />
          <StatCard label="Types" value={loading ? "—" : [...new Set(outlets.map((o) => o.outletType).filter(Boolean))].length} color="#06b6d4" bg="#ecfeff" icon={<GridViewIcon />} />
        </Stack>

        {/* ── Error ── */}
        {error && <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* ── Toolbar ── */}
        <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>

            {/* Search */}
            <TextField
              size="small" placeholder="Search by name, type, location…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ minWidth: 260, flex: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#94a3b8", fontSize: 18 }} /></InputAdornment>,
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}><CloseIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Filters */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ flex: 1 }}>
              <Box sx={{ minWidth: 160 }}>
                <SearchableSelect
                  options={locations}
                  value={locationFilter}
                  onChange={(id) => { setLocationFilter(id); setPage(1); }}
                  placeholder="All Locations"
                  searchPlaceholder="Search locations..."
                />
              </Box>

              <Box sx={{ minWidth: 160 }}>
                <SearchableSelect
                  options={OUTLET_TYPES.map(t => ({ id: t, name: t }))}
                  value={typeFilter}
                  onChange={(id) => { setTypeFilter(id); setPage(1); }}
                  placeholder="All Types"
                  searchPlaceholder="Search types..."
                />
              </Box>

              <Box sx={{ minWidth: 160 }}>
                <SearchableSelect
                  options={divisions}
                  value={divisionFilter}
                  onChange={(id) => { setDivisionFilter(id); setPage(1); }}
                  placeholder="All Divisions"
                  searchPlaceholder="Search divisions..."
                />
              </Box>

              <Box sx={{ minWidth: 160 }}>
                <SearchableSelect
                  options={allFilterProducts}
                  value={productFilter}
                  onChange={(id) => { setProductFilter(id); setPage(1); }}
                  placeholder="All Products"
                  searchPlaceholder="Search products..."
                />
              </Box>

              {(locationFilter || typeFilter || divisionFilter || productFilter || search) && (
                <Button size="small" variant="outlined" color="inherit"
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", height: 42, borderRadius: 2, px: 2 }}
                  onClick={() => { setLocationFilter(""); setTypeFilter(""); setDivisionFilter(""); setProductFilter(""); setSearch(""); setPage(1); }}>
                  Clear
                </Button>
              )}
            </Stack>

            {/* Show entries + View toggle */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: { md: "auto" } }}>
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
          <StyledTableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["#", "Outlet Name", "Code", "Type", "Location", "Divisions", "Products", "Owner Name", "Address", "Actions"].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      {Array(10).fill(0).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" width={j === 1 ? 140 : 80} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <HomeWorkIcon sx={{ fontSize: 48, color: "#cbd5e1" }} />
                        <Typography color="text.secondary">{search ? "No outlets match your search" : "No outlets yet"}</Typography>
                        {!search && (
                          <Button variant="contained" size="small" startIcon={<AddIcon />} color="primary"
                            sx={{ boxShadow: "none" }} onClick={openAddModal}>
                            Add First Outlet
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((o, i) => {
                    const tc = TYPE_COLOR[o.outletType] ?? { bg: "#f1f5f9", color: "#64748b" };
                    return (
                      <StyledTableRow key={o.id}>
                        <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>{(safePage - 1) * pageSize + i + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", fontWeight: 700, bgcolor: "#eef2ff", color: "#6366f1" }}>
                              {o.outletName?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>{o.outletName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {o.outletCode
                            ? <Chip label={o.outletCode} size="small" sx={{ bgcolor: "#f8fafc", color: "#475569", fontFamily: "monospace", fontSize: "0.72rem" }} />
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>
                        <TableCell>
                          {o.outletType
                            ? <Chip label={o.outletType} size="small" sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 700 }} />
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>
                        <TableCell>
                          {o.locationName
                            ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><LocationOnIcon sx={{ fontSize: 14, color: "#94a3b8" }} /><Typography variant="body2">{o.locationName}</Typography></Box>
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>
                        <TableCell>
                          {(!o.divisionNames || o.divisionNames.length === 0) ? (
                            <Typography variant="body2" sx={{ color: "#cbd5e1" }}>No divisions</Typography>
                          ) : (
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {o.divisionNames.map((d, idx) => (
                                <Chip key={idx} label={d || "Unknown"} size="small"
                                  sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontSize: "0.7rem" }} />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          {(!o.productNames || o.productNames.length === 0) ? (
                            <Typography variant="body2" sx={{ color: "#cbd5e1" }}>No products</Typography>
                          ) : (
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {o.productNames.map((p, idx) => (
                                <Chip key={idx} label={p || "Unknown"} size="small"
                                  sx={{ bgcolor: "#eef2ff", color: "#6366f1", fontSize: "0.7rem" }} />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          {o.ownerName
                            ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><PersonIcon sx={{ fontSize: 14, color: "#94a3b8" }} /><Typography variant="body2">{o.ownerName}</Typography></Box>
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>
                        <TableCell>
                          {o.address
                            ? <Typography variant="body2" sx={{ color: "#475569", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.address}</Typography>
                            : <Typography variant="body2" sx={{ color: "#cbd5e1" }}>—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditModal(o)}
                                sx={{ color: "#6366f1", bgcolor: "#eef2ff", borderRadius: 1.5, "&:hover": { bgcolor: "#e0e7ff" } }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => setDeleteModal(o)}
                                sx={{ color: "#ef4444", bgcolor: "#fef2f2", borderRadius: 1.5, "&:hover": { bgcolor: "#fee2e2" } }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </StyledTableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </StyledTableContainer>
        )}

        {/* ── Card View ── */}
        {view === "card" && (
          <Grid container spacing={2}>
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5 }}>
                    <Skeleton variant="circular" width={44} height={44} sx={{ mb: 1 }} />
                    <Skeleton width="60%" height={24} sx={{ mb: 0.5 }} />
                    <Skeleton width="40%" height={18} />
                  </Paper>
                </Grid>
              ))
            ) : paginated.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <HomeWorkIcon sx={{ fontSize: 56, color: "#cbd5e1", mb: 1 }} />
                  <Typography color="text.secondary">{search ? "No outlets match your search" : "No outlets yet"}</Typography>
                </Box>
              </Grid>
            ) : (
              paginated.map((o, i) => {
                const tc = TYPE_COLOR[o.outletType] ?? { bg: "#f1f5f9", color: "#64748b" };
                return (
                  <Grid item xs={12} sm={6} md={4} key={o.id}>
                    <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5, height: "100%", display: "flex", flexDirection: "column", transition: "box-shadow .2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,.08)" } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                        <Avatar sx={{ width: 44, height: 44, fontSize: "1rem", fontWeight: 700, bgcolor: "#eef2ff", color: "#6366f1" }}>
                          {o.outletName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>#{(safePage - 1) * pageSize + i + 1}</Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", mb: 0.5 }}>{o.outletName}</Typography>
                      {o.outletCode && (
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontFamily: "monospace", mb: 0.75 }}>{o.outletCode}</Typography>
                      )}
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1 }}>
                        {o.outletType && <Chip label={o.outletType} size="small" sx={{ bgcolor: tc.bg, color: tc.color, fontWeight: 700 }} />}
                        {o.locationName && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                            <LocationOnIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                            <Typography variant="caption" sx={{ color: "#64748b" }}>{o.locationName}</Typography>
                          </Box>
                        )}
                      </Stack>

                      {(o.divisionNames?.length > 0) && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 0.75 }}>
                          {o.divisionNames.map((d, idx) => <Chip key={idx} label={d} size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontSize: "0.7rem" }} />)}
                        </Stack>
                      )}
                      {(o.productNames?.length > 0) && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 0.75 }}>
                          {o.productNames.map((p, idx) => <Chip key={idx} label={p} size="small" sx={{ bgcolor: "#eef2ff", color: "#6366f1", fontSize: "0.7rem" }} />)}
                        </Stack>
                      )}
                      {o.ownerName && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                          <Typography variant="caption" sx={{ color: "#64748b" }}>{o.ownerName}</Typography>
                        </Box>
                      )}
                      {o.address && (
                        <Typography variant="caption" sx={{ color: "#94a3b8", mb: 1, display: "block" }}>{o.address}</Typography>
                      )}

                      <Divider sx={{ my: 1 }} />
                      <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => openEditModal(o)}
                          sx={{ flex: 1, color: "#6366f1", bgcolor: "#eef2ff", "&:hover": { bgcolor: "#e0e7ff" }, fontWeight: 600 }}>Edit</Button>
                        <Button size="small" startIcon={<DeleteIcon />} onClick={() => setDeleteModal(o)}
                          sx={{ flex: 1, color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" }, fontWeight: 600 }}>Delete</Button>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })
            )}
          </Grid>
        )}

        {/* ── Pagination ── */}
        {!loading && filtered.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Showing <strong>{start}–{end}</strong> of <strong>{filtered.length}</strong> entries
            </Typography>
            <Pagination
              count={totalPages} page={safePage} onChange={(_, v) => setPage(v)}
              shape="rounded" size="small"
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 600 },
                "& .Mui-selected": { bgcolor: "#6366f1 !important", color: "#fff" },
              }}
            />
          </Box>
        )}

        {/* ── Add Modal ── */}
        <Dialog open={addModal} onClose={() => { setAddModal(false); setForm(EMPTY_FORM); }} maxWidth="sm" fullWidth PaperProps={{ sx: { overflow: "visible !important" } }}>
          <ModalIconHeader icon={<AddIcon />} title="Add Outlet" subtitle="Register a new outlet" accent="#6366f1"
            onClose={() => { setAddModal(false); setForm(EMPTY_FORM); }} />
          <DialogContent sx={{ pt: 2, pb: 12, overflow: "visible !important", minHeight: "550px" }}>{renderFormFields()}</DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => { setAddModal(false); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button variant="contained" startIcon={<AddIcon />} disabled={saving} color="primary"
              sx={{ boxShadow: "none" }} onClick={handleAdd}>
              {saving ? "Adding…" : "Add Outlet"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Edit Modal ── */}
        <Dialog open={!!editModal} onClose={() => { setEditModal(null); setForm(EMPTY_FORM); }} maxWidth="sm" fullWidth PaperProps={{ sx: { overflow: "visible !important" } }}>
          <ModalIconHeader icon={<EditIcon />} title="Edit Outlet" subtitle={editModal ? `Editing: ${editModal.outletName}` : ""} accent="#8b5cf6"
            onClose={() => { setEditModal(null); setForm(EMPTY_FORM); }} />
          <DialogContent sx={{ pt: 2, pb: 12, overflow: "visible !important", minHeight: "550px" }}>{renderFormFields()}</DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => { setEditModal(null); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button variant="contained" startIcon={<EditIcon />} disabled={saving}
              sx={{ bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" }, color: "#fff", boxShadow: "none" }}
              onClick={handleUpdate}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Modal ── */}
        <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} maxWidth="xs" fullWidth>
          <ModalIconHeader icon={<WarningAmberIcon />} title="Delete Outlet" subtitle="This action cannot be undone" accent="#ef4444"
            onClose={() => setDeleteModal(null)} />
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "#475569" }}>
              Are you sure you want to delete <strong>"{deleteModal?.outletName}"</strong>?
            </Typography>
            <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5, display: "block" }}>
              All associated data will be permanently removed.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} disabled={saving}
              sx={{ boxShadow: "none" }} onClick={handleDelete}>
              {saving ? "Deleting…" : "Delete Outlet"}
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
}
