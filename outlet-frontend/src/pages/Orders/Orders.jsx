import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, ButtonBase, InputBase,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, Tooltip,
  CircularProgress, Snackbar, Alert, IconButton, Paper,
  Grid, Stack, Divider, Tabs, Tab
} from "@mui/material";
import {
  AddRounded, SearchRounded, EditRounded,
  CheckRounded, ShoppingCartRounded, PendingRounded,
  ThumbUpRounded, ThumbDownRounded, LocalShippingRounded,
  DeleteRounded, CloseRounded,
} from "@mui/icons-material";
import { orderService } from "../../services/orderService";
import { outletService } from "../../services/outletService";
import { productService } from "../../services/productService";
import { batchService } from "../../services/batchService";
import { useAuth } from "../../context/AuthContext";
import { getCookie } from "../../utils/cookieUtils";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import { formatOrderData } from "../../utils/exportUtils";
import "./Orders.css";
import "../UserManagement/UserManagement.css";


const STATUS_META = {
  PENDING: { label: "Pending", cls: "pending", Icon: PendingRounded },
  APPROVED: { label: "Approved", cls: "approved", Icon: ThumbUpRounded },
  COMPLETED: { label: "Completed", cls: "completed", Icon: LocalShippingRounded },
  REJECTED: { label: "Rejected", cls: "rejected", Icon: ThumbDownRounded },
  CANCELLED: { label: "Cancelled", cls: "cancelled", Icon: CloseRounded },
};

const TIMELINE = ["PENDING", "APPROVED", "COMPLETED"];

const emptyOrder = { outletId: "", items: [] };
const emptyItem = { productId: "", batchId: "", quantity: 1, price: 0 };

