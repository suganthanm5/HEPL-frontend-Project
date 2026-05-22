import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  SearchRounded, SwapHorizRounded, WarehouseRounded,
  TrendingUpRounded, TrendingDownRounded, CheckRounded,
  CloseRounded,
} from "@mui/icons-material";
import { stockService } from "../../services/stockService";
import { useAuth } from "../../context/AuthContext";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatStockData } from "../../utils/exportUtils";
import "./Stock.css";
import "../UserManagement/UserManagement.css";

/* ── Stock level helper ── */
const stockLevel = (qty, max = 200) => {
  if (qty <= 0)  return { cls: "critical", label: "Out of Stock", color: "#ef4444" };
  if (qty < 10)  return { cls: "low",      label: "Low Stock",   color: "#f59e0b" };
  if (qty < 30)  return { cls: "medium",   label: "Moderate",    color: "#3b82f6" };
  return           { cls: "high",     label: "Healthy",     color: "#10b981" };
};

const emptyTransfer = { fromOutletId: "", outletId: "", productId: "", batchId: "", quantity: "" };

/* helper — extract flat outletId/productId from stock entry regardless of shape */
const stockOutletId = (s) => s.outletId ?? s.outlet?.id ?? "";
const stockProductId = (s) => s.productId ?? s.product?.id ?? "";
const stockBatchId = (s) => s.batchId ?? s.batch?.id ?? "";
const stockBatchNo = (s) => s.batchNo ?? s.batch?.batchNo ?? s.batchId ?? "";
const stockProductName = (s) => s.productName ?? s.product?.name ?? s.productId ?? "";
const stockOutletName = (s) => s.outletName ?? s.outlet?.outletName ?? s.outletId ?? "";

