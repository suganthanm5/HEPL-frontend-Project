import { useEffect, useState, useMemo } from "react";
import {
  getDivisions, createDivision, updateDivision, deleteDivision, bulkCreateDivisions,
} from "../../services/divisionService";
import {
  getProductsByDivision, createProduct, deleteProduct,
} from "../../services/productService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatDivisionData } from "../../utils/exportUtils";

import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Box,
  Typography,
  Grid,
  Stack,
  Card,
  CardContent,
  Avatar,
  Button,
  Select,
  MenuItem,
  Chip,
  TextField,
  CircularProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import "./Division.css";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import FolderIcon from "@mui/icons-material/Folder";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BulkUploadModal from "../../components/BulkUploadModal";

/* ── MUI Styled Table (same black header as original) ── */
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

/* ── MUI Modal Implementation ── */
const Modal = ({ title, subtitle, icon, onClose, children, accent = "#6366f1" }) => (
  <Dialog 
    open={true} 
    onClose={onClose} 
    fullWidth 
    maxWidth="sm"
    PaperProps={{ 
      sx: { 
        borderRadius: 3, 
        overflow: "hidden" 
      } 
    }}
  >
    <DialogTitle 
      sx={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 2, 
        borderBottom: `4px solid ${accent}`,
        pb: 1.5,
        pt: 2
      }}
    >
      <Box 
        sx={{ 
          bgcolor: `${accent}22`, 
          color: accent, 
          p: 1.25, 
          borderRadius: 2.5, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: -0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <IconButton onClick={onClose} size="small" sx={{ color: "#94a3b8" }}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ mt: 2, pb: 2 }}>
      {children}
    </DialogContent>
  </Dialog>
);

const PAGE_SIZES = [5, 10, 25, 50];

