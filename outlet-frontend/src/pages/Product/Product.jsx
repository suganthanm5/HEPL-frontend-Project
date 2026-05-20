import { useEffect, useState, useMemo } from "react";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { addProduct, updateProduct, deleteProduct, bulkCreateProducts } from "../../services/productService";
import { getDivisions } from "../../services/divisionService";
import { orderService } from "../../services/orderService";
import API, { ENDPOINTS } from '../../api/apiClient';
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatProductData } from "../../utils/exportUtils";
import "./Product.css";

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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BarChartIcon from "@mui/icons-material/BarChart";
import BulkUploadModal from "../../components/BulkUploadModal";
import { reportService } from "../../services/reportService";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ReChartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart,
} from "recharts";

/* ── Chart Components ── */
const ChartCard = ({ title, subtitle, action, children }) => (
  <Paper
    elevation={0}
    sx={{
      border: "1px solid #f1f5f9",
      borderRadius: "16px",
      p: { xs: 2, sm: 3 },
      height: "100%",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
        borderColor: "#e2e8f0",
        transform: "translateY(-4px)"
      }
    }}
  >
    <Box sx={{ 
      display: "flex", 
      flexDirection: { xs: "column", sm: "row" }, 
      justifyContent: "space-between", 
      alignItems: { xs: "stretch", sm: "center" }, 
      gap: 2,
      mb: 3 
    }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e293b", lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: "#64748b" }}>{subtitle}</Typography>}
      </Box>
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 1,
        flexWrap: "wrap",
        justifyContent: { xs: "flex-start", sm: "flex-end" }
      }}>
        {action}
        <Box sx={{ px: 1.5, py: 0.5, bgcolor: "#f8fafc", borderRadius: 1.5, border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600 }}>2025-10-14 - 2025-10-17</Typography>
          <Box sx={{ width: 14, height: 14, color: "#94a3b8", display: "flex", alignItems: "center" }}><BarChartIcon sx={{ fontSize: 14 }} /></Box>
        </Box>
      </Box>
    </Box>
    <Box sx={{ flex: 1, minHeight: 240 }}>
      {children}
    </Box>
  </Paper>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: "#fff", p: 1.5, borderRadius: 2, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #f1f5f9" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "#1e293b", display: "block", mb: 0.5 }}>{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: p.color }} />
          <Typography variant="caption" sx={{ color: "#64748b" }}>{p.name}: <span style={{ fontWeight: 700, color: "#1e293b" }}>{p.value}</span></Typography>
        </Box>
      ))}
    </Box>
  );
};

