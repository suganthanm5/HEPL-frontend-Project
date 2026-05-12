import { useEffect, useState, useMemo } from "react";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { addProduct, updateProduct, deleteProduct } from "../../services/productService";
import { getDivisions } from "../../services/divisionService";
import API, { ENDPOINTS } from '../../api/apiClient';

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
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Material UI Icons
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";
import VisibilityIcon from "@mui/icons-material/Visibility";

/* ── MUI Theme (matches original CSS palette) ── */
const theme = createTheme({
  palette: {
    primary:   { main: "#f59e0b" },
    secondary: { main: "#6366f1" },
    error:     { main: "#ef4444" },
    info:      { main: "#0ea5e9" },
    success:   { main: "#10b981" },
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
        head: { fontWeight: 700, background: "#fafafa", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: "0.75rem" } },
    },
  },
});

const PAGE_SIZES = [5, 10, 25, 50];
const EMPTY_FORM = { name: "", productCode: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "", divisionId: "" };

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

/* ── Modal Header Icon ── */
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

const Product = () => {
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [pageSize,      setPageSize]      = useState(10);
  const [page,          setPage]          = useState(1);
  const [view,          setView]          = useState("table");
  const [addModal,      setAddModal]      = useState(false);
  const [editModal,     setEditModal]     = useState(null);
  const [deleteModal,   setDeleteModal]   = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [divisions,     setDivisions]     = useState([]);
  const [viewModal,     setViewModal]     = useState(null);
  const [toast,         setToast]         = useState(null);
  const [divisionFilter,   setDivisionFilter]   = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  const validatePrices = () => {
    const mrp          = Number(form.mrp)          || 0;
    const sellingPrice = Number(form.sellingPrice)  || 0;
    const purchasePrice= Number(form.purchasePrice) || 0;
    if (sellingPrice  > mrp) { showToast("Selling price should be smaller than MRP",  "error"); return false; }
    if (purchasePrice > mrp) { showToast("Purchase price should be smaller than MRP", "error"); return false; }
    return true;
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    fetchDivisions(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchDivisions = async (signal) => {
    try {
      const res = await getDivisions(0, 200, "", signal);
      const divList = res?.content ?? [];
      setDivisions(divList);
    } catch (e) {
      console.error("fetchDivisions error:", e);
    }
  };

  const fetchProducts = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(ENDPOINTS.products, { params: { page: 0, size: 1000 }, signal });
      const pageData = res.data?.data;
      const productList = pageData?.content ?? [];
      console.log("Products fetched:", productList);
      setProducts(productList);
    } catch (e) {
      console.error("fetchProducts error:", e);
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load products. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  const generateProductCode = () => {
    const existing = products.map((p) => p.productCode).filter(Boolean);
    let counter = 1, code;
    do { code = `MKL${String(counter++).padStart(3, "0")}`; } while (existing.includes(code));
    return code;
  };

  const divMap = useMemo(() => Object.fromEntries(divisions.map((d) => [d.id, d.name])), [divisions]);
  const divNameOf = (p) => p.divisionName ?? p.division?.name ?? divMap[p.divisionId] ?? "—";
  const fmt = (v) => (v == null || v === "" ? "—" : Number(v).toLocaleString());
  const numField = (v) => (v === "" ? 0 : Number(v));

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const buildPayload = () => ({
    name:          form.name.trim(),
    productCode:   form.productCode.trim(),
    uimPrice:      numField(form.uimPrice),
    mrp:           numField(form.mrp),
    sellingPrice:  numField(form.sellingPrice),
    purchasePrice: numField(form.purchasePrice),
    ...(form.divisionId ? { divisionId: Number(form.divisionId), division: { id: Number(form.divisionId) } } : {}),
  });

  const handleAdd = async () => {
    if (!form.name.trim() || !validatePrices()) return;
    setSaving(true);
    try {
      await addProduct({ ...buildPayload(), productCode: generateProductCode() });
      await fetchProducts();
      setAddModal(false); setForm(EMPTY_FORM);
      showToast("Product added successfully!", "success");
    } catch (e) {
      showToast("Failed to add product: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const openEdit = (p) => {
    setForm({
      name:          p.name          ?? "",
      productCode:   p.productCode   ?? "",
      uimPrice:      p.uimPrice      ?? "",
      mrp:           p.mrp           ?? "",
      sellingPrice:  p.sellingPrice  ?? "",
      purchasePrice: p.purchasePrice ?? "",
      divisionId:    String(p.divisionId ?? p.division?.id ?? ""),
    });
    setEditModal(p);
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !validatePrices()) return;
    setSaving(true);
    try {
      await updateProduct(editModal.id, buildPayload());
      await fetchProducts();
      setEditModal(null); setForm(EMPTY_FORM);
      showToast("Product updated successfully!", "success");
    } catch (e) {
      showToast("Failed to update product: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteProduct(deleteModal.id);
      await fetchProducts();
      setDeleteModal(null);
      showToast("Product deleted successfully!", "success");
    } catch (e) {
      showToast("Failed to delete product: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    let result = products.filter((p) =>
      [p.name, p.productCode, divNameOf(p)].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    );
    if (divisionFilter) result = result.filter((p) => (p.division?.id ?? p.divisionId) == divisionFilter);
    if (priceRangeFilter) {
      result = result.filter((p) => {
        const mrp = Number(p.mrp) || 0;
        if (priceRangeFilter === "0-100")    return mrp <= 100;
        if (priceRangeFilter === "101-500")  return mrp >= 101 && mrp <= 500;
        if (priceRangeFilter === "501-1000") return mrp >= 501 && mrp <= 1000;
        if (priceRangeFilter === "1000+")    return mrp > 1000;
        return true;
      });
    }
    return result;
  }, [products, search, divMap, divisionFilter, priceRangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start      = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end        = Math.min(safePage * pageSize, filtered.length);

  /* ── Form Fields (shared between Add & Edit modals) ── */
  const renderFormFields = (isEdit = false) => (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={isEdit ? 6 : 12}>
          <TextField
            autoFocus fullWidth size="small" label="Product Name" required
            name="name" value={form.name} onChange={handleChange} placeholder="e.g. Milk 1L"
          />
        </Grid>
        {isEdit && (
          <Grid item xs={6}>
            <TextField
              fullWidth size="small" label="Product Code"
              name="productCode" value={form.productCode}
              InputProps={{ readOnly: true }}
              sx={{ "& .MuiInputBase-input": { bgcolor: "#f5f5f5", cursor: "not-allowed" } }}
            />
          </Grid>
        )}
      </Grid>

      {/* Division SearchableSelect — kept as-is to preserve custom component */}
      <Box>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 0.5, display: "block" }}>Division</Typography>
        <SearchableSelect
          options={divisions}
          value={form.divisionId}
          onChange={(id) => setForm((f) => ({ ...f, divisionId: id }))}
          placeholder="— Select division —"
          searchPlaceholder="Search divisions..."
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="UIM Price" type="number" inputProps={{ min: 0 }}
            name="uimPrice" value={form.uimPrice} onChange={handleChange} placeholder="0" />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="MRP" type="number" inputProps={{ min: 0 }}
            name="mrp" value={form.mrp} onChange={handleChange} placeholder="0" />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Selling Price" type="number" inputProps={{ min: 0 }}
            name="sellingPrice" value={form.sellingPrice} onChange={handleChange} placeholder="0" />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth size="small" label="Purchase Price" type="number" inputProps={{ min: 0 }}
            name="purchasePrice" value={form.purchasePrice} onChange={handleChange} placeholder="0" />
        </Grid>
      </Grid>
    </Stack>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

        {/* ── Hero ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b" }}>Product Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} color="primary"
            sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" }, color: "#fff", boxShadow: "none" }}
            onClick={() => { setForm(EMPTY_FORM); setAddModal(true); }}>
            Add Product
          </Button>
        </Box>

        {/* ── Stats ── */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          <StatCard label="Total Products"   value={loading ? "—" : products.length} color="#f59e0b" bg="#fffbeb" icon={<Inventory2Icon />} />
          <StatCard label="Filtered Results" value={loading ? "—" : filtered.length} color="#6366f1" bg="#eef2ff" icon={<SearchIcon />} />
          <StatCard label="Total Pages"      value={loading ? "—" : totalPages}      color="#10b981" bg="#ecfdf5" icon={<GridViewIcon />} />
        </Stack>

        {/* ── Error ── */}
        {error && (
          <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        {/* ── Toolbar ── */}
        <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>

            {/* Search */}
            <TextField
              size="small" placeholder="Search products…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ minWidth: 240, flex: 1 }}
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
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>All Divisions</InputLabel>
                <Select label="All Divisions" value={divisionFilter}
                  onChange={(e) => { setDivisionFilter(e.target.value); setPage(1); }}>
                  <MenuItem value="">All Divisions</MenuItem>
                  {divisions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>All Prices</InputLabel>
                <Select label="All Prices" value={priceRangeFilter}
                  onChange={(e) => { setPriceRangeFilter(e.target.value); setPage(1); }}>
                  <MenuItem value="">All Prices</MenuItem>
                  <MenuItem value="0-100">₹0 – ₹100</MenuItem>
                  <MenuItem value="101-500">₹101 – ₹500</MenuItem>
                  <MenuItem value="501-1000">₹501 – ₹1,000</MenuItem>
                  <MenuItem value="1000+">₹1,000+</MenuItem>
                </Select>
              </FormControl>

              {(divisionFilter || priceRangeFilter || search) && (
                <Button size="small" variant="outlined" color="inherit"
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", height: 40 }}
                  onClick={() => { setDivisionFilter(""); setPriceRangeFilter(""); setSearch(""); setPage(1); }}>
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
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["#", "Name", "Division", "Code", "UIM Price", "MRP", "Selling Price", "Purchase Price", "Actions"].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1,2,3,4,5].map((i) => (
                    <TableRow key={i}>
                      {Array(9).fill(0).map((_, j) => (
                        <TableCell key={j}><Skeleton variant="text" width={j === 1 ? 140 : 70} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <Inventory2Icon sx={{ fontSize: 48, color: "#cbd5e1" }} />
                        <Typography color="text.secondary">{search ? "No products match your search" : "No products yet"}</Typography>
                        {!search && (
                          <Button variant="contained" size="small" startIcon={<AddIcon />}
                            sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" }, color: "#fff", boxShadow: "none" }}
                            onClick={() => { setForm(EMPTY_FORM); setAddModal(true); }}>
                            Add First Product
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((p, i) => (
                    <TableRow key={p.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>{(safePage - 1) * pageSize + i + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", fontWeight: 700, bgcolor: "#fef3c7", color: "#f59e0b" }}>
                            {p.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>{p.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={divNameOf(p)} size="small"
                          sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: "0.72rem" }} />
                      </TableCell>
                      <TableCell>
                        {p.productCode
                          ? <Chip label={p.productCode} size="small" sx={{ bgcolor: "#f8fafc", color: "#475569", fontFamily: "monospace", fontSize: "0.72rem" }} />
                          : "—"}
                      </TableCell>
                      {[p.uimPrice, p.mrp].map((v, idx) => (
                        <TableCell key={idx} sx={{ fontWeight: 500, color: "#475569" }}>{fmt(v)}</TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 700, color: "#10b981" }}>{fmt(p.sellingPrice)}</TableCell>
                      <TableCell sx={{ fontWeight: 500, color: "#475569" }}>{fmt(p.purchasePrice)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => setViewModal(p)}
                              sx={{ color: "#0ea5e9", bgcolor: "#e0f2fe", borderRadius: 1.5, "&:hover": { bgcolor: "#bae6fd" } }}>
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(p)}
                              sx={{ color: "#6366f1", bgcolor: "#eef2ff", borderRadius: 1.5, "&:hover": { bgcolor: "#e0e7ff" } }}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteModal(p)}
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
        )}

        {/* ── Card View ── */}
        {view === "card" && (
          <Grid container spacing={2}>
            {loading ? (
              [1,2,3,4,5,6].map((i) => (
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
                  <Inventory2Icon sx={{ fontSize: 56, color: "#cbd5e1", mb: 1 }} />
                  <Typography color="text.secondary">{search ? "No products match your search" : "No products yet"}</Typography>
                </Box>
              </Grid>
            ) : (
              paginated.map((p, i) => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3, p: 2.5, height: "100%", display: "flex", flexDirection: "column", transition: "box-shadow .2s", "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,.08)" } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Avatar sx={{ width: 44, height: 44, fontSize: "1rem", fontWeight: 700, bgcolor: "#fef3c7", color: "#f59e0b" }}>
                        {p.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>#{(safePage - 1) * pageSize + i + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", mb: 0.75 }}>{p.name}</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
                      <Chip label={divNameOf(p)} size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a" }} />
                      {p.productCode && <Chip label={p.productCode} size="small" sx={{ bgcolor: "#f8fafc", color: "#475569", fontFamily: "monospace" }} />}
                    </Stack>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                      {[["MRP", fmt(p.mrp), "#475569"], ["Selling", fmt(p.sellingPrice), "#10b981"], ["Purchase", fmt(p.purchasePrice), "#475569"]].map(([label, val, color]) => (
                        <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: "#94a3b8" }}>{label}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color }}>{val}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                      <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setViewModal(p)}
                        sx={{ flex: 1, color: "#0ea5e9", bgcolor: "#e0f2fe", "&:hover": { bgcolor: "#bae6fd" }, fontWeight: 600 }}>View</Button>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(p)}
                        sx={{ flex: 1, color: "#6366f1", bgcolor: "#eef2ff", "&:hover": { bgcolor: "#e0e7ff" }, fontWeight: 600 }}>Edit</Button>
                      <Button size="small" startIcon={<DeleteIcon />} onClick={() => setDeleteModal(p)}
                        sx={{ flex: 1, color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" }, fontWeight: 600 }}>Delete</Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))
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
                "& .Mui-selected": { bgcolor: "#f59e0b !important", color: "#fff" },
              }}
            />
          </Box>
        )}

        {/* ── Add Modal ── */}
        <Dialog open={addModal} onClose={() => { setAddModal(false); setForm(EMPTY_FORM); }} maxWidth="sm" fullWidth>
          <ModalIconHeader icon={<AddIcon />} title="Add Product" subtitle="Create a new product" accent="#f59e0b"
            onClose={() => { setAddModal(false); setForm(EMPTY_FORM); }} />
          <DialogContent sx={{ pt: 2 }}>{renderFormFields(false)}</DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => { setAddModal(false); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button variant="contained" startIcon={<AddIcon />} disabled={saving || !form.name.trim()}
              sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" }, color: "#fff", boxShadow: "none" }}
              onClick={handleAdd}>
              {saving ? "Adding…" : "Add Product"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Edit Modal ── */}
        <Dialog open={!!editModal} onClose={() => { setEditModal(null); setForm(EMPTY_FORM); }} maxWidth="sm" fullWidth>
          <ModalIconHeader icon={<EditIcon />} title="Edit Product" subtitle={editModal ? `Editing: ${editModal.name}` : ""} accent="#6366f1"
            onClose={() => { setEditModal(null); setForm(EMPTY_FORM); }} />
          <DialogContent sx={{ pt: 2 }}>{renderFormFields(true)}</DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => { setEditModal(null); setForm(EMPTY_FORM); }}>Cancel</Button>
            <Button variant="contained" startIcon={<EditIcon />} disabled={saving || !form.name.trim()}
              sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, color: "#fff", boxShadow: "none" }}
              onClick={handleUpdate}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Modal ── */}
        <Dialog open={!!deleteModal} onClose={() => setDeleteModal(null)} maxWidth="xs" fullWidth>
          <ModalIconHeader icon={<WarningAmberIcon />} title="Delete Product" subtitle="This action cannot be undone" accent="#ef4444"
            onClose={() => setDeleteModal(null)} />
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: "#475569" }}>
              Are you sure you want to delete <strong>"{deleteModal?.name}"</strong>?
            </Typography>
            <Typography variant="caption" sx={{ color: "#ef4444", mt: 0.5, display: "block" }}>
              This product will be permanently removed.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={<DeleteIcon />} disabled={saving}
              sx={{ boxShadow: "none" }} onClick={handleDelete}>
              {saving ? "Deleting…" : "Delete Product"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── View Modal ── */}
        <Dialog open={!!viewModal} onClose={() => setViewModal(null)} maxWidth="xs" fullWidth>
          <ModalIconHeader icon={<VisibilityIcon />} title="Product Details" subtitle={viewModal ? `Viewing: ${viewModal.name}` : ""} accent="#0ea5e9"
            onClose={() => setViewModal(null)} />
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={1.5}>
              {viewModal && [
                ["Product Name",   viewModal.name],
                ["Product Code",   viewModal.productCode || "—"],
                ["Division",       divNameOf(viewModal)],
                ["UIM Price",      `₹${fmt(viewModal.uimPrice)}`],
                ["MRP",            `₹${fmt(viewModal.mrp)}`],
                ["Selling Price",  `₹${fmt(viewModal.sellingPrice)}`],
                ["Purchase Price", `₹${fmt(viewModal.purchasePrice)}`],
              ].map(([label, val]) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>{val}</Typography>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button variant="outlined" color="inherit" sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
              onClick={() => setViewModal(null)}>Close</Button>
            <Button variant="contained" startIcon={<EditIcon />}
              sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" }, color: "#fff", boxShadow: "none" }}
              onClick={() => { setViewModal(null); openEdit(viewModal); }}>
              Edit Product
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Toast ── */}
        <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={toast?.type === "success" ? "success" : toast?.type === "warning" ? "warning" : "error"}
            onClose={() => setToast(null)} sx={{ borderRadius: 2, fontWeight: 500 }}>
            {toast?.message}
          </Alert>
        </Snackbar>

      </Box>
    </ThemeProvider>
  );
};

export default Product;