const Division = () => {
  const [divisions, setDivisions]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState("");
  const [searchTerm, setSearchTerm]       = useState("");
  const [pageSize, setPageSize]           = useState(10);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isFormView, setIsFormView]       = useState(false);
  const [editModal, setEditModal]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal]     = useState(null);

  const [addName, setAddName]   = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [productCountFilter, setProductCountFilter] = useState("");
  const [dateFilter, setDateFilter]                 = useState("");
  const [view, setView]                             = useState("table");

  const [productModal, setProductModal] = useState(null);
  const [products, setProducts]         = useState([]);
  const [prodLoading, setProdLoading]   = useState(false);
  const [prodSaving, setProdSaving]     = useState(false);
  const EMPTY_PROD = { name: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "" };
  const [newProd, setNewProd] = useState(EMPTY_PROD);

  // Toast — unchanged
  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Input validation — unchanged
  const validateDivisionName = (name) => /^[a-zA-Z\s]*$/.test(name);

  const handleInputChange = (value, setter) => {
    if (/[^a-zA-Z\s,]/.test(value)) {
      showToast("Please enter a valid format. Only letters, spaces, and commas are allowed.", "warning");
      return;
    }
    if (value.startsWith(" ") || value.startsWith(",")) {
      showToast("Division name cannot start with a space or comma.", "warning");
      return;
    }
    setter(value);
  };

  const filteredDivisions = useMemo(() => {
    let result = divisions;
    if (searchTerm)
      result = result.filter(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (productCountFilter) {
      result = result.filter(d => {
        const count = d.products?.length || 0;
        if (productCountFilter === "0")    return count === 0;
        if (productCountFilter === "1-5")  return count >= 1 && count <= 5;
        if (productCountFilter === "6-10") return count >= 6 && count <= 10;
        if (productCountFilter === "10+")  return count > 10;
        return true;
      });
    }
    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();
      if (dateFilter === "7")  filterDate.setDate(now.getDate() - 7);
      if (dateFilter === "30") filterDate.setDate(now.getDate() - 30);
      if (dateFilter === "90") filterDate.setDate(now.getDate() - 90);
      result = result.filter(d => {
        const createdDate = new Date(d.createdAt || d.created_at || d.dateCreated || now);
        return createdDate >= filterDate;
      });
    }
    return result;
  }, [divisions, searchTerm, productCountFilter, dateFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDivisions(controller.signal);
    return () => controller.abort();
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearchTerm(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDivisions = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const res = await getDivisions(page - 1, pageSize, searchTerm, signal);
      console.log('[DEBUG] getDivisions response:', res);
      
      let list = [];
      let tPages = 1;
      let tElements = 0;

      // Handle different response formats
      if (Array.isArray(res)) {
        list = res;
        tElements = list.length;
      } else if (res && typeof res === 'object') {
        // If it's a Page object with content
        if (Array.isArray(res.content)) {
          list = res.content;
          tPages = res.totalPages || 1;
          tElements = res.totalElements || list.length;
        }
        // If it's wrapped in data property
        else if (res.data && Array.isArray(res.data.content)) {
          list = res.data.content;
          tPages = res.data.totalPages || 1;
          tElements = res.data.totalElements || list.length;
        }
      }
      
      console.log('[DEBUG] Extracted divisions:', list, 'Total pages:', tPages, 'Total elements:', tElements);
      setDivisions(list);
      setTotalPages(tPages);
      setTotalElements(tElements);
    } catch (e) {
      console.error('[DEBUG] fetchDivisions error:', e);
      if (e?.name === "CanceledError" || e?.name === "AbortError") return;
      setError("Failed to load divisions. Check API connection.");
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!addName.trim()) return;
    const divisionNames = addName.split(",").map(n => n.trim()).filter(n => n.length > 0);
    if (divisionNames.length === 0) { showToast("Please enter at least one valid division name.", "warning"); return; }

    const duplicates = [], validDivisions = [];
    divisionNames.forEach(name => {
      divisions.some(d => d.name?.toLowerCase() === name.toLowerCase())
        ? duplicates.push(name) : validDivisions.push(name);
    });

    const uniqueValidDivisions = [], inputDuplicates = [];
    validDivisions.forEach(name => {
      uniqueValidDivisions.some(e => e.toLowerCase() === name.toLowerCase())
        ? inputDuplicates.push(name) : uniqueValidDivisions.push(name);
    });

    if (duplicates.length > 0)     showToast(`These divisions already exist: ${duplicates.join(", ")}`, "warning");
    if (inputDuplicates.length > 0) showToast(`Duplicate entries in input: ${inputDuplicates.join(", ")}`, "warning");
    if (uniqueValidDivisions.length === 0) return;

    setSaving(true);
    let successCount = 0;
    const failedDivisions = [];
    try {
      for (const divisionName of uniqueValidDivisions) {
        try { await createDivision({ name: divisionName }); successCount++; }
        catch { failedDivisions.push(divisionName); }
      }
      if (successCount > 0) {
        showToast(
          successCount === 1
            ? `Division "${uniqueValidDivisions[0]}" added successfully!`
            : `${successCount} divisions added successfully!`,
          "success"
        );
      }
      if (failedDivisions.length > 0) showToast(`Failed to add: ${failedDivisions.join(", ")}`, "error");
      setAddName(""); setIsFormView(false);
      if (page === 1) fetchDivisions(); else setPage(1);
    } catch (e) {
      showToast("Failed to add divisions: " + (e.response?.data?.message || e.message), "error");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateDivision(editModal.id, { name: editName.trim() });
      setEditModal(null); setIsFormView(false); fetchDivisions();
    } catch (e) {
      alert("Failed to update: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteDivision(deleteModal.id);
      setDeleteModal(null);
      if (divisions.length === 1 && page > 1) setPage(p => p - 1); else fetchDivisions();
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const openProducts = async (d) => {
    setProductModal(d); setNewProd(EMPTY_PROD); setProdLoading(true);
    try {
      const res = await getProductsByDivision(d.id);
      const data = res?.data;
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.data)    ? data.data
        : Array.isArray(data?.content) ? data.content
        : [];
      setProducts(list);
      setDivisions(prev => prev.map(div => div.id === d.id ? { ...div, products: list } : div));
    } catch { setProducts([]); }
    finally { setProdLoading(false); }
  };

  const numField = v => v === "" ? 0 : Number(v);

  const generateProductCode = () => {
    const existingCodes = products.map(p => p.productCode).filter(Boolean);
    let counter = 1, newCode;
    do { newCode = `MKL${counter.toString().padStart(3, "0")}`; counter++; }
    while (existingCodes.includes(newCode));
    return newCode;
  };

  const handleAddProduct = async () => {
    if (!newProd.name.trim()) return;
    setProdSaving(true);
    try {
      const payload = {
        name:          newProd.name.trim(),
        productCode:   generateProductCode(),
        uimPrice:      numField(newProd.uimPrice),
        mrp:           numField(newProd.mrp),
        sellingPrice:  numField(newProd.sellingPrice),
        purchasePrice: numField(newProd.purchasePrice),
      };
      const res = await createProduct(productModal.id, payload);
      const p = res?.data?.data ?? res?.data;
      const updated = [...products, p];
      setProducts(updated);
      setDivisions(prev => prev.map(d => d.id === productModal.id ? { ...d, products: updated } : d));
      setNewProd(EMPTY_PROD);
    } catch (e) {
      alert("Failed to add product: " + (e.response?.data?.message || e.message));
    } finally { setProdSaving(false); }
  };

  const handleDeleteProduct = async (pid) => {
    try {
      await deleteProduct(pid);
      const updated = products.filter(p => p.id !== pid);
      setProducts(updated);
      setDivisions(prev => prev.map(d => d.id === productModal.id ? { ...d, products: updated } : d));
    } catch (e) {
      alert("Failed to delete product: " + (e.response?.data?.message || e.message));
    }
  };

  const openEdit = d => { setEditModal(d); setEditName(d.name); setIsFormView(true); };

  const safePage = Math.min(page, totalPages || 1);
  const start    = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end      = Math.min(safePage * pageSize, totalElements);

  return (
    <>
      {/* ── Hero ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}>
            <TypingText text="Division Management" />
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage and organize your business division units
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setBulkOpen(true)}
            startIcon={<UploadFileIcon />}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              borderColor: "#6366f1",
              color: "#6366f1",
              "&:hover": { bgcolor: "#f5f3ff", borderColor: "#6366f1" },
              px: 2.5,
              py: 1.25,
              fontWeight: 600
            }}
          >
            Bulk Upload
          </Button>
          <ExportMenu getData={() => formatDivisionData(filteredDivisions)} filename="divisions" title="Divisions Report" backendType="divisions" />
          <Button
            variant="contained"
            onClick={() => { setAddName(""); setIsFormView(true); setEditModal(null); }}
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              bgcolor: "#6366f1",
              "&:hover": { bgcolor: "#4f46e5" },
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
              px: 3,
              py: 1.25,
              fontWeight: 600
            }}
          >
            Add Division
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
                    {editModal ? "Edit Division" : "Add New Division"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {editModal ? `Updating details for ${editModal.name}` : "Fill in the details to create a new division"}
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
                  sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" }, color: "#fff", boxShadow: "none" }}
                  onClick={editModal ? handleUpdate : handleAdd}>
                  {saving ? "Saving…" : editModal ? "Save Changes" : "Create Division"}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 4, height: 16, bgcolor: "#6366f1", borderRadius: 1 }} />
                      Division Details
                    </Typography>
                    <TextField 
                      fullWidth 
                      label="Division Name" 
                      value={editModal ? editName : addName} 
                      onChange={(e) => handleInputChange(e.target.value, editModal ? setEditName : setAddName)} 
                      required 
                      placeholder={editModal ? "" : "e.g. Dairy, Electronics (comma separated for multiple)"} 
                      helperText={!editModal && "You can add multiple divisions by separating them with commas"}
                      variant="outlined" 
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>Quick Tips</Typography>
                    <ul style={{ paddingLeft: 20, margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                      <li>Division names should be unique.</li>
                      <li>Only letters and spaces are allowed.</li>
                      <li>Use commas to bulk-add multiple divisions at once.</li>
                    </ul>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      ) : (
        <>
          {/* ── Stat Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Divisions", value: loading ? "—" : totalElements, icon: <FolderIcon />, color: "#4f46e5", bg: "#f5f0ff", gradient: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)", border: "#f3e8ff" },
          { label: "Current Page", value: loading ? "—" : safePage, icon: <TrendingUpIcon />, color: "#15803d", bg: "#f0fdf4", gradient: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)", border: "#dcfce7" },
          { label: "Total Pages", value: loading ? "—" : totalPages, icon: <GridViewIcon />, color: "#1d4ed8", bg: "#f0f7ff", gradient: "linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)", border: "#dbeafe" },
        ].map((stat, i) => (
          <Grid xs={12} sm={4} key={i} item>
            <Card sx={{ 
              borderRadius: "16px", 
              p: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
              flex: 1,
              minWidth: 160,  
              boxShadow: "0 2px 12px rgba(125, 42, 232, 0.06)", 
              border: `1.5px solid ${stat.border}`,
              background: stat.gradient,
              transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, border-color 0.22s",
              "&:hover": {
                transform: "translateY(-5px) scale(1.01)",
                boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
                borderColor: stat.color
              }
            }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: "20px !important" }}>
                <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 48, height: 48, borderRadius: 2 }}>
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: "#1e1b4b", lineHeight: 1.2 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} sx={{ color: stat.color }}>
                    {stat.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Error Banner ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Toolbar ── */}
      <Box sx={{ 
        display: "flex", 
        flexWrap: "wrap", 
        alignItems: "center", 
        justifyContent: "space-between", 
        gap: 2, 
        bgcolor: "#fff", 
        p: 2, 
        borderRadius: 3, 
        mb: 2, 
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        {/* Search */}
        <Box sx={{ position: "relative", minWidth: { xs: "100%", md: 300 } }}>
          <Box sx={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
            <SearchIcon />
          </Box>
          <input
            placeholder="Search divisions…"
            value={search}
            style={{ 
              width: "100%", 
              padding: "10px 12px 10px 40px", 
              borderRadius: "10px", 
              border: "1px solid #e2e8f0", 
              fontSize: "0.9rem",
              fontFamily: "inherit"
            }}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <IconButton 
              onClick={() => { setSearch(""); setSearchTerm(""); setPage(1); }}
              size="small"
              sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Select 
            value={productCountFilter} 
            onChange={e => { setProductCountFilter(e.target.value); setPage(1); }}
            displayEmpty
            size="small"
            sx={{ minWidth: 140, borderRadius: 2, fontSize: "0.85rem", bgcolor: "#f8fafc" }}
          >
            <MenuItem value="">All Counts</MenuItem>
            <MenuItem value="0">No Products (0)</MenuItem>
            <MenuItem value="1-5">1-5 Products</MenuItem>
            <MenuItem value="6-10">6-10 Products</MenuItem>
            <MenuItem value="10+">10+ Products</MenuItem>
          </Select>

          <Select 
            value={dateFilter} 
            onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            displayEmpty
            size="small"
            sx={{ minWidth: 140, borderRadius: 2, fontSize: "0.85rem", bgcolor: "#f8fafc" }}
          >
            <MenuItem value="">All Time</MenuItem>
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
          </Select>

          {(productCountFilter || dateFilter || search) && (
            <Button 
              onClick={() => { setProductCountFilter(""); setDateFilter(""); setSearch(""); setSearchTerm(""); setPage(1); }}
              size="small"
              sx={{ textTransform: "none", color: "#6366f1", fontWeight: 600 }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        {/* View Toggle & Page Size */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>Show</Typography>
            <Select 
              value={pageSize} 
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              size="small"
              sx={{ minWidth: 70, borderRadius: 2, fontSize: "0.85rem", height: 32 }}
            >
              {PAGE_SIZES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ display: "flex", bgcolor: "#f1f5f9", p: 0.5, borderRadius: 2 }}>
            <IconButton 
              size="small" 
              onClick={() => setView("table")}
              sx={{ 
                borderRadius: 1.5, 
                bgcolor: view === "table" ? "#fff" : "transparent",
                color: view === "table" ? "#6366f1" : "#64748b",
                boxShadow: view === "table" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                "&:hover": { bgcolor: view === "table" ? "#fff" : "#e2e8f0" }
              }}
            >
              <TableChartIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setView("card")}
              sx={{ 
                borderRadius: 1.5, 
                bgcolor: view === "card" ? "#fff" : "transparent",
                color: view === "card" ? "#6366f1" : "#64748b",
                boxShadow: view === "card" ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                "&:hover": { bgcolor: view === "card" ? "#fff" : "#e2e8f0" }
              }}
            >
              <GridViewIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* ── Table View — MUI Table inside original .table-wrap ── */}
      {view === "table" && (
        <div className="table-wrap">
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
            <Table sx={{ minWidth: 700 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center" sx={{ width: 40 }}>#</StyledTableCell>
                  <StyledTableCell sx={{ minWidth: 200 }}>Division Name</StyledTableCell>
                  <StyledTableCell align="center" sx={{ width: 100 }}>Products</StyledTableCell>
                  <StyledTableCell align="center" sx={{ width: 180 }}>Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <StyledTableRow key={i}>
                      <StyledTableCell align="center"><Skeleton variant="text" width={24} sx={{ mx: "auto" }} /></StyledTableCell>
                      <StyledTableCell><Skeleton variant="text" width="60%" /></StyledTableCell>
                      <StyledTableCell align="center"><Skeleton variant="text" width={40} sx={{ mx: "auto" }} /></StyledTableCell>
                      <StyledTableCell align="center"><Skeleton variant="text" width={100} sx={{ mx: "auto" }} /></StyledTableCell>
                    </StyledTableRow>
                  ))
                ) : filteredDivisions.length === 0 ? (
                  <StyledTableRow>
                    <StyledTableCell colSpan={4}>
                      <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8" }}>
                        <Box sx={{ fontSize: 64, mb: 2, opacity: 0.3 }}><FolderIcon /></Box>
                        <Typography variant="h6" sx={{ color: "#64748b", mb: 2 }}>
                          {searchTerm ? "No divisions match your search" : "No divisions yet"}
                        </Typography>
                        {!searchTerm && (
                          <Button 
                            onClick={() => { setAddName(""); setIsFormView(true); setEditModal(null); }}
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#6366f1" }}
                          >
                            Add First Division
                          </Button>
                        )}
                      </Box>
                    </StyledTableCell>
                  </StyledTableRow>
                ) : (
                  filteredDivisions.map((d, i) => (
                    <StyledTableRow key={d.id}>
                      <StyledTableCell align="center" className="td-num">
                        {(safePage - 1) * pageSize + i + 1}
                      </StyledTableCell>
                      <StyledTableCell>
                        <div className="td-name-wrap">
                          <span className="td-avatar">{d.name?.charAt(0).toUpperCase()}</span>
                          <span className="td-name">{d.name}</span>
                        </div>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <span className="product-count">{d.products?.length || 0}</span>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                          <Tooltip title="View Details" arrow>
                            <IconButton onClick={() => setViewModal(d)} size="small" sx={{ color: "#0ea5e9", bgcolor: "#f0f9ff", "&:hover": { bgcolor: "#e0f2fe" } }}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage Products" arrow>
                            <IconButton onClick={() => openProducts(d)} size="small" sx={{ color: "#10b981", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" } }}>
                              <InventoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Division" arrow>
                            <IconButton onClick={() => openEdit(d)} size="small" sx={{ color: "#8b5cf6", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#ede9fe" } }}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Division" arrow>
                            <IconButton onClick={() => setDeleteModal(d)} size="small" sx={{ color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" } }}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* ── Card View ── */}
      {view === "card" && (
        <Grid container spacing={2}>
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          ) : filteredDivisions.length === 0 ? (
            <Grid xs={12}>
              <Box sx={{ py: 8, textAlign: "center", color: "#94a3b8", bgcolor: "#fff", borderRadius: 3, border: "1px solid #f1f5f9" }}>
                <Box sx={{ fontSize: 64, mb: 2, opacity: 0.3 }}><FolderIcon /></Box>
                <Typography variant="h6" sx={{ color: "#64748b", mb: 2 }}>
                  {searchTerm ? "No divisions match your search" : "No divisions yet"}
                </Typography>
                {!searchTerm && (
                  <Button 
                    onClick={() => { setAddName(""); setIsFormView(true); setEditModal(null); }}
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#6366f1" }}
                  >
                    Add First Division
                  </Button>
                )}
              </Box>
            </Grid>
          ) : (
            filteredDivisions.map((d, i) => (
              <Grid xs={12} sm={6} lg={4} key={d.id} item>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #f1f5f9",
                    borderRadius: 3,
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.22s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(99, 102, 241, 0.08)",
                      borderColor: "#e0e7ff"
                    }
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 44, height: 44, fontSize: "1rem", fontWeight: 700, bgcolor: "#f5f3ff", color: "#6366f1" }}>
                        {d.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", mb: 0.25 }}>{d.name}</Typography>
                        <Chip
                          label={`${d.products?.length || 0} Products`}
                          size="small"
                          sx={{ bgcolor: "#f5f3ff", color: "#6366f1", fontWeight: 700, fontSize: "0.72rem", height: 22 }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
                      #{(safePage - 1) * pageSize + i + 1}
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: "#94a3b8", mb: 2, display: "block" }}>Division Node</Typography>
                  <Divider sx={{ mb: 1.5 }} />

                  <Grid container spacing={1} sx={{ mt: "auto" }}>
                    <Grid item xs={6}>
                      <Button
                        onClick={() => setViewModal(d)}
                        fullWidth
                        size="small"
                        startIcon={<VisibilityIcon sx={{ fontSize: 13 }} />}
                        sx={{ color: "#4f46e5", bgcolor: "#f5f3ff", "&:hover": { bgcolor: "#eae8ff" }, fontWeight: 600, fontSize: "0.72rem", textTransform: "none", borderRadius: 1.5 }}
                      >
                        View
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        onClick={() => openProducts(d)}
                        fullWidth
                        size="small"
                        startIcon={<InventoryIcon sx={{ fontSize: 13 }} />}
                        sx={{ color: "#15803d", bgcolor: "#f0fdf4", "&:hover": { bgcolor: "#dcfce7" }, fontWeight: 600, fontSize: "0.72rem", textTransform: "none", borderRadius: 1.5 }}
                      >
                        Products
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        onClick={() => openEdit(d)}
                        fullWidth
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: 13 }} />}
                        sx={{ color: "#2563eb", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" }, fontWeight: 600, fontSize: "0.72rem", textTransform: "none", borderRadius: 1.5 }}
                      >
                        Edit
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        onClick={() => setDeleteModal(d)}
                        fullWidth
                        size="small"
                        startIcon={<DeleteIcon sx={{ fontSize: 13 }} />}
                        sx={{ color: "#ef4444", bgcolor: "#fef2f2", "&:hover": { bgcolor: "#fee2e2" }, fontWeight: 600, fontSize: "0.72rem", textTransform: "none", borderRadius: 1.5 }}
                      >
                        Delete
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* ── Pagination ── */}
      {!loading && filteredDivisions.length > 0 && (
        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          bgcolor: "#fff", 
          p: 2, 
          borderRadius: 3, 
          mt: 2, 
          border: "1px solid #f1f5f9" 
        }}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Showing <strong>{start}-{end}</strong> of <strong>{totalElements}</strong> entries
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button 
              disabled={safePage === 1} 
              onClick={() => setPage(1)} 
              variant="outlined" 
              size="small"
              sx={{ minWidth: 32, height: 32, p: 0, borderRadius: 1.5, borderColor: "#e2e8f0" }}
            >
              First
            </Button>
            <Button 
              disabled={safePage === 1} 
              onClick={() => setPage(p => p - 1)} 
              variant="outlined" 
              size="small"
              sx={{ minWidth: 32, height: 32, p: 0, borderRadius: 1.5, borderColor: "#e2e8f0" }}
            >
              Prev
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => (
                p === "…" 
                  ? <Typography key={`e${i}`} variant="body2" sx={{ color: "#94a3b8", px: 1 }}>…</Typography>
                  : <Button 
                      key={p} 
                      onClick={() => setPage(p)}
                      variant={safePage === p ? "contained" : "outlined"}
                      size="small"
                      sx={{ 
                        minWidth: 32, 
                        height: 32, 
                        p: 0, 
                        borderRadius: 1.5, 
                        borderColor: safePage === p ? "transparent" : "#e2e8f0",
                        bgcolor: safePage === p ? "#6366f1" : "transparent",
                        color: safePage === p ? "#fff" : "#1e1b4b",
                        boxShadow: "none",
                        fontWeight: 600
                      }}
                    >
                      {p}
                    </Button>
              ))}

            <Button 
              disabled={safePage === totalPages} 
              onClick={() => setPage(p => p + 1)} 
              variant="outlined" 
              size="small"
              sx={{ minWidth: 32, height: 32, p: 0, borderRadius: 1.5, borderColor: "#e2e8f0" }}
            >
              Next
            </Button>
            <Button 
              disabled={safePage === totalPages} 
              onClick={() => setPage(totalPages)} 
              variant="outlined" 
              size="small"
              sx={{ minWidth: 32, height: 32, p: 0, borderRadius: 1.5, borderColor: "#e2e8f0" }}
            >
              Last
            </Button>
          </Box>
        </Box>
      )}
    </>
  )}

      {/* ── View Modal ── */}
      {viewModal && (
        <Modal title="Division Details" subtitle={`Viewing: ${viewModal.name}`} icon={<VisibilityIcon />} onClose={() => setViewModal(null)} accent="#0ea5e9">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[
              { label: "Division ID:", value: viewModal.id },
              { label: "Division Name:", value: viewModal.name },
              { label: "Total Products:", value: <Typography component="span" sx={{ px: 1, py: 0.25, bgcolor: "#f1f5f9", borderRadius: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1e1b4b" }}>{viewModal.products?.length || 0}</Typography> },
              { label: "Created Date:", value: new Date(viewModal.createdAt || viewModal.created_at || viewModal.dateCreated || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
              { label: "Last Updated:", value: new Date(viewModal.updatedAt || viewModal.updated_at || viewModal.dateUpdated || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
              { label: "Status:", value: <Typography component="span" sx={{ px: 1, py: 0.25, bgcolor: "#dcfce7", color: "#16a34a", borderRadius: 1, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Active</Typography> },
            ].map((row, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>{row.label}</Typography>
                <Typography variant="body2" sx={{ color: "#1e1b4b", fontWeight: 600 }}>{row.value}</Typography>
              </Box>
            ))}
          </Box>
          <DialogActions sx={{ px: 0, pt: 3 }}>
            <Button 
              onClick={() => setViewModal(null)} 
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: "none", color: "#64748b", borderColor: "#e2e8f0" }}
            >
              Close
            </Button>
            <Button 
              onClick={() => { setViewModal(null); openEdit(viewModal); }} 
              variant="contained"
              startIcon={<EditIcon />}
              sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" }, boxShadow: "none" }}
            >
              Edit Division
            </Button>
          </DialogActions>
        </Modal>
      )}

      {/* ── Products Modal ── */}
      {productModal && (
        <Modal title={`Products — ${productModal.name}`} subtitle="Manage products in this division" icon={<InventoryIcon />} onClose={() => setProductModal(null)} accent="#10b981">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <TextField 
                fullWidth size="small" label="Product Name" required autoFocus
                placeholder="e.g. Cheese 500g" value={newProd.name}
                onChange={e => setNewProd(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleAddProduct()}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="UIM Price" type="number" 
                    placeholder="0" value={newProd.uimPrice}
                    onChange={e => setNewProd(f => ({ ...f, uimPrice: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="MRP" type="number"
                    placeholder="0" value={newProd.mrp} 
                    onChange={e => setNewProd(f => ({ ...f, mrp: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Selling Price" type="number"
                    placeholder="0" value={newProd.sellingPrice} 
                    onChange={e => setNewProd(f => ({ ...f, sellingPrice: e.target.value }))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Purchase Price" type="number"
                    placeholder="0" value={newProd.purchasePrice} 
                    onChange={e => setNewProd(f => ({ ...f, purchasePrice: e.target.value }))} />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
                <Button onClick={() => setNewProd(EMPTY_PROD)} size="small" variant="text" sx={{ textTransform: "none", color: "#64748b" }}>Clear</Button>
                <Button 
                  onClick={handleAddProduct} 
                  disabled={prodSaving || !newProd.name.trim()} 
                  variant="contained" 
                  size="small"
                  startIcon={prodSaving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                  sx={{ textTransform: "none", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, boxShadow: "none", borderRadius: 2 }}
                >
                  {prodSaving ? "Adding…" : "Add Product"}
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e1b4b", mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                Existing Products <Chip label={products.length} size="small" sx={{ height: 18, fontSize: "0.7rem", fontWeight: 700 }} />
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
                {prodLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: 2 }} />)
                ) : products.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 4, bgcolor: "#f8fafc", borderRadius: 2, border: "2px dashed #e2e8f0" }}>
                    No products yet. Add one above.
                  </Typography>
                ) : (
                  products.map(p => (
                    <Box key={p.id} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "#fff", border: "1px solid #f1f5f9", borderRadius: 2, "&:hover": { borderColor: "#10b981", bgcolor: "#f0fdf4" }, transition: "all 0.2s" }}>
                      <Box sx={{ bgcolor: "#f1f5f9", p: 1, borderRadius: 1.5, color: "#64748b" }}>
                        <InventoryIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e1b4b" }}>{p.name}</Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>{p.productCode}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#10b981" }}>₹{p.sellingPrice || 0}</Typography>
                      <IconButton onClick={() => handleDeleteProduct(p.id)} size="small" color="error" sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {deleteModal && (
        <Modal title="Delete Division" subtitle="This action cannot be undone" icon={<WarningIcon />} onClose={() => setDeleteModal(null)} accent="#ef4444">
          <Box sx={{ py: 1 }}>
            <Typography variant="body1">
              Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?
            </Typography>
          </Box>
          <DialogActions sx={{ px: 0, pt: 3 }}>
            <Button 
              onClick={() => setDeleteModal(null)} 
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: "none", color: "#64748b", borderColor: "#e2e8f0" }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete} 
              disabled={saving} 
              variant="contained"
              color="error"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
              sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}
            >
              {saving ? "Deleting…" : "Delete Division"}
            </Button>
          </DialogActions>
        </Modal>
      )}

      {/* ── Bulk Upload Modal ── */}
      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Divisions"
        accent="#6366f1"
        templateHeaders={["name"]}
        templateRows={[["North Region"],["South Region"],["East Region"]]}
        parseRow={(row) => {
          const name = (row["name"] || "").trim();
          if (!name) return { valid: false, error: "Name is required" };
          if (/[^a-zA-Z\s,]/.test(name)) return { valid: false, error: "Only letters and spaces allowed" };
          return { valid: true, data: { name } };
        }}
        onUpload={(rows) => bulkCreateDivisions(rows.map((r) => r.name))}
        onDone={() => { if (page === 1) fetchDivisions(); else setPage(1); }}
      />

      {/* ── MUI Toast Implementation ── */}
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {toast && (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.type === "success" ? "success" : toast.type === "warning" ? "warning" : "error"}
            sx={{ 
              width: "100%", 
              borderRadius: 2,
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default Division;