/* ── MUI Theme (matches original CSS palette) ── */
const theme = createTheme({
  palette: {
    primary: { main: "#f59e0b" },
    secondary: { main: "#6366f1" },
    error: { main: "#ef4444" },
    info: { main: "#0ea5e9" },
    success: { main: "#10b981" },
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
const EMPTY_FORM = { name: "", productCode: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "", divisionId: "", image: "" };

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
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const [divisions, setDivisions] = useState([]);
  const [viewModal, setViewModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [isFormView, setIsFormView] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trendPeriod, setTrendPeriod] = useState("Weekly");

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  const validatePrices = () => {
    const mrp = Number(form.mrp) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;
    const purchasePrice = Number(form.purchasePrice) || 0;
    if (sellingPrice > mrp) { showToast("Selling price should be smaller than MRP", "error"); return false; }
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
      const [prodRes, summRes, orderData] = await Promise.all([
        API.get(ENDPOINTS.products, { params: { page: 0, size: 1000 }, signal }),
        reportService.getDashboardSummary(),
        orderService.getAll({ size: 1000 }).catch(err => {
          console.error("orderService error:", err);
          return [];
        })
      ]);
      const pageData = prodRes.data?.data;
      const productList = pageData?.content ?? [];
      setProducts(productList);
      setSummary(summRes);

      let orderList = [];
      if (Array.isArray(orderData)) orderList = orderData;
      else if (Array.isArray(orderData?.content)) orderList = orderData.content;
      else if (Array.isArray(orderData?.data)) orderList = orderData.data;
      else if (Array.isArray(orderData?.data?.content)) orderList = orderData.data.content;
      setOrders(orderList);
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
    name: form.name.trim(),
    productCode: form.productCode.trim(),
    uimPrice: numField(form.uimPrice),
    mrp: numField(form.mrp),
    sellingPrice: numField(form.sellingPrice),
    purchasePrice: numField(form.purchasePrice),
    image: form.image,
    ...(form.divisionId ? { divisionId: Number(form.divisionId), division: { id: Number(form.divisionId) } } : {}),
  });

  const handleAdd = async () => {
    if (!form.name.trim() || !validatePrices()) return;
    setSaving(true);
    try {
      await addProduct({ ...buildPayload(), productCode: generateProductCode() });
      await fetchProducts();
      setIsFormView(false); setForm(EMPTY_FORM);
      showToast("Product added successfully!", "success");
    } catch (e) {
      showToast("Failed to add product: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const openEdit = (p) => {
    setForm({
      name: p.name ?? "",
      productCode: p.productCode ?? "",
      uimPrice: p.uimPrice ?? "",
      mrp: p.mrp ?? "",
      sellingPrice: p.sellingPrice ?? "",
      purchasePrice: p.purchasePrice ?? "",
      divisionId: String(p.divisionId ?? p.division?.id ?? ""),
      image: p.image ?? "",
    });
    setEditModal(p);
    setIsFormView(true);
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !validatePrices()) return;
    setSaving(true);
    try {
      await updateProduct(editModal.id, buildPayload());
      await fetchProducts();
      setEditModal(null); setIsFormView(false); setForm(EMPTY_FORM);
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
        if (priceRangeFilter === "0-100") return mrp <= 100;
        if (priceRangeFilter === "101-500") return mrp >= 101 && mrp <= 500;
        if (priceRangeFilter === "501-1000") return mrp >= 501 && mrp <= 1000;
        if (priceRangeFilter === "1000+") return mrp > 1000;
        return true;
      });
    }
    return result;
  }, [products, search, divMap, divisionFilter, priceRangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, filtered.length);

  const performanceData = useMemo(() => {
    const counts = {};
    filtered.forEach((p) => {
      const name = divNameOf(p);
      if (name && name !== "—") {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [filtered, divisions, divMap]);

  const parseDateStr = (dateVal) => {
    if (!dateVal) return new Date();
    if (Array.isArray(dateVal)) {
      const [y, m, d] = dateVal;
      return new Date(y, m - 1, d);
    }
    return new Date(dateVal);
  };

  const revenueTrend = useMemo(() => {
    const matchesFilter = (item) => {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) return false;
      if (divisionFilter && (p.division?.id ?? p.divisionId) != divisionFilter) return false;
      if (priceRangeFilter) {
        const mrp = Number(p.mrp) || 0;
        if (priceRangeFilter === "0-100" && mrp > 100) return false;
        if (priceRangeFilter === "101-500" && (mrp < 101 || mrp > 500)) return false;
        if (priceRangeFilter === "501-1000" && (mrp < 501 || mrp > 1000)) return false;
        if (priceRangeFilter === "1000+" && mrp <= 1000) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const divName = divNameOf(p);
        const nameMatch = p.name?.toLowerCase().includes(q);
        const codeMatch = p.productCode?.toLowerCase().includes(q);
        const divMatch = divName?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !divMatch) return false;
      }
      return true;
    };

    if (trendPeriod === "Monthly") {
      const weeklyMap = { "Week 1": 0, "Week 2": 0, "Week 3": 0, "Week 4": 0 };
      orders.forEach(order => {
        const oDate = parseDateStr(order.createdAt);
        const diffDays = Math.floor((new Date() - oDate) / (1000 * 60 * 60 * 24));
        let weekKey = "Week 4";
        if (diffDays <= 7) weekKey = "Week 4";
        else if (diffDays <= 14) weekKey = "Week 3";
        else if (diffDays <= 21) weekKey = "Week 2";
        else weekKey = "Week 1";
        
        const matchingRevenue = (order.items || []).reduce((sum, item) => {
          if (matchesFilter(item)) {
            return sum + (item.quantity * Number(item.price || 0));
          }
          return sum;
        }, 0);
        weeklyMap[weekKey] += matchingRevenue;
      });
      return Object.entries(weeklyMap).map(([name, revenue]) => ({
        name,
        revenue
      }));
    }

    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[dateStr] = 0;
    }
    
    orders.forEach(order => {
      const oDate = parseDateStr(order.createdAt);
      const dateStr = oDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const matchingRevenue = (order.items || []).reduce((sum, item) => {
        if (matchesFilter(item)) {
          return sum + (item.quantity * Number(item.price || 0));
        }
        return sum;
      }, 0);
      if (dateStr in dailyMap) {
        dailyMap[dateStr] += matchingRevenue;
      }
    });

    return Object.entries(dailyMap).map(([name, revenue]) => ({
      name,
      revenue
    }));
  }, [orders, products, divisionFilter, priceRangeFilter, search, trendPeriod]);

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

      <Box>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, mb: 1, display: "block" }}>Product Photo</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            variant="rounded"
            src={form.image}
            sx={{ width: 80, height: 80, bgcolor: "#f8fafc", border: "1px dashed #e2e8f0" }}
          >
            <PhotoCameraIcon sx={{ color: "#94a3b8" }} />
          </Avatar>
          <Box>
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<PhotoCameraIcon />}
              sx={{ color: "#64748b", borderColor: "#e2e8f0" }}
            >
              Upload Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 1024 * 1024) {
                      showToast("Image size should be less than 1MB", "error");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => setForm(f => ({ ...f, image: reader.result }));
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </Button>
            {form.image && (
              <Button
                size="small"
                color="error"
                sx={{ ml: 1, textTransform: "none" }}
                onClick={() => setForm(f => ({ ...f, image: "" }))}
              >
                Remove
              </Button>
            )}
            <Typography variant="caption" sx={{ display: "block", color: "#94a3b8", mt: 0.5 }}>
              JPG, PNG or GIF. Max 1MB.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Stack>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>

        {/* ── Hero ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b" }}>
            <TypingText text="Product Management" />
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="outlined" startIcon={<UploadFileIcon />}
              sx={{
                borderColor: "#f59e0b", color: "#f59e0b", fontWeight: 600, textTransform: "none", borderRadius: 2,
                "&:hover": { bgcolor: "#fffbeb", borderColor: "#f59e0b" }
              }}
              onClick={() => setBulkOpen(true)}>
              Bulk Upload
            </Button>
            <ExportMenu getData={() => formatProductData(filtered)} filename="products" title="Products Report" backendType="products" />
            <Button variant="contained" startIcon={<AddIcon />} color="primary"
              sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" }, color: "#fff", boxShadow: "none" }}
              onClick={() => { setForm(EMPTY_FORM); setEditModal(null); setIsFormView(true); }}>
              Add Product
            </Button>
          </Box>
        </Box>

        {isFormView ? (
          /* ── Full Page Form View ── */
          <Box className="animate-fade-in">
            <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
              <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <IconButton onClick={() => { setIsFormView(false); setEditModal(null); setForm(EMPTY_FORM); }} sx={{ color: "#64748b" }}>
                    <CloseIcon />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
                      {editModal ? "Edit Product" : "Add New Product"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {editModal ? `Updating details for ${editModal.name}` : "Fill in the details to create a new product"}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Button variant="outlined" color="inherit" onClick={() => { setIsFormView(false); setEditModal(null); setForm(EMPTY_FORM); }}
                    sx={{ color: "#64748b", borderColor: "#e2e8f0" }}>
                    Cancel
                  </Button>
                  <Button variant="contained" startIcon={editModal ? <EditIcon /> : <AddIcon />}
                    disabled={saving || !form.name.trim()}
                    sx={{ bgcolor: editModal ? "#6366f1" : "#f59e0b", "&:hover": { bgcolor: editModal ? "#4f46e5" : "#d97706" }, color: "#fff", boxShadow: "none" }}
                    onClick={editModal ? handleUpdate : handleAdd}>
                    {saving ? "Saving…" : editModal ? "Save Changes" : "Create Product"}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                  {/* Left Column: Image & Basic Info */}
                  <Grid item xs={12} md={5}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>Product Image</Typography>
                        <Box sx={{
                          width: "100%",
                          aspectRatio: "1/1",
                          borderRadius: 4,
                          bgcolor: "#f8fafc",
                          border: "2px dashed #e2e8f0",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          position: "relative",
                          transition: "all 0.3s",
                          "&:hover": { borderColor: "#f59e0b", bgcolor: "#fffbeb" }
                        }}>
                          {form.image ? (
                            <>
                              <img src={form.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <Box sx={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 1 }}>
                                <IconButton size="small" component="label" sx={{ bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" } }}>
                                  <EditIcon fontSize="small" />
                                  <input type="file" hidden accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      if (file.size > 1024 * 1024) { showToast("Max size 1MB", "error"); return; }
                                      const reader = new FileReader();
                                      reader.onloadend = () => setForm(f => ({ ...f, image: reader.result }));
                                      reader.readAsDataURL(file);
                                    }
                                  }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => setForm(f => ({ ...f, image: "" }))} sx={{ bgcolor: "rgba(255,255,255,0.9)", color: "#ef4444", "&:hover": { bgcolor: "#fee2e2" } }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </>
                          ) : (
                            <Box sx={{ textAlign: "center", p: 3 }}>
                              <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <PhotoCameraIcon sx={{ fontSize: 32, color: "#94a3b8" }} />
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569" }}>Click to upload product image</Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8" }}>PNG, JPG or GIF up to 1MB</Typography>
                              <Button variant="contained" component="label" size="small" sx={{ mt: 2, bgcolor: "#f59e0b", color: "#fff", "&:hover": { bgcolor: "#d97706" } }}>
                                Browse Files
                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 1024 * 1024) { showToast("Max size 1MB", "error"); return; }
                                    const reader = new FileReader();
                                    reader.onloadend = () => setForm(f => ({ ...f, image: reader.result }));
                                    reader.readAsDataURL(file);
                                  }
                                }} />
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Right Column: Form Fields */}
                  <Grid item xs={12} md={7}>
                    <Stack spacing={4}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 4, height: 16, bgcolor: "#f59e0b", borderRadius: 1 }} />
                          Basic Information
                        </Typography>
                        <Grid container spacing={2.5}>
                          <Grid item xs={12} sm={editModal ? 6 : 12}>
                            <TextField fullWidth label="Product Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Milk 1L" variant="outlined" />
                          </Grid>
                          {editModal && (
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Product Code" value={form.productCode} disabled variant="outlined" sx={{ bgcolor: "#f8fafc" }} />
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, mb: 1, display: "block" }}>Division</Typography>
                            <SearchableSelect options={divisions} value={form.divisionId} onChange={(id) => setForm(f => ({ ...f, divisionId: id }))} placeholder="Select Division" />
                          </Grid>
                        </Grid>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 4, height: 16, bgcolor: "#10b981", borderRadius: 1 }} />
                          Pricing & Inventory
                        </Typography>
                        <Grid container spacing={2.5}>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth type="number" label="MRP" name="mrp" value={form.mrp} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth type="number" label="Selling Price" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth type="number" label="Purchase Price" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth type="number" label="UIM Price" name="uimPrice" value={form.uimPrice} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                          </Grid>
                        </Grid>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Box>
        ) : (
          /* ── List View ── */
          <>
            {/* ── 1. Insights Row (Graphs) ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Products by Division" subtitle="Division-wise distribution">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: "#94a3b8" }} 
                        height={40}
                        angle={-12}
                        textAnchor="end"
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                      <ReChartsTooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="count" name="Product Count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartCard
                  title="Order Summary"
                  subtitle="Revenue by day"
                  action={
                    <Select
                      size="small"
                      value={trendPeriod}
                      onChange={(e) => setTrendPeriod(e.target.value)}
                      sx={{ height: 28, fontSize: "0.7rem", bgcolor: "#fff" }}
                    >
                      <MenuItem value="Weekly">Weekly</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                    </Select>
                  }
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="prodRevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `${v / 1000}k`} />
                      <ReChartsTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#prodRevGrad)" dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
            </Grid>

            {/* ── 2. Stats Row (Top Cards) ── */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
              <StatCard label="Total Products" value={loading ? "—" : products.length} color="#b45309" bg="#fffbeb" icon={<Inventory2Icon />} gradient="linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)" border="#fef3c7" />
              <StatCard label="Filtered Results" value={loading ? "—" : filtered.length} color="#4f46e5" bg="#f5f7ff" icon={<SearchIcon />} gradient="linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)" border="#e0e7ff" />
              <StatCard label="Total Pages" value={loading ? "—" : totalPages} color="#15803d" bg="#ecfdf5" icon={<GridViewIcon />} gradient="linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" border="#dcfce7" />
            </Stack>

            {/* ── 3. Table View ── */}
            {error && (
              <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            )}

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

            {/* ── Table / Card View ── */}
            {view === "table" && (
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["#", "Image", "Name", "Division", "Code", "UIM Price", "MRP", "Selling Price", "Purchase Price", "Actions"].map((h) => (
                        <TableCell key={h}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          {Array(10).fill(0).map((_, j) => (
                            <TableCell key={j}><Skeleton variant="text" width={j === 2 ? 140 : 70} /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                            <Inventory2Icon sx={{ fontSize: 48, color: "#cbd5e1" }} />
                            <Typography color="text.secondary">{search ? "No products match your search" : "No products yet"}</Typography>
                            {!search && (
                              <Button variant="contained" size="small" startIcon={<AddIcon />}
                                sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" }, color: "#fff", boxShadow: "none" }}
                                onClick={() => { setForm(EMPTY_FORM); setEditModal(null); setIsFormView(true); }}>
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
                            <Avatar
                              variant="rounded"
                              src={p.image}
                              sx={{ width: 40, height: 40, bgcolor: "#f8fafc", border: "1px solid #f1f5f9" }}
                            >
                              {p.name?.charAt(0).toUpperCase()}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                      <Inventory2Icon sx={{ fontSize: 56, color: "#cbd5e1", mb: 1 }} />
                      <Typography color="text.secondary">{search ? "No products match your search" : "No products yet"}</Typography>
                    </Box>
                  </Grid>
                ) : (
                  paginated.map((p, i) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
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
                            src={p.image}
                            sx={{ width: "100%", height: 180, bgcolor: "#f8fafc", borderRadius: 3, fontSize: "3rem", border: "1px solid #f1f5f9" }}
                          >
                            {p.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(255,255,255,0.9)", px: 1, py: 0.5, borderRadius: 1.5, color: "#94a3b8", fontWeight: 600, backdropFilter: "blur(4px)" }}>#{(safePage - 1) * pageSize + i + 1}</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b", mb: 0.75 }}>{p.name}</Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
                          <Chip label={divNameOf(p)} size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: "0.7rem" }} />
                          {p.productCode && <Chip label={p.productCode} size="small" sx={{ bgcolor: "#f8fafc", color: "#475569", fontFamily: "monospace", fontSize: "0.7rem" }} />}
                        </Stack>
                        <Divider sx={{ mb: 1.5 }} />
                        <Stack spacing={0.5} sx={{ mb: 2 }}>
                          {[["MRP", fmt(p.mrp), "#475569"], ["Selling", fmt(p.sellingPrice), "#10b981"], ["Purchase", fmt(p.purchasePrice), "#475569"]].map(([label, val, color]) => (
                            <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500 }}>{label}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 700, color }}>₹{val}</Typography>
                            </Box>
                          ))}
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                          <IconButton size="small" onClick={() => setViewModal(p)}
                            sx={{ flex: 1, color: "#0ea5e9", bgcolor: "#e0f2fe", borderRadius: 2, "&:hover": { bgcolor: "#bae6fd" } }}><VisibilityIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => openEdit(p)}
                            sx={{ flex: 1, color: "#6366f1", bgcolor: "#eef2ff", borderRadius: 2, "&:hover": { bgcolor: "#e0e7ff" } }}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => setDeleteModal(p)}
                            sx={{ flex: 1, color: "#ef4444", bgcolor: "#fef2f2", borderRadius: 2, "&:hover": { bgcolor: "#fee2e2" } }}><DeleteIcon fontSize="small" /></IconButton>
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
          </>
        )}

        {/* ── Add Modal (REPLACED BY FULL PAGE BUT KEEPING LOGIC IF NEEDED, REMOVING NOW) ── */}
        {/* Removing lines 695-708 */}

        {/* ── Edit Modal (REPLACED BY FULL PAGE) ── */}
        {/* Removing lines 711-724 */}

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
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Avatar
                variant="rounded"
                src={viewModal?.image}
                sx={{ width: 120, height: 120, bgcolor: "#f8fafc", border: "1px solid #f1f5f9", fontSize: "3rem" }}
              >
                {viewModal?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
            <Stack spacing={1.5}>
              {viewModal && [
                ["Product Name", viewModal.name],
                ["Product Code", viewModal.productCode || "—"],
                ["Division", divNameOf(viewModal)],
                ["UIM Price", `₹${fmt(viewModal.uimPrice)}`],
                ["MRP", `₹${fmt(viewModal.mrp)}`],
                ["Selling Price", `₹${fmt(viewModal.sellingPrice)}`],
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

        {/* ── Bulk Upload Modal ── */}
        <BulkUploadModal
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
          title="Bulk Upload Products"
          accent="#f59e0b"
          templateHeaders={["name", "divisionId", "uimPrice", "mrp", "sellingPrice", "purchasePrice", "image"]}
          templateRows={[
            ["Milk 1L", "1", "40", "50", "48", "38", ""],
            ["Cheese 500g", "1", "80", "100", "95", "75", ""],
          ]}
          parseRow={(row) => {
            const name = (row["name"] || "").trim();
            const divisionId = (row["divisionid"] || row["divisionId"] || "").trim();
            const mrp = Number(row["mrp"] || 0);
            const sellingPrice = Number(row["sellingprice"] || row["sellingPrice"] || 0);
            const purchasePrice = Number(row["purchaseprice"] || row["purchasePrice"] || 0);
            const uimPrice = Number(row["uimprice"] || row["uimPrice"] || 0);
            const image = (row["image"] || "").trim();
            if (!name) return { valid: false, error: "Name is required" };
            if (!divisionId) return { valid: false, error: "divisionId is required" };
            if (mrp <= 0) return { valid: false, error: "MRP must be > 0" };
            if (sellingPrice > mrp) return { valid: false, error: "Selling price must be ≤ MRP" };
            if (purchasePrice > mrp) return { valid: false, error: "Purchase price must be ≤ MRP" };
            return {
              valid: true,
              data: {
                name, uimPrice, mrp, sellingPrice, purchasePrice, image,
                divisionId: Number(divisionId),
                division: { id: Number(divisionId) },
              },
            };
          }}
          onUpload={(rows) => bulkCreateProducts(rows)}
          onDone={() => fetchProducts()}
        />

      </Box>
    </ThemeProvider>
  );
};

export default Product;