/* ══════════════════════════════════════════
   Orders Page
══════════════════════════════════════════ */
const Orders = () => {
  const { user, role } = useAuth();
  const userOutletId = user?.outletId || "";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const [filters, setFilters] = useState({ status: "", outletId: isAdmin ? "" : userOutletId });
  const [detail, setDetail] = useState(null);
  const [isFormView, setIsFormView] = useState(false);
  const [create, setCreate] = useState({ open: false, data: emptyOrder });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [totalElements, setTotalElements] = useState(0);

  /* ── Extract array from various response shapes ── */
  const extractArr = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.content)) return val.content;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.data?.content)) return val.data.content;
    return [];
  };

  /* ── Load Orders (Dynamic) ── */
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = {
        page,
        size: pageSize,
        sort: "id,desc"
      };
      if (filters.status) activeFilters.status = filters.status;
      if (filters.outletId) activeFilters.outletId = filters.outletId;
      if (search) activeFilters.orderNo = search;

      const oData = await orderService.getAll(activeFilters);
      if (oData && oData.content) {
        setOrders(oData.content);
        setTotalPages(oData.totalPages);
        setTotalElements(oData.totalElements);
      } else {
        setOrders(extractArr(oData));
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, search, page, pageSize]);

  /* ── Load Metadata (Initial Only) ── */
  const loadMetadata = useCallback(async () => {
    const safe = (promise) => promise.catch((err) => {
      console.error("Fetch metadata error:", err);
      return [];
    });

    const [otData, pData, bData] = await Promise.all([
      safe(outletService.getOutlets ? outletService.getOutlets(0, 1000) : Promise.resolve([])),
      safe(productService.getProducts ? productService.getProducts(0, 1000) : Promise.resolve([])),
      safe(batchService.getAll ? batchService.getAll() : Promise.resolve([])),
    ]);

    const rawOutlets = extractArr(otData);
    const enrichedOutlets = rawOutlets.map((o) => {
      if (o.allProducts) return o;
      const divisionMap = new Map();
      (o.mappings || []).forEach((m) => {
        const divId = m.divisionId || m.division?.id;
        if (!divisionMap.has(divId)) divisionMap.set(divId, []);
        const prodId = m.productId || m.product?.id;
        const prodName = m.productName || m.product?.name;
        if (prodId) divisionMap.get(divId).push({ id: prodId, name: prodName, productCode: m.productCode });
      });
      const allProducts = [];
      divisionMap.forEach((prods) => allProducts.push(...prods));
      return { ...o, allProducts };
    });

    setOutlets(enrichedOutlets);
    setProducts(extractArr(pData));
    setBatches(extractArr(bData));
  }, []);

  useEffect(() => { loadMetadata(); }, [loadMetadata]);
  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Ensure filters and new order data reflect the user's outlet
  useEffect(() => {
    if (!isAdmin && userOutletId) {
      setFilters(prev => ({ ...prev, outletId: userOutletId }));
      setCreate(prev => ({ ...prev, data: { ...prev.data, outletId: userOutletId } }));
    }
  }, [userOutletId, isAdmin]);

  const toast = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  /* Orders are already filtered server-side */
  const filtered = orders;

  const counts = Object.keys(STATUS_META).reduce((acc, k) => {
    acc[k] = orders.filter((o) => o.status === k).length;
    return acc;
  }, {});

  /* ── Create order ── */
  const handleCreate = async () => {
    if (!create.data.outletId || create.data.items.length === 0)
      return toast("Please select outlet and add items", "error");

    try {
      await orderService.create(create.data);
      toast("Order created successfully");
      setCreate({ open: false, data: emptyOrder });
      setIsFormView(false);
      loadOrders();
    } catch (err) {
      toast(err.response?.data?.message || "Creation failed", "error");
    }
  };

  /* ── Status update ── */
  const updateStatus = async (id, status) => {
    try {
      await orderService.updateStatus(id, status);
      toast(`Order ${status.toLowerCase()}`);
      setDetail(null);
      loadOrders();
    } catch (err) {
      toast(err.response?.data?.message || "Update failed", "error");
    }
  };

  /* ── Item helpers ── */
  const addItem = () =>
    setCreate((prev) => ({
      ...prev,
      data: { ...prev.data, items: [...prev.data.items, { ...emptyItem }] },
    }));

  const removeItem = (idx) =>
    setCreate((prev) => ({
      ...prev,
      data: { ...prev.data, items: prev.data.items.filter((_, i) => i !== idx) },
    }));

  const updateItem = (idx, key, val) => {
    const newItems = [...create.data.items];
    newItems[idx] = { ...newItems[idx], [key]: val };

    /* Auto-fill price when batch is chosen */
    if (key === "batchId") {
      const batch = batches.find((b) => String(b.id) === String(val));
      if (batch) newItems[idx].price = batch.sellingPrice ?? 0;
    }

    setCreate((prev) => ({
      ...prev,
      data: { ...prev.data, items: newItems },
    }));
  };

  const timelineIdx = (status) => TIMELINE.indexOf(status);

  /* ── Outlet display name helper ── */
  const outletName = (ot) => ot.outletName || ot.name || "Unknown";

  return (
    <Box className="orders-page">
      {/* ── Header ── */}
      <Box className="page-header">
        <Box className="page-header-left">
          <Typography className="page-title">Orders</Typography>
          <Typography className="page-subtitle">Track and manage batch orders</Typography>
        </Box>
        {(isAdmin || isManager || role === "USER") && (
          <ButtonBase
            onClick={() => {
              let initialOutletId = "";
              if (!isAdmin) {
                const storedOutletId = getCookie("outletId");
                initialOutletId = storedOutletId || userOutletId || "";
              }
              setCreate({ open: true, data: { ...emptyOrder, outletId: initialOutletId, items: [{ ...emptyItem }] } });
              setIsFormView(true);
            }}
            disableRipple
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(125,42,232,0.35)" }}
          >
            <AddRounded sx={{ fontSize: 18 }} /> Create Order
          </ButtonBase>
        )}
      </Box>

      {isFormView ? (
        /* ── Full Page Form View ── */
        <Box className="animate-fade-in">
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#fafafa" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <IconButton onClick={() => { setIsFormView(false); setCreate({ open: false, data: emptyOrder }); }} sx={{ color: "#64748b" }}>
                  <CloseRounded />
                </IconButton>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "Poppins, sans-serif" }}>
                    Create New Order
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "Poppins, sans-serif" }}>
                    {isAdmin ? "Select an outlet and add items to create a supply order" : "Request inventory for your assigned outlet"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button variant="outlined" color="inherit"
                  onClick={() => { setIsFormView(false); setCreate({ open: false, data: emptyOrder }); }}
                  sx={{ color: "#64748b", borderColor: "#e2e8f0", borderRadius: "50px", textTransform: "none", px: 3 }}>
                  Cancel
                </Button>
                <Button variant="contained" startIcon={<ShoppingCartRounded />}
                  onClick={handleCreate}
                  sx={{
                    borderRadius: "50px",
                    background: "linear-gradient(135deg, #7d2ae8, #a855f7)",
                    color: "#fff",
                    textTransform: "none",
                    px: 4,
                    boxShadow: "0 4px 12px rgba(125,42,232,0.35)",
                    "&:hover": { background: "linear-gradient(135deg, #6b21c1, #9333ea)" }
                  }}>
                  Submit Order
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 2, md: 4 } }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  {isAdmin && (
                    <Box sx={{ mb: 4, p: 3, border: "1px solid #e2e8f0", borderRadius: 4, bgcolor: "#fff" }}>
                      <Typography className="dialog-field-label" sx={{ mb: 1.5 }}>Target Outlet *</Typography>
                      <SearchableSelect
                        options={outlets.map((ot) => ({ id: ot.id, name: outletName(ot) }))}
                        value={create.data.outletId}
                        onChange={(id) => setCreate((p) => ({ ...p, data: { ...p.data, outletId: id, items: [{ ...emptyItem }] } }))}
                        placeholder="— Select Outlet —"
                        searchPlaceholder="Search outlets..."
                      />
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#1e293b", fontFamily: "Poppins, sans-serif" }}>Order Items</Typography>
                    <Button variant="text" startIcon={<AddRounded />} onClick={addItem} sx={{ color: "#7d2ae8", fontWeight: 700 }}>Add Item</Button>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {create.data.items.map((item, idx) => (
                      <Box key={idx} sx={{ position: "relative", p: 3, border: "1px solid #e2e8f0", borderRadius: 4, bgcolor: "#fff", transition: "all 0.2s", "&:hover": { borderColor: "#7d2ae8", boxShadow: "0 4px 12px rgba(125,42,232,0.05)" } }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Product *</Typography>
                            <SearchableSelect
                              options={(() => {
                                const selectedOutlet = outlets.find((ot) => String(ot.id) === String(create.data.outletId));
                                const mapped = selectedOutlet?.allProducts || selectedOutlet?.products || [];
                                const pool = mapped.length > 0 ? mapped : products;
                                return pool.map((p) => ({ id: p.id, name: p.name || p.productName || `Product ${p.id}` }));
                              })()}
                              value={item.productId}
                              onChange={(id) => updateItem(idx, "productId", id)}
                              placeholder="Select product"
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Batch (Optional)</Typography>
                            <SearchableSelect
                              options={
                                batches
                                  .filter((b) => String(b.product?.id ?? b.productId) === String(item.productId))
                                  .map((b) => ({ id: b.id, name: `${b.batchNo} (Qty: ${b.quantity})` }))
                              }
                              value={item.batchId}
                              onChange={(id) => updateItem(idx, "batchId", id)}
                              placeholder="FIFO Allocation"
                            />
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Qty *</Typography>
                            <TextField fullWidth size="small" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} inputProps={{ min: 1 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                          </Grid>
                          <Grid item xs={6} sm={2}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Price ₹</Typography>
                            <TextField fullWidth size="small" type="number" value={item.price} onChange={(e) => updateItem(idx, "price", e.target.value)} inputProps={{ min: 0 }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                          </Grid>
                          <Grid item xs={12} sm={1} sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <IconButton onClick={() => removeItem(idx)} color="error" size="small" disabled={create.data.items.length === 1}>
                              <DeleteRounded />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 4, bgcolor: "#f8fafc", borderRadius: 4, border: "1px solid #e2e8f0", height: "fit-content", position: "sticky", top: 24 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1e1b4b", mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                      <ShoppingCartRounded sx={{ color: "#7d2ae8" }} /> Order Summary
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>Destination Outlet</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {outlets.find(o => String(o.id) === String(create.data.outletId))?.outletName || "Not Selected"}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>Total Items</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b" }}>{create.data.items.length}</Typography>
                      </Box>

                      <Box sx={{ p: 2, bgcolor: "#7d2ae8", borderRadius: 3, color: "#fff" }}>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Estimated Value</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                          ₹{create.data.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0).toLocaleString()}
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
          {/* ── Stat Cards ── */}
          <Box className="stat-cards-row">
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <Box className="stat-card" key={key}>
                <Box className="stat-card-icon" sx={{
                  background:
                    key === "PENDING" ? "#fef9c3" :
                      key === "APPROVED" ? "#dcfce7" :
                        key === "REJECTED" ? "#fee2e2" : "#e0f2fe",
                }}>
                  <meta.Icon sx={{
                    color:
                      key === "PENDING" ? "#ca8a04" :
                        key === "APPROVED" ? "#16a34a" :
                          key === "REJECTED" ? "#ef4444" : "#0284c7",
                    fontSize: 22,
                  }} />
                </Box>
                <Box>
                  <Typography className="stat-card-value">{counts[key] || 0}</Typography>
                  <Typography className="stat-card-label">{meta.label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── Table ── */}
          <Box className="table-card">
            <Box className="table-toolbar">
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>
                  All Orders
                </Typography>
                <ExportMenu getData={() => formatOrderData(filtered)} filename="orders" title="Orders Report" backendType="orders" />

                {/* Outlet Filter - Only for Admin */}
                {isAdmin && (
                  <Select
                    size="small" displayEmpty value={filters.outletId}
                    onChange={(e) => setFilters((f) => ({ ...f, outletId: e.target.value }))}
                    sx={{ minWidth: 150, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
                  >
                    <MenuItem value="">All Outlets</MenuItem>
                    {outlets.map((ot) => (
                      <MenuItem key={ot.id} value={ot.id}>{outletName(ot)}</MenuItem>
                    ))}
                  </Select>
                )}

                <ButtonBase
                  onClick={() => setFilters({ status: "", outletId: isAdmin ? "" : userOutletId })}
                  sx={{ color: "#7d2ae8", fontSize: "0.75rem", fontWeight: 600 }}
                >
                  Clear Filters
                </ButtonBase>
              </Box>

              <Box className="table-search">
                <SearchRounded sx={{ fontSize: 18, color: "#7d2ae8", flexShrink: 0 }} />
                <InputBase
                  placeholder="Search order no…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }}
                />
              </Box>
            </Box>

            {/* Dynamic Status Tabs */}
            <Tabs
              value={filters.status}
              onChange={(e, newVal) => setFilters((f) => ({ ...f, status: newVal }))}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                borderBottom: "1px solid #f1f5f9",
                "& .MuiTabs-indicator": { backgroundColor: "#7d2ae8", height: "3px", borderRadius: "10px" },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "Poppins, sans-serif",
                  color: "#64748b",
                  pb: 1.5,
                  pt: 1.5,
                  minWidth: 100,
                  "&.Mui-selected": { color: "#7d2ae8" },
                },
              }}
            >
              <Tab label={`All Orders (${totalElements || filtered.length})`} value="" />
              {Object.entries(STATUS_META).map(([k, v]) => (
                <Tab key={k} label={`${v.label} (${counts[k] || 0})`} value={k} />
              ))}
            </Tabs>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#fafafa" }}>
                    {["Order No", "Outlet", "Items", "Status", "Date", "Actions"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress sx={{ color: "#7d2ae8" }} size={32} />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((o) => {
                      const meta = STATUS_META[o.status] || STATUS_META.PENDING;
                      return (
                        <TableRow
                          key={o.id} hover
                          sx={{ "&:hover": { background: "#faf5ff" }, "&:last-child td": { borderBottom: 0 }, cursor: "pointer" }}
                          onClick={() => setDetail(o)}
                        >
                          <TableCell sx={{ fontWeight: 700, color: "#7d2ae8", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem" }}>
                            {o.orderNo || `ORD-${o.id}`}
                          </TableCell>
                          <TableCell sx={{ color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>
                            {o.outlet?.outletName || "—"}
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>
                            {o.items?.length || 0}
                          </TableCell>
                          <TableCell>
                            <Typography className={`order-status ${meta.cls}`}>{meta.label}</Typography>
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {(isAdmin || isManager) && o.status === "PENDING" && (
                              <Box sx={{ display: "flex", gap: 0.75 }}>
                                <Tooltip title="Approve & Complete">
                                  <IconButton size="small" className="action-btn edit" onClick={() => updateStatus(o.id, "APPROVED")}>
                                    <CheckRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton size="small" className="action-btn delete" onClick={() => updateStatus(o.id, "REJECTED")}>
                                    <ThumbDownRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 1 }}>
                <ButtonBase
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid #e2e8f0", opacity: page === 0 ? 0.5 : 1 }}
                >
                  Previous
                </ButtonBase>
                <Typography sx={{ display: "flex", alignItems: "center", px: 2, fontSize: "0.875rem", fontWeight: 600 }}>
                  Page {page + 1} of {totalPages}
                </Typography>
                <ButtonBase
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  sx={{ px: 2, py: 0.5, borderRadius: 2, border: "1px solid #e2e8f0", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                >
                  Next
                </ButtonBase>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* ── Create Order Dialog (REPLACED) ── */}
      {/* ── Create Order Dialog (REPLACED) ── */}

      {/* ── Order Detail Dialog ── */}
      <Dialog
        open={!!detail} onClose={() => setDetail(null)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
      >
        {detail && (
          <>
            <Box className="order-detail-header" sx={{ position: "relative" }}>
              <IconButton onClick={() => setDetail(null)} size="small" sx={{ position: "absolute", right: 12, top: 12, color: "#fff" }}>
                <CloseRounded />
              </IconButton>
              <Typography className="order-no-badge">{detail.orderNo || `ORD-${detail.id}`}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", mt: 0.5 }}>
                {detail.outlet?.outletName || "Outlet Order"}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", opacity: 0.8 }}>Status: {detail.status}</Typography>
            </Box>

            {/* Timeline */}
            <Box className="order-timeline">
              {TIMELINE.map((step, i) => {
                const done = timelineIdx(detail.status) >= i;
                return (
                  <Box key={step} sx={{ display: "flex", alignItems: "flex-start", flex: 1 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <Box className={`timeline-dot${done ? " done" : ""}`}>{i + 1}</Box>
                      <Typography className={`timeline-label${done ? " done" : ""}`}>
                        {STATUS_META[step]?.label}
                      </Typography>
                    </Box>
                    {i < TIMELINE.length - 1 && (
                      <Box
                        className={`timeline-line${done && timelineIdx(detail.status) > i ? " done" : ""}`}
                        sx={{ mt: "14px", flex: 1 }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>

            <DialogContent>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Product", "Batch", "Qty", "Price"].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#7d2ae8", fontSize: "0.75rem" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detail.items || []).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.product?.name || item.productName || item.productId || "—"}</TableCell>
                      <TableCell sx={{ color: "#64748b" }}>{item.batch?.batchNo || item.batchNo || "FIFO"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.price ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <ButtonBase
                onClick={() => setDetail(null)} disableRipple
                sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}
              >
                Close
              </ButtonBase>
              {(isAdmin || isManager) && (
                <>
                  {detail.status === "PENDING" && (
                    <>
                      <ButtonBase
                        onClick={() => updateStatus(detail.id, "REJECTED")}
                        sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "#fee2e2", color: "#ef4444", fontWeight: 600 }}
                      >
                        Reject
                      </ButtonBase>
                      <ButtonBase
                        onClick={() => updateStatus(detail.id, "APPROVED")}
                        sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontWeight: 600 }}
                      >
                        Approve
                      </ButtonBase>
                    </>
                  )}
                  {detail.status === "APPROVED" && (
                    <ButtonBase
                      onClick={() => updateStatus(detail.id, "COMPLETED")}
                      sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontWeight: 600 }}
                    >
                      Mark Completed
                    </ButtonBase>
                  )}
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "Poppins, sans-serif" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;
