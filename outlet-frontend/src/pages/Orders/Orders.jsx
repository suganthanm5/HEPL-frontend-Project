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
import { styled } from "@mui/material/styles";
import {
  AddRounded, SearchRounded, EditRounded,
  CheckRounded, ShoppingCartRounded, PendingRounded,
  ThumbUpRounded, ThumbDownRounded, LocalShippingRounded,
  DeleteRounded, CloseRounded, VisibilityRounded,
  InventoryRounded, PendingActionsRounded, CalendarMonthRounded,
  ArrowBackRounded
} from "@mui/icons-material";
import { orderService } from "../../services/orderService";
import { outletService } from "../../services/outletService";
import { productService } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { getCookie } from "../../utils/cookieUtils";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import ExportMenu from "../../components/ExportMenu/ExportMenu";
import TypingText from "../../components/TypingText";
import { formatOrderData } from "../../utils/exportUtils";
import "./Orders.css";
import "../UserManagement/UserManagement.css";



const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: "all 0.2s ease",
  backgroundColor: "#faf5ff",
  "&:hover": {
    backgroundColor: "#f3e8ff",
    "& td": { borderColor: "#c7d2fe" },
  },
  "& td": {
    borderBottom: "1px solid #f1f5f9",
    padding: "16px 12px",
    transition: "border-color 0.2s ease",
  },
}));

const STATUS_META = {
  PENDING: { label: "Pending", cls: "pending", Icon: PendingRounded },
  PARTIALLY_APPROVED: { label: "Partially Approved", cls: "pending", Icon: PendingRounded },
  APPROVED: { label: "Approved", cls: "approved", Icon: ThumbUpRounded },
  COMPLETED: { label: "Completed", cls: "completed", Icon: LocalShippingRounded },
  REJECTED: { label: "Rejected", cls: "rejected", Icon: ThumbDownRounded },
  CANCELLED: { label: "Cancelled", cls: "cancelled", Icon: CloseRounded },
};

const TIMELINE = ["PENDING", "PARTIALLY_APPROVED", "APPROVED", "COMPLETED"];

const emptyOrder = { outletId: "", items: [] };
const emptyItem = { productId: "", quantity: 1, price: 0 };

