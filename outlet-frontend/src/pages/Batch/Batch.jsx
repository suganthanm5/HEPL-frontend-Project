import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, ButtonBase, InputBase,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, Tooltip,
  CircularProgress, Snackbar, Alert, IconButton, Paper,
  Grid, Stack,
} from "@mui/material";
import {
  AddRounded, SearchRounded, EditRounded,
  DeleteRounded, InventoryRounded, CheckRounded,
  WarningRounded, CloseRounded,
} from "@mui/icons-material";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { batchService } from "../../services/batchService";
import { productService } from "../../services/productService";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import { formatBatchData } from "../../utils/exportUtils";
import "./Batch.css";
import "../UserManagement/UserManagement.css"; /* shared page styles */

/* ── Empty form ── */
const emptyForm = {
  productId: "", batchNo: "", manufactureDate: "",
  expiryDate: "", quantity: "", purchasePrice: "",
  sellingPrice: "", status: "ACTIVE",
};

/* ── Expiry helper ── */
const expiryClass = (dateStr) => {
  if (!dateStr) return "valid";
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0)   return "expired";
  if (diff < 90)  return "warning";
  return "valid";
};

/* ══════════════════════════════════════════
   Batch Page
══════════════════════════════════════════ */
const Batch = () => {
  const [batches,  setBatches]  = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [isFormView, setIsFormView] = useState(false);
  const [filters,  setFilters]  = useState({ productId: "", status: "" });
  const [dialog,   setDialog]   = useState({ open: false, mode: "add", data: emptyForm });
  const [delDialog, setDelDialog] = useState({ open: false, id: null });
  const [snack,    setSnack]    = useState({ open: false, msg: "", severity: "success" });

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = {};
      if (filters.productId) activeFilters.productId = filters.productId;
      if (filters.status) activeFilters.status = filters.status;

      // 1. Fetch Batches
      try {
        const bData = await batchService.getAll(activeFilters);
        console.log("Batch API Response:", bData);
        let extractedBatches = [];
        if (Array.isArray(bData)) extractedBatches = bData;
        else if (Array.isArray(bData?.content)) extractedBatches = bData.content;
        else if (Array.isArray(bData?.data)) extractedBatches = bData.data;
        else if (Array.isArray(bData?.data?.content)) extractedBatches = bData.data.content;
        
        const batches = extractedBatches;
        
        console.log("Batch Final array:", batches);
        setBatches(batches);
        console.log("Batches loaded:", batches.length);
      } catch (err) {
        console.error("Batch fetch error:", err);
        setBatches([]);
        toast("Failed to load batches: " + (err.response?.data?.message || err.message), "error");
      }

      // 2. Fetch Products (for labels/filters)
      try {
        const pData = await (productService.getAll ? productService.getAll(0, 1000) : Promise.resolve([]));
        // productService.getAll returns a Page object { content, totalPages, ... }
        const productList = Array.isArray(pData)
          ? pData
          : Array.isArray(pData?.content)
            ? pData.content
            : [];
        setProducts(productList);
      } catch (err) {
        console.error("Product fetch error:", err);
      }

    } catch (err) {
      console.error("Load general error:", err);
      toast("Error loading page data", "error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  /* ── Filter ── */
  const filtered = batches.filter((b) =>
    [b.batchNo, b.productName || b.product?.name, b.status].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  /* ── Save ── */
  const handleSave = async () => {
    // Frontend Validation
    const d = dialog.data;
    if (!d.productId || !d.batchNo || !d.manufactureDate || !d.expiryDate || 
        !d.quantity || !d.purchasePrice || !d.sellingPrice) {
      return toast("All fields are required. Please check your inputs.", "warning");
    }

    try {
      if (dialog.mode === "add") {
        await batchService.create(dialog.data);
        toast("Batch created successfully");
      } else {
        await batchService.update(dialog.data.id, dialog.data);
        toast("Batch updated successfully");
      }
      setDialog({ open: false, mode: "add", data: emptyForm });
      setIsFormView(false);
      // Reset filters and reload immediately to show newly created/updated batch
      setFilters({ productId: "", status: "" });
      setSearch("");
      // Fetch all batches without filters
      setLoading(true);
      try {
        const bData = await batchService.getAll({});
        let extractedBatches = [];
        if (Array.isArray(bData)) extractedBatches = bData;
        else if (Array.isArray(bData?.content)) extractedBatches = bData.content;
        else if (Array.isArray(bData?.data)) extractedBatches = bData.data;
        else if (Array.isArray(bData?.data?.content)) extractedBatches = bData.data.content;
        
        const batches = extractedBatches;
        setBatches(batches);
      } catch (err) {
        console.error("Error reloading batches:", err);
        setBatches([]);
      } finally {
        setLoading(false);
      }
    } catch (err) { 
      // Handle backend validation errors
      if (err.response?.status === 400 && err.response?.data?.data) {
        const errors = err.response.data.data;
        const firstError = Object.values(errors)[0];
        toast(firstError, "error");
      } else {
        const msg = err.response?.data?.message || "Operation failed";
        toast(msg, "error");
      }
    }
  };

  const handleDelete = async () => {
    try {
      await batchService.delete(delDialog.id);
      toast("Batch deleted");
      setDelDialog({ open: false, id: null });
      load();
    } catch { toast("Delete failed", "error"); }
  };

  const productName = (id) =>
    products.find((p) => String(p.id) === String(id))?.name || id;

  return (
    <Box className="batch-page">
      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton onClick={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }} sx={{ color: "#64748b" }}>
                  <CloseRounded />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "Poppins, sans-serif" }}>
                    {dialog.mode === "add" ? "Create Batch" : "Edit Batch"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "Poppins, sans-serif" }}>
                    {dialog.mode === "add" ? "Define a new product batch with expiry details" : `Updating batch ${dialog.data.batchNo}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button variant="outlined" color="inherit" 
                  onClick={() => { setIsFormView(false); setDialog({ open: false, mode: "add", data: emptyForm }); }}
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", borderRadius: "50px", textTransform: "none", px: 3 }}>
                  Cancel
                </Button>
                <Button variant="contained" startIcon={<CheckRounded />} 
                  onClick={handleSave}
                  sx={{ 
                    borderRadius: "50px", 
                    background: "linear-gradient(135deg, #7d2ae8, #a855f7)", 
                    color: "#fff", 
                    textTransform: "none",
                    px: 4,
                    boxShadow: "0 4px 12px rgba(125,42,232,0.35)",
                    "&:hover": { background: "linear-gradient(135deg, #6b21c1, #9333ea)" }
                  }}>
                  {dialog.mode === "add" ? "Add Batch" : "Save Changes"}
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Product *</Typography>
                      <SearchableSelect
                        options={products.map((p) => ({ id: p.id, name: p.name }))}
                        value={dialog.data.productId}
                        onChange={(id) => {
                          const selected = products.find((p) => String(p.id) === String(id));
                          setDialog((d) => ({
                            ...d,
                            data: {
                              ...d.data,
                              productId: id,
                              purchasePrice: selected?.purchasePrice ?? d.data.purchasePrice,
                              sellingPrice:  selected?.sellingPrice  ?? d.data.sellingPrice,
                            },
                          }));
                        }}
                        placeholder="— Select Product —"
                        searchPlaceholder="Search products..."
                      />
                    </Box>
                    {[
                      { key: "batchNo",       label: "Batch No",       type: "text" },
                      { key: "quantity",      label: "Quantity",        type: "number" },
                      { key: "manufactureDate", label: "Manufacture Date", type: "date" },
                      { key: "expiryDate",    label: "Expiry Date",    type: "date" },
                      { key: "purchasePrice", label: "Purchase Price ₹", type: "number" },
                      { key: "sellingPrice",  label: "Selling Price ₹",  type: "number" },
                    ].map(({ key, label, type }) => (
                      <Box key={key}>
                        <Typography className="dialog-field-label" sx={{ mb: 1 }}>{label} *</Typography>
                        <TextField fullWidth size="small" type={type} required
                          InputLabelProps={type === "date" ? { shrink: true } : {}}
                          value={dialog.data[key]}
                          onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, [key]: e.target.value } }))}
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
                      </Box>
                    ))}
                    <Box>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Status *</Typography>
                      <FormControl fullWidth size="small" required>
                        <Select value={dialog.data.status}
                          onChange={(e) => setDialog((d) => ({ ...d, data: { ...d.data, status: e.target.value } }))}
                          sx={{ borderRadius: 2, fontFamily: "Poppins, sans-serif" }}>
                          <MenuItem value="ACTIVE" sx={{ fontFamily: "Poppins, sans-serif" }}>Active</MenuItem>
                          <MenuItem value="INACTIVE" sx={{ fontFamily: "Poppins, sans-serif" }}>Inactive</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 4, bgcolor: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", height: "100%" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e1b4b", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <InventoryRounded sx={{ color: "#7d2ae8" }} /> Batch Overview
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>Batch Identifier</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{dialog.data.batchNo || "—"}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>Calculated Expiry</Typography>
                        <Typography variant="body1" sx={{ 
                          fontWeight: 700, 
                          color: expiryClass(dialog.data.expiryDate) === "expired" ? "#ef4444" : 
                                 expiryClass(dialog.data.expiryDate) === "warning" ? "#ca8a04" : "#1e1b4b"
                        }}>
                          {dialog.data.expiryDate || "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>Stock Value</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          ₹{(Number(dialog.data.quantity) * Number(dialog.data.purchasePrice)).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      ) : (
        <>
          {/* Header */}
          <Box className="page-header">
            <Box className="page-header-left">
              <Typography className="page-title">Batch Management</Typography>
              <Typography className="page-subtitle">Track product batches and expiry</Typography>
            </Box>
            <ButtonBase onClick={() => { setDialog({ open: true, mode: "add", data: emptyForm }); setIsFormView(true); }} disableRipple
              sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(125,42,232,0.35)", transition: "all 0.25s ease" }}>
              <AddRounded sx={{ fontSize: 18 }} /> Add Batch
            </ButtonBase>
          </Box>


      {/* Stat Cards */}
      <Box className="stat-cards-row">
        {[
          { label: "Total Batches", value: batches.length, bg: "#f5f0ff", color: "#7d2ae8", Icon: InventoryRounded },
          { label: "Active",        value: batches.filter((b) => b.status === "ACTIVE").length, bg: "#dcfce7", color: "#16a34a", Icon: CheckRounded },
          { label: "Expiring Soon", value: batches.filter((b) => expiryClass(b.expiryDate) === "warning").length, bg: "#fef9c3", color: "#ca8a04", Icon: WarningRounded },
          { label: "Expired",       value: batches.filter((b) => expiryClass(b.expiryDate) === "expired").length, bg: "#fee2e2", color: "#ef4444", Icon: WarningRounded },
        ].map(({ label, value, bg, color, Icon }) => (
          <Box className="stat-card" key={label}>
            <Box className="stat-card-icon" sx={{ background: bg }}>
              <Icon sx={{ color, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography className="stat-card-value">{value}</Typography>
              <Typography className="stat-card-label">{label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box className="table-card">
        <Box className="table-toolbar">
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>All Batches</Typography>
            <ExportMenu getData={() => formatBatchData(filtered)} filename="batches" title="Batch Report" backendType="batches" />
            
            {/* Product Filter */}
            <Select 
              size="small" displayEmpty value={filters.productId} 
              onChange={(e) => setFilters(f => ({ ...f, productId: e.target.value }))}
              sx={{ minWidth: 150, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
            >
              <MenuItem value="">All Products</MenuItem>
              {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>

            {/* Status Filter */}
            <Select 
              size="small" displayEmpty value={filters.status} 
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              sx={{ minWidth: 120, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>

            <ButtonBase onClick={() => setFilters({ productId: "", status: "" })} sx={{ color: "#7d2ae8", fontSize: "0.75rem", fontWeight: 600 }}>Clear</ButtonBase>
          </Box>

          <Box className="table-search">
            <SearchRounded sx={{ fontSize: 18, color: "#7d2ae8", flexShrink: 0 }} />
            <InputBase placeholder="Search batches…" value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }} />
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: "#fafafa" }}>
                {["Batch No", "Product", "Qty", "Expiry Date", "Purchase ₹", "Selling ₹", "Status", "Actions"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress sx={{ color: "#7d2ae8" }} size={32} /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>No batches found</TableCell></TableRow>
              ) : (
                filtered.map((b) => {
                  const ec = expiryClass(b.expiryDate);
                  return (
                    <TableRow key={b.id} hover sx={{ "&:hover": { background: "#faf5ff" }, "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: "#7d2ae8", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem" }}>{b.batchNo}</TableCell>
                      <TableCell sx={{ color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>
                        {b.productName || b.product?.name || productName(b.productId || b.product?.id)}
                      </TableCell>
                      <TableCell>
                        <Box className="stock-bar-wrap">
                          <Box className="stock-bar"><Box className="stock-bar-fill" sx={{ width: `${Math.min((b.quantity / 500) * 100, 100)}%` }} /></Box>
                          <Typography className="stock-qty">{b.quantity}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography className={`expiry-badge ${ec}`}>
                          {ec === "expired" ? "⚠ " : ""}{b.expiryDate || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>₹{b.purchasePrice}</TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>₹{b.sellingPrice}</TableCell>
                      <TableCell>
                        <Typography className={`batch-status ${b.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                          {b.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.75 }}>
                          <Tooltip title="Edit"><ButtonBase className="action-btn edit" onClick={() => { setDialog({ open: true, mode: "edit", data: { ...b } }); setIsFormView(true); }} disableRipple><EditRounded sx={{ fontSize: 16 }} /></ButtonBase></Tooltip>
                          <Tooltip title="Delete"><ButtonBase className="action-btn delete" onClick={() => setDelDialog({ open: true, id: b.id })} disableRipple><DeleteRounded sx={{ fontSize: 16 }} /></ButtonBase></Tooltip>
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
    </>
  )}

  {/* Add/Edit Dialog (REPLACED) */}
      {/* Add/Edit Dialog (REPLACED) */}

      {/* Delete Dialog */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, id: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#1e1b4b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Confirm Delete
          <IconButton onClick={() => setDelDialog({ open: false, id: null })} size="small" sx={{ color: "#64748b" }}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent><Typography sx={{ fontFamily: "Poppins, sans-serif", color: "#64748b", fontSize: "0.9rem" }}>Delete this batch? This cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <ButtonBase onClick={() => setDelDialog({ open: false, id: null })} disableRipple sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>Cancel</ButtonBase>
          <ButtonBase onClick={handleDelete} disableRipple sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "#ef4444", color: "#fff", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>Delete</ButtonBase>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "Poppins, sans-serif" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Batch;