/* ══════════════════════════════════════════
   Stock Management Page
══════════════════════════════════════════ */
const Stock = () => {
  const navigate = useNavigate();
  const [stock,    setStock]    = useState([]);
  const [txns,     setTxns]     = useState([]);
  const [outlets,  setOutlets]  = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const { user, role } = useAuth();
  const userOutletId = user?.outletId || "";
  const isAdmin = role === "ADMIN";
  const isOutletUser = role === "USER";

  const [filters,  setFilters]  = useState({ productId: "", outletId: userOutletId, type: "" });
  const [tab,      setTab]      = useState("stock");
  const [isFormView, setIsFormView] = useState(false);
  const [transfer, setTransfer] = useState({ open: false, data: emptyTransfer });
  const [snack,    setSnack]    = useState({ open: false, msg: "", severity: "success" });
  
  // Pagination state
  const [stockPage, setStockPage] = useState(0);
  const [txnPage,   setTxnPage]   = useState(0);
  const [pageSize,  setPageSize]  = useState(parseInt(localStorage.getItem('itemsPerPage') || '10', 10));
  const [totalStockPages, setTotalStockPages] = useState(0);
  const [totalTxnPages,   setTotalTxnPages]   = useState(0);

  const canTransfer = role === "ADMIN" || role === "MANAGER";

  // Ensure filters are updated if user changes (rare)
  useEffect(() => {
    if (!isAdmin && userOutletId) {
      setFilters(prev => ({ ...prev, outletId: userOutletId }));
    }
  }, [userOutletId, isAdmin]);

  /* ── Load Dynamic Data (Stock/Txns) ── */
  const loadDynamicData = useCallback(async (signal) => {
    setLoading(true);
    try {
      const activeFilters = {
        page: tab === "stock" ? stockPage : txnPage,
        size: pageSize,
        sort: "id,desc"
      };
      
      if (tab === "stock") {
        if (search) activeFilters.search = search;
        if (filters.productId) activeFilters.productId = filters.productId;
        if (filters.outletId) activeFilters.outletId = filters.outletId;

        const sData = await stockService.getAll(activeFilters, signal);
        if (sData && sData.content) {
          setStock(sData.content);
          setTotalStockPages(sData.totalPages);
        } else {
          setStock(Array.isArray(sData) ? sData : []);
        }
      } else {
        if (filters.productId) activeFilters.productId = filters.productId;
        if (filters.outletId)  activeFilters.outletId  = filters.outletId;
        if (filters.type)      activeFilters.type       = filters.type;
        const tData = await stockService.getTransactions(activeFilters, signal);
        if (tData && tData.content) {
          setTxns(tData.content);
          setTotalTxnPages(tData.totalPages);
        } else {
          setTxns(Array.isArray(tData) ? tData : []);
        }
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error("Dynamic data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, filters, search, stockPage, txnPage, pageSize]);

  /* ── Load Metadata (Initial Only) ── */
  const loadMetadata = useCallback(async () => {
    try {
      const { outletService }  = await import("../../services/outletService");
      const { productService } = await import("../../services/productService");

      const [otData, pData] = await Promise.all([
        outletService.getOutlets ? outletService.getOutlets(0, 1000) : Promise.resolve([]),
        productService.getProducts ? productService.getProducts(0, 1000) : Promise.resolve([]),
      ]);

      const outletList = Array.isArray(otData) ? otData : (otData?.content || []);
      const productList = Array.isArray(pData) ? pData : (pData?.content || []);

      setOutlets(outletList);
      setProducts(productList);
    } catch (err) {
      console.error("Metadata load error:", err);
    }
  }, []);

  useEffect(() => { loadMetadata(); }, [loadMetadata]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadDynamicData(controller.signal);
    }, 800);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadDynamicData]);

  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const filteredStock = stock; // Backend handles filtering

  const handleTransfer = async () => {
    const { fromOutletId, outletId, productId, batchId, quantity } = transfer.data;
    if (!fromOutletId) return toast("Please select a source outlet", "error");
    if (!outletId)     return toast("Please select a destination outlet", "error");
    if (!productId)    return toast("Please select a product", "error");
    if (!batchId)      return toast("Please select a batch", "error");
    if (!quantity || Number(quantity) < 1) return toast("Please enter a valid quantity", "error");
    if (String(fromOutletId) === String(outletId)) return toast("Source and destination outlets must be different", "error");

    try {
      await stockService.transfer({
        fromOutletId: Number(fromOutletId),
        outletId:     Number(outletId),
        productId:    Number(productId),
        batchId:      Number(batchId),
        quantity:     Number(quantity),
      });
      toast("Stock transferred successfully");
      setTransfer({ open: false, data: emptyTransfer });
      setIsFormView(false);
      loadDynamicData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Transfer failed";
      toast(msg, "error");
    }
  };

  const totalIn  = txns.filter((t) => t.transactionType === "IN").reduce((a, t) => a + (t.quantity || 0), 0);
  const totalOut = txns.filter((t) => t.transactionType === "OUT").reduce((a, t) => a + (t.quantity || 0), 0);

  return (
    <Box className="stock-page">
      {/* Header */}
      <Box className="page-header">
        <Box className="page-header-left">
          <Typography className="page-title">
            <TypingText text={isOutletUser ? "Available Stock" : "Stock Management"} />
          </Typography>
          <Typography className="page-subtitle">
            {isOutletUser ? "View available inventory and request stock additions" : "Monitor and transfer outlet stock"}
          </Typography>
        </Box>
        {canTransfer && (
        <ButtonBase onClick={() => { setTransfer({ open: true, data: emptyTransfer }); setIsFormView(true); }} disableRipple
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(125,42,232,0.35)" }}>
          <SwapHorizRounded sx={{ fontSize: 18 }} /> Transfer Stock
        </ButtonBase>
        )}
      </Box>

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton onClick={() => { setIsFormView(false); setTransfer({ open: false, data: emptyTransfer }); }} sx={{ color: "#64748b" }}>
                  <CloseRounded />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "Poppins, sans-serif" }}>
                    Transfer Stock
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "Poppins, sans-serif" }}>
                    Move inventory between different outlet locations
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button variant="outlined" color="inherit" 
                  onClick={() => { setIsFormView(false); setTransfer({ open: false, data: emptyTransfer }); }}
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", borderRadius: "50px", textTransform: "none", px: 3 }}>
                  Cancel
                </Button>
                <Button variant="contained" startIcon={<SwapHorizRounded />} 
                  onClick={handleTransfer}
                  sx={{ 
                    borderRadius: "50px", 
                    background: "linear-gradient(135deg, #7d2ae8, #a855f7)", 
                    color: "#fff", 
                    textTransform: "none",
                    px: 4,
                    boxShadow: "0 4px 12px rgba(125,42,232,0.35)",
                    "&:hover": { background: "linear-gradient(135deg, #6b21c1, #9333ea)" }
                  }}>
                  Initiate Transfer
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Box>
                        <Typography className="dialog-field-label" sx={{ mb: 1 }}>From Outlet *</Typography>
                        <SearchableSelect
                          options={outlets.map(o => ({ id: o.id, name: o.outletName }))}
                          value={transfer.data.fromOutletId}
                          onChange={(id) => setTransfer(t => ({ ...t, data: { ...t.data, fromOutletId: id, batchId: "", productId: "" } }))}
                          placeholder="— Source —"
                        />
                      </Box>
                      <Box>
                        <Typography className="dialog-field-label" sx={{ mb: 1 }}>To Outlet *</Typography>
                        <SearchableSelect
                          options={outlets.filter(o => String(o.id) !== String(transfer.data.fromOutletId)).map(o => ({ id: o.id, name: o.outletName }))}
                          value={transfer.data.outletId}
                          onChange={(id) => setTransfer(t => ({ ...t, data: { ...t.data, outletId: id } }))}
                          placeholder="— Destination —"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Box>
                        <Typography className="dialog-field-label" sx={{ mb: 1 }}>Product *</Typography>
                        <SearchableSelect
                          options={[...new Map(
                            stock
                              .filter(s => String(s.outletId) === String(transfer.data.fromOutletId))
                              .map(s => [s.productId, { id: s.productId, name: s.productName }])
                          ).values()]}
                          value={transfer.data.productId}
                          onChange={(id) => setTransfer(t => ({ ...t, data: { ...t.data, productId: id, batchId: "" } }))}
                          placeholder="— Select Product —"
                        />
                      </Box>
                      <Box>
                        <Typography className="dialog-field-label" sx={{ mb: 1 }}>Batch *</Typography>
                        <SearchableSelect
                          options={stock
                            .filter(s => String(s.productId) === String(transfer.data.productId)
                              && String(s.outletId) === String(transfer.data.fromOutletId))
                            .map(s => ({ id: s.batchId, name: `${s.batchNo} (Avail: ${s.availableQty})` }))}
                          value={transfer.data.batchId}
                          onChange={(id) => setTransfer(t => ({ ...t, data: { ...t.data, batchId: id } }))}
                          placeholder="— Select Batch —"
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Typography className="dialog-field-label" sx={{ mb: 1 }}>Quantity to Transfer *</Typography>
                      <TextField fullWidth size="small" type="number" placeholder="Enter Quantity"
                        value={transfer.data.quantity}
                        onChange={(e) => setTransfer((t) => ({ ...t, data: { ...t.data, quantity: e.target.value } }))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ p: 4, bgcolor: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", height: "100%", display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif", display: "flex", alignItems: "center", gap: 1 }}>
                      <WarehouseRounded sx={{ color: "#7d2ae8" }} /> Transfer Summary
                    </Typography>
                    
                    <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 0.5 }}>Moving From</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {outlets.find(o => String(o.id) === String(transfer.data.fromOutletId))?.outletName || "Not selected"}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "center", my: -1 }}>
                      <SwapHorizRounded sx={{ color: "#94a3b8", transform: "rotate(90deg)" }} />
                    </Box>

                    <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 0.5 }}>Moving To</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {outlets.find(o => String(o.id) === String(transfer.data.outletId))?.outletName || "Not selected"}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: "auto", p: 2, bgcolor: "#f1f5f9", borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>Selected Product</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {products.find(p => String(p.id) === String(transfer.data.productId))?.name || "None"}
                      </Typography>
                      {transfer.data.quantity && (
                        <Typography variant="h6" sx={{ color: "#7d2ae8", fontWeight: 800, mt: 1 }}>
                          {transfer.data.quantity} Units
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      ) : (
        <>
          {/* Stat Cards */}
      {!isOutletUser && (
      <Box className="stat-cards-row">
        {[
          { label: "Stock Entries",  value: stock.length,  bg: "#f5f0ff", color: "#7d2ae8", Icon: WarehouseRounded, theme: "purple" },
          { label: "Total IN",       value: totalIn,        bg: "#dcfce7", color: "#16a34a", Icon: TrendingUpRounded, theme: "green" },
          { label: "Total OUT",      value: totalOut,       bg: "#fee2e2", color: "#ef4444", Icon: TrendingDownRounded, theme: "rose" },
          { label: "Transactions",   value: txns.length,    bg: "#e0f2fe", color: "#0284c7", Icon: SwapHorizRounded, theme: "blue" },
        ].map(({ label, value, bg, color, Icon, theme }) => (
          <Box className={`stat-card stat-${theme}`} key={label}>
            <Box className="stat-card-icon" sx={{ background: bg }}><Icon sx={{ color, fontSize: 22 }} /></Box>
            <Box>
              <Typography className="stat-card-value">{value}</Typography>
              <Typography className="stat-card-label">{label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      )}

      {/* Tab Row */}
      {!isOutletUser && (
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {["stock", "history"].map((t) => (
          <ButtonBase key={t} onClick={() => setTab(t)} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg,#7d2ae8,#a855f7)" : "#f5f0ff", color: tab === t ? "#fff" : "#7d2ae8", boxShadow: tab === t ? "0 4px 12px rgba(125,42,232,0.3)" : "none" }}>
            {t === "stock" ? "Outlet Stock" : "Transaction History"}
          </ButtonBase>
        ))}
      </Box>
      )}

      {/* Table */}
      <Box className="table-card">
        <Box className="table-toolbar">
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>
              {tab === "stock" ? "Current Stock" : "Transaction History"}
            </Typography>
            <ExportMenu
              getData={() => tab === "stock" ? formatStockData(filteredStock) : txns.map(t => ({ Type: t.transactionType, Product: t.productName || t.productId, Batch: t.batchNo || t.batchId, Outlet: t.outletName || t.outletId, Qty: t.quantity, By: t.createdBy, Date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—' }))}
              filename={tab === "stock" ? "stock" : "transactions"}
              title={tab === "stock" ? "Stock Report" : "Transaction History"}
              backendType={tab === "stock" ? "stock" : undefined}
            />

            {tab === "history" && (
              <>
                <Select 
                  size="small" displayEmpty value={filters.type} 
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                  sx={{ minWidth: 100, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="IN">IN</MenuItem>
                  <MenuItem value="OUT">OUT</MenuItem>
                  <MenuItem value="TRANSFER">TRANSFER</MenuItem>
                </Select>

                <Select 
                  size="small" displayEmpty value={filters.productId} 
                  onChange={(e) => setFilters(f => ({ ...f, productId: e.target.value }))}
                  sx={{ minWidth: 140, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
                >
                  <MenuItem value="">All Products</MenuItem>
                  {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>

                <Select 
                  size="small" displayEmpty value={filters.outletId} 
                  onChange={(e) => setFilters(f => ({ ...f, outletId: e.target.value }))}
                  disabled={!isAdmin}
                  sx={{ minWidth: 140, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
                >
                  <MenuItem value="">{isAdmin ? "All Outlets" : "Select Outlet"}</MenuItem>
                  {outlets.map(ot => <MenuItem key={ot.id} value={ot.id}>{ot.outletName}</MenuItem>)}
                </Select>

                <ButtonBase onClick={() => setFilters({ productId: "", outletId: userOutletId, type: "" })} sx={{ color: "#7d2ae8", fontSize: "0.75rem", fontWeight: 600 }}>Clear</ButtonBase>
              </>
            )}
          </Box>
          <Box className="table-search">
            <SearchRounded sx={{ fontSize: 18, color: "#7d2ae8", flexShrink: 0 }} />
            <InputBase placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }} />
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3 }}>
          {tab === "stock" ? (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#fafafa" }}>
                  {isOutletUser 
                    ? ["Product Name", "Available Stock", "Action"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>{h}</TableCell>
                      ))
                    : ["Outlet", "Product", "Batch", "Available", "Reserved", "Level"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>{h}</TableCell>
                      ))
                  }
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={isOutletUser ? 3 : 6} align="center" sx={{ py: 6 }}><CircularProgress sx={{ color: "#7d2ae8" }} size={32} /></TableCell></TableRow>
                ) : filteredStock.length === 0 ? (
                  <TableRow><TableCell colSpan={isOutletUser ? 3 : 6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>No stock found</TableCell></TableRow>
                ) : (
                  filteredStock.map((s) => {
                    const lvl = stockLevel(s.availableQty);
                    const isLow = s.availableQty < 10;
                    return (
                      <TableRow 
                        key={s.id} hover 
                        sx={{ 
                          "&:hover": { background: isLow ? "#fff1f2" : "#faf5ff" }, 
                          "&:last-child td": { borderBottom: 0 },
                          background: isLow ? "#fff1f2" : "inherit"
                        }}
                      >
                        {isOutletUser ? (
                          <>
                            <TableCell sx={{ fontWeight: 600, color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.productName || s.productId}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: isLow ? "#ef4444" : "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>{s.availableQty}</TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => navigate("/orders", { state: { prefillProduct: { id: s.productId, name: s.productName || s.productId } } })}
                                sx={{
                                  background: "linear-gradient(135deg,#7d2ae8,#a855f7)",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontFamily: "Poppins",
                                  fontSize: "0.75rem",
                                  borderRadius: "20px",
                                  boxShadow: "0 2px 8px rgba(125,42,232,0.25)",
                                  "&:hover": {
                                    background: "linear-gradient(135deg,#6b21a8,#9333ea)"
                                  }
                                }}
                              >
                                Request Product
                              </Button>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell sx={{ fontWeight: 600, color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.outletName || s.outletId}</TableCell>
                            <TableCell sx={{ color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.productName || s.productId}</TableCell>
                            <TableCell sx={{ color: "#7d2ae8", fontWeight: 600, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.batchNo || s.batchId}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: isLow ? "#ef4444" : "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>{s.availableQty}</TableCell>
                            <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.reservedQty || 0}</TableCell>
                            <TableCell>
                              <Box className="stock-level">
                                <Box className="stock-level-bar">
                                  <Box className={`stock-level-fill ${lvl.cls}`} sx={{ width: `${Math.min((s.availableQty / 200) * 100, 100)}%`, backgroundColor: lvl.color }} />
                                </Box>
                                <Typography className={`stock-level-text ${lvl.cls}`} sx={{ color: lvl.color }}>{lvl.label}</Typography>
                              </Box>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#fafafa" }}>
                  {["Type", "Product", "Batch", "Outlet", "Qty", "By", "Date"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress sx={{ color: "#7d2ae8" }} size={32} /></TableCell></TableRow>
                ) : txns.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>No transactions</TableCell></TableRow>
                ) : (
                  txns.map((t) => (
                    <TableRow key={t.id} hover sx={{ "&:hover": { background: "#faf5ff" }, "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          {t.transactionType === "IN"
                            ? <TrendingUpRounded sx={{ fontSize: 16, color: "#16a34a" }} />
                            : <TrendingDownRounded sx={{ fontSize: 16, color: "#ef4444" }} />
                          }
                          <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: t.transactionType === "IN" ? "#16a34a" : "#ef4444", fontFamily: "Poppins, sans-serif" }}>{t.transactionType}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{t.productName || t.productId}</TableCell>
                      <TableCell sx={{ color: "#7d2ae8", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{t.batchNo || t.batchId}</TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{t.outletName || t.outletId}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{t.quantity}</TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{t.createdBy}</TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Pagination */}
        {((tab === "stock" && totalStockPages > 1) || (tab === "history" && totalTxnPages > 1)) && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 1 }}>
            <ButtonBase
              disabled={tab === "stock" ? stockPage === 0 : txnPage === 0}
              onClick={() => tab === "stock" ? setStockPage(p => p - 1) : setTxnPage(p => p - 1)}
              sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid #e2e8f0", opacity: (tab === "stock" ? stockPage === 0 : txnPage === 0) ? 0.5 : 1 }}
            >
              Previous
            </ButtonBase>
            <Typography sx={{ display: "flex", alignItems: "center", px: 2, fontSize: "0.875rem", fontWeight: 600 }}>
              Page {(tab === "stock" ? stockPage : txnPage) + 1} of {tab === "stock" ? totalStockPages : totalTxnPages}
            </Typography>
            <ButtonBase
              disabled={tab === "stock" ? stockPage >= totalStockPages - 1 : txnPage >= totalTxnPages - 1}
              onClick={() => tab === "stock" ? setStockPage(p => p + 1) : setTxnPage(p => p + 1)}
              sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid #e2e8f0", opacity: (tab === "stock" ? stockPage >= totalStockPages - 1 : txnPage >= totalTxnPages - 1) ? 0.5 : 1 }}
            >
              Next
            </ButtonBase>
          </Box>
        )}
      </Box>
    </>
  )}

  {/* Transfer Dialog (REPLACED) */}
      {/* Transfer Dialog (REPLACED) */}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "Poppins, sans-serif" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Stock;