/* ══════════════════════════════════════════
   Orders Page
══════════════════════════════════════════ */
const Orders = () => {
  const { user, role } = useAuth();
  const userOutletId = user?.outletId || getCookie("outletId") || "";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isOutletManager = role === "OUTLET_MANAGER";

  const [filters, setFilters] = useState({ status: "", outletId: isAdmin ? "" : userOutletId });
  const [detail, setDetail] = useState(null);
  const [isFormView, setIsFormView] = useState(false);
  const [create, setCreate] = useState({ open: false, data: emptyOrder });
  const [delDialog, setDelDialog] = useState({ open: false, id: null, title: "" });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem('itemsPerPage') || '10', 10));
  const [totalPages, setTotalPages] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [products, setProducts] = useState([]);
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
  const loadOrders = useCallback(async (signal) => {
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

      const oData = await orderService.getAll(activeFilters, signal);
      if (oData && oData.content) {
        setOrders(oData.content);
        setTotalPages(oData.totalPages);
        setTotalElements(oData.totalElements);
      } else {
        setOrders(extractArr(oData));
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
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

    const [otData, pData] = await Promise.all([
      safe(outletService.getOutlets ? outletService.getOutlets(0, 1000) : Promise.resolve([])),
      safe(productService.getProducts ? productService.getProducts(0, 1000) : Promise.resolve([])),
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
  }, []);

  useEffect(() => { loadMetadata(); }, [loadMetadata]);
  
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadOrders(controller.signal);
    }, 800);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadOrders]);

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

  /* ── Delete order ── */
  const handleDelete = async () => {
    try {
      await orderService.delete(delDialog.id);
      toast("Order deleted successfully");
      setDelDialog({ open: false, id: null, title: "" });
      loadOrders();
    } catch (err) {
      toast(err.response?.data?.message || "Delete failed", "error");
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

    if (key === "productId") {
      const p = products.find((prod) => String(prod.id) === String(val));
      if (p) newItems[idx].price = p.sellingPrice ?? 0;
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
          <Typography className="page-title">
            <TypingText text="Orders" />
          </Typography>
          <Typography className="page-subtitle">Track and manage batch orders</Typography>
        </Box>
        {(isAdmin || isManager || (role === "USER" || role === "OUTLET_MANAGER")) && (
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
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(125,42,232,0.35)" }}
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b", fontFamily: "inherit" }}>
                    Create New Order
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "inherit" }}>
                    Select an outlet and add items to create a supply order
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
                    <Box sx={{ mb: 4, p: 3, border: "1px solid #e2e8f0", borderRadius: 4, bgcolor: "#fff" }}>
                      <Typography className="dialog-field-label" sx={{ mb: 1.5 }}>Target Outlet *</Typography>
                      <SearchableSelect
                        options={
                          (isAdmin || isManager) 
                            ? outlets.map((ot) => ({ id: ot.id, name: outletName(ot) }))
                            : outlets.filter((ot) => String(ot.id) === String(userOutletId)).map((ot) => ({ id: ot.id, name: outletName(ot) }))
                        }
                        value={create.data.outletId}
                        onChange={(id) => setCreate((p) => ({ ...p, data: { ...p.data, outletId: id, items: [{ ...emptyItem }] } }))}
                        placeholder={userOutletId && !isAdmin && !isManager ? "Assigned Outlet" : "— Select Outlet —"}
                        searchPlaceholder="Search outlets..."
                      />
                    </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#1e293b", fontFamily: "inherit" }}>Order Items</Typography>
                    <Button variant="text" startIcon={<AddRounded />} onClick={addItem} sx={{ color: "#7d2ae8", fontWeight: 700 }}>Add Item</Button>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {create.data.items.map((item, idx) => (
                      <Box key={idx} sx={{ position: "relative", p: 3, border: "1px solid #e2e8f0", borderRadius: 4, bgcolor: "#fff", transition: "all 0.2s", "&:hover": { borderColor: "#7d2ae8", boxShadow: "0 4px 12px rgba(125,42,232,0.05)" } }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={5}>
                            <Typography className="dialog-field-label" sx={{ mb: 0.5 }}>Product *</Typography>
                            <SearchableSelect
                              options={(() => {
                                const selectedOutlet = outlets.find(o => String(o.id) === String(create.data.outletId));
                                if (selectedOutlet && selectedOutlet.allProducts && selectedOutlet.allProducts.length > 0) {
                                  return selectedOutlet.allProducts.map((p) => ({ id: p.id, name: p.name || p.productName || `Product ${p.id}` }));
                                }
                                return products.map((p) => ({ id: p.id, name: p.name || p.productName || `Product ${p.id}` }));
                              })()}
                              value={item.productId}
                              onChange={(id) => updateItem(idx, "productId", id)}
                              placeholder="Select product"
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
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
      ) : !detail && (
        <>
          {/* ── Stat Cards ── */}
          <Box className="stat-cards-row">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const theme = 
                key === "PENDING" || key === "PARTIALLY_APPROVED" ? "orange" :
                key === "APPROVED" ? "green" :
                key === "REJECTED" ? "rose" :
                key === "COMPLETED" ? "blue" : "indigo";
              return (
                <Box className={`stat-card stat-${theme}`} key={key}>
                  <Box className="stat-card-icon" sx={{
                    background:
                      key === "PENDING" || key === "PARTIALLY_APPROVED" ? "#fef9c3" :
                        key === "APPROVED" ? "#dcfce7" :
                          key === "REJECTED" ? "#fee2e2" : "#e0f2fe",
                  }}>
                    <meta.Icon sx={{
                      color:
                        key === "PENDING" || key === "PARTIALLY_APPROVED" ? "#ca8a04" :
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
              );
            })}
          </Box>

          {/* ── Table ── */}
          <Box className="table-card">
            <Box className="table-toolbar">
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "inherit" }}>
                  All Orders
                </Typography>
                <ExportMenu getData={() => formatOrderData(filtered)} filename="orders" title="Orders Report" backendType="orders" />

                {/* Outlet Filter - Only for Admin */}
                {isAdmin && (
                  <Select
                    size="small" displayEmpty value={filters.outletId}
                    onChange={(e) => setFilters((f) => ({ ...f, outletId: e.target.value }))}
                    sx={{ minWidth: 150, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "inherit" }}
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
                  sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "inherit", color: "#1e1b4b" }}
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
                  fontFamily: "inherit",
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
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontFamily: "inherit", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 1.5 }}>
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
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "inherit" }}>
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
                          <TableCell sx={{ fontWeight: 700, color: "#7d2ae8", fontFamily: "inherit", fontSize: "0.875rem" }}>
                            {o.orderNo || `ORD-${o.id}`}
                          </TableCell>
                          <TableCell sx={{ color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "inherit" }}>
                            {o.outlet?.outletName || "—"}
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "inherit" }}>
                            {o.items?.length || 0}
                          </TableCell>
                          <TableCell>
                            <Typography className={`order-status ${meta.cls}`}>
                              <meta.Icon sx={{ fontSize: 16 }} /> {meta.label}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "inherit" }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: "flex", gap: 0.75 }}>
                              <Tooltip title="View Details">
                                <IconButton size="small" className="action-btn edit" onClick={() => setDetail(o)}>
                                  <VisibilityRounded sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title={o.status === "PENDING" ? "Edit Order" : "Cannot edit processed orders"}>
                                <span>
                                  <IconButton size="small" className="action-btn edit" disabled={o.status !== "PENDING"} onClick={() => {
                                    setCreate({ open: true, data: { ...o } });
                                    setIsFormView(true);
                                  }}>
                                    <EditRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              {(isAdmin || isManager) && (o.status === "PENDING" || o.status === "PARTIALLY_APPROVED") && (
                                <>
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
                                </>
                              )}
                              
                              {o.status === "APPROVED" && (isAdmin || isManager || isOutletManager) && (
                                <Tooltip title="Mark Completed (Goods Received)">
                                  <IconButton size="small" className="action-btn edit" onClick={() => updateStatus(o.id, "COMPLETED")}>
                                    <CheckRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title={o.status === "PENDING" || isAdmin ? "Delete Order" : "Cannot delete processed orders"}>
                                <span>
                                  <IconButton size="small" className="action-btn delete" disabled={!(o.status === "PENDING" || isAdmin)} onClick={() => setDelDialog({ open: true, id: o.id, title: o.orderNo || `ORD-${o.id}` })}>
                                    <DeleteRounded sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
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

      {/* ── Order Detail Full View ── */}
      {detail && (
        <Box className="animate-fade-in">
          <Paper elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.08)", mb: 4 }}>
            {/* Elegant Header */}
            <Box sx={{ 
              background: "linear-gradient(135deg, #111827 0%, #374151 100%)", 
              color: "#fff", 
              p: { xs: 3, md: 5 }, 
              position: "relative" 
            }}>
              <Box sx={{ mb: 3 }}>
                <ButtonBase 
                  onClick={() => setDetail(null)} disableRipple
                  sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.7)", transition: "all 0.2s", "&:hover": { color: "#fff", transform: "translateX(-4px)" }, fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.5px" }}
                >
                  <ArrowBackRounded fontSize="small" /> BACK TO ORDERS
                </ButtonBase>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Typography sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, background: "rgba(255,255,255,0.15)", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "1px", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {detail.orderNo || `ORD-${detail.id}`}
                </Typography>
                <Typography sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, background: detail.status === "COMPLETED" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)", color: detail.status === "COMPLETED" ? "#6ee7b7" : "#fcd34d", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                  {detail.status}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: "2rem", fontFamily: "inherit", mt: 1, textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
                {detail.outlet?.outletName || "Outlet Order"}
              </Typography>
            </Box>

            {/* Timeline */}
            <Box sx={{ display: "flex", p: { xs: 3, md: 5 }, bgcolor: "#fafafa", borderBottom: "1px solid #f1f5f9", overflowX: "auto" }}>
              {TIMELINE.map((step, i) => {
                const done = timelineIdx(detail.status) >= i;
                const active = timelineIdx(detail.status) === i;
                const StepIcon = STATUS_META[step]?.Icon || CheckRounded;
                return (
                  <Box key={step} sx={{ display: "flex", alignItems: "center", flex: 1, position: "relative", minWidth: "120px" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", zIndex: 2 }}>
                      <Box sx={{ 
                        width: 56, height: 56, borderRadius: "16px", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: done ? "linear-gradient(135deg, #111827, #374151)" : "#fff",
                        color: done ? "#fff" : "#cbd5e1",
                        border: done ? "none" : "2px dashed #cbd5e1",
                        boxShadow: done ? "0 8px 20px rgba(17,24,39,0.3)" : "none",
                        transition: "all 0.3s ease",
                        transform: active ? "scale(1.1)" : "scale(1)"
                      }}>
                        <StepIcon sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ 
                        fontSize: "0.8rem", fontWeight: 800, mt: 2, textTransform: "uppercase", letterSpacing: "0.5px",
                        color: active ? "#111827" : done ? "#475569" : "#94a3b8" 
                      }}>
                        {STATUS_META[step]?.label}
                      </Typography>
                    </Box>
                    {i < TIMELINE.length - 1 && (
                      <Box sx={{ 
                        position: "absolute", top: 28, left: "50%", width: "100%", height: "4px",
                        background: done && timelineIdx(detail.status) > i ? "linear-gradient(90deg, #111827, #374151)" : "#e2e8f0",
                        transform: "translateY(-50%)", zIndex: 1, borderRadius: "2px"
                      }} />
                    )}
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ p: { xs: 3, md: 5 }, position: "relative" }}>
              <Typography sx={{ fontWeight: 800, color: "#1e1b4b", fontSize: "1.2rem", mb: 2, fontFamily: "inherit" }}>Order Items</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden", mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      {["Product Details", "Quantity", "Price", "Total"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e2e8f0" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detail.items || []).map((item, idx) => {
                      const matchedProduct = products.find(p => String(p.id) === String(item.productId));
                      const displayImg = item.image || item.product?.imageUrl || item.product?.image || matchedProduct?.image;
                      
                      return (
                      <StyledTableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b", fontSize: "1rem" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: "10px", overflow: "hidden", bgcolor: "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                              {displayImg ? (
                                <img src={displayImg} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <Typography sx={{ color: "#cbd5e1", fontSize: "0.7rem", fontWeight: 700 }}>IMG</Typography>
                              )}
                            </Box>
                            <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.95rem" }}>
                              {item.product?.name || item.productName || item.productId || "—"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: "#4f46e5", display: "inline-block", bgcolor: "#eef2ff", px: 2, py: 0.5, borderRadius: "8px", fontSize: "0.95rem" }}>
                            {item.quantity}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b", ml: 1, fontWeight: 600 }}>
                            (Fulfilled: {item.fulfilledQuantity || 0})
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#64748b", fontSize: "0.95rem" }}>₹{item.price ?? "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#10b981", fontSize: "1rem" }}>₹{(item.quantity * (item.price || 0)).toLocaleString()}</TableCell>
                      </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, pt: 3, borderTop: "1px solid #e2e8f0" }}>
                <ButtonBase
                  onClick={() => setDetail(null)} disableRipple
                  sx={{ px: 4, py: 1.5, borderRadius: "50px", border: "2px solid #e2e8f0", color: "#64748b", fontWeight: 700, transition: "all 0.2s", "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" } }}
                >
                  Back to Orders
                </ButtonBase>
                {(isAdmin || isManager) && (detail.status === "PENDING" || detail.status === "PARTIALLY_APPROVED") && (
                  <>
                    <ButtonBase
                      onClick={() => updateStatus(detail.id, "REJECTED")}
                      sx={{ px: 4, py: 1.5, borderRadius: "50px", background: "#fee2e2", color: "#ef4444", fontWeight: 700, transition: "all 0.2s", "&:hover": { background: "#fca5a5", color: "#b91c1c" } }}
                    >
                      Reject Order
                    </ButtonBase>
                    <ButtonBase
                      onClick={() => updateStatus(detail.id, "APPROVED")}
                      sx={{ px: 5, py: 1.5, borderRadius: "50px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", fontWeight: 700, boxShadow: "0 4px 14px rgba(79,70,229,0.3)", transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(79,70,229,0.4)" } }}
                    >
                      Approve Order
                    </ButtonBase>
                  </>
                )}
                {detail.status === "APPROVED" && (isAdmin || isManager || isOutletManager) && (
                  <ButtonBase
                    onClick={() => updateStatus(detail.id, "COMPLETED")}
                    sx={{ px: 5, py: 1.5, borderRadius: "50px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 700, boxShadow: "0 4px 14px rgba(16,185,129,0.3)", transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(16,185,129,0.4)" } }}
                  >
                    Mark as Completed
                  </ButtonBase>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, id: null, title: "" })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "#1e1b4b" }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "inherit", color: "#64748b", fontSize: "0.9rem" }}>
            Are you sure you want to delete <strong>{delDialog.title}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <ButtonBase onClick={() => setDelDialog({ open: false, id: null, title: "" })} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontSize: "0.875rem", fontFamily: "inherit", fontWeight: 600 }}>
            Cancel
          </ButtonBase>
          <ButtonBase onClick={handleDelete} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "#ef4444", color: "#fff", fontSize: "0.875rem", fontFamily: "inherit", fontWeight: 600, boxShadow: "0 4px 12px rgba(239,68,68,0.35)" }}>
            Delete
          </ButtonBase>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "inherit" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;

