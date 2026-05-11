import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, ButtonBase, InputBase,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, Tooltip,
  CircularProgress, Snackbar, Alert, IconButton, Paper,
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
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import "./Orders.css";
import "../UserManagement/UserManagement.css";

/* ── Status meta ── */
const STATUS_META = {
  PENDING:   { label: "Pending",   cls: "pending",   Icon: PendingRounded },
  APPROVED:  { label: "Approved",  cls: "approved",  Icon: ThumbUpRounded },
  COMPLETED: { label: "Completed", cls: "completed", Icon: LocalShippingRounded },
  REJECTED:  { label: "Rejected",  cls: "rejected",  Icon: ThumbDownRounded },
  CANCELLED: { label: "Cancelled", cls: "cancelled", Icon: CloseRounded },
};

const TIMELINE = ["PENDING", "APPROVED", "COMPLETED"];

const emptyOrder = { outletId: "", items: [] };
const emptyItem  = { productId: "", batchId: "", quantity: 1, price: 0 };

/* ══════════════════════════════════════════
   Orders Page
══════════════════════════════════════════ */
const Orders = () => {
  const { role } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [outlets,  setOutlets]  = useState([]);
  const [products, setProducts] = useState([]);
  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filters,  setFilters]  = useState({ status: "", outletId: "" });
  const [detail,   setDetail]   = useState(null);
  const [create,   setCreate]   = useState({ open: false, data: emptyOrder });
  const [snack,    setSnack]    = useState({ open: false, msg: "", severity: "success" });

  const isAdmin   = role === "ADMIN";
  const isManager = role === "MANAGER";

  /* ── Load — each service fetched independently so one failure
         doesn't wipe out the others ── */
  const load = useCallback(async () => {
    setLoading(true);

    const activeFilters = {};
    if (filters.status)   activeFilters.status   = filters.status;
    if (filters.outletId) activeFilters.outletId = filters.outletId;
    if (search)           activeFilters.orderNo  = search;

    const safe = (promise) => promise.catch((err) => {
      console.error("Fetch error:", err);
      return [];
    });

    const [oData, otData, pData, bData] = await Promise.all([
      safe(orderService.getAll(activeFilters)),
      safe(outletService.getAll  ? outletService.getAll()            : Promise.resolve([])),
      safe(productService.getAll ? productService.getAll(0, 1000)    : Promise.resolve([])),
      safe(batchService.getAll   ? batchService.getAll()             : Promise.resolve([])),
    ]);

    setOrders(Array.isArray(oData) ? oData : []);
    setOutlets(Array.isArray(otData) ? otData : []);
    setProducts(Array.isArray(pData) ? pData : []);
    setBatches(Array.isArray(bData) ? bData : []);

    setLoading(false);
  }, [filters, search]);

  useEffect(() => { load(); }, [load]);

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
      load();
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
      load();
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
        {(role === "USER" || isManager) && (
          <ButtonBase
            onClick={() => setCreate({ open: true, data: { ...emptyOrder, items: [{ ...emptyItem }] } })}
            disableRipple
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(125,42,232,0.35)" }}
          >
            <AddRounded sx={{ fontSize: 18 }} /> Create Order
          </ButtonBase>
        )}
      </Box>

      {/* ── Stat Cards ── */}
      <Box className="stat-cards-row">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <Box className="stat-card" key={key}>
            <Box className="stat-card-icon" sx={{
              background:
                key === "PENDING"   ? "#fef9c3" :
                key === "APPROVED"  ? "#dcfce7" :
                key === "REJECTED"  ? "#fee2e2" : "#e0f2fe",
            }}>
              <meta.Icon sx={{
                color:
                  key === "PENDING"   ? "#ca8a04" :
                  key === "APPROVED"  ? "#16a34a" :
                  key === "REJECTED"  ? "#ef4444" : "#0284c7",
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

            {/* Status Filter */}
            <Select
              size="small" displayEmpty value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              sx={{ minWidth: 120, borderRadius: 2, height: 36, fontSize: "0.8rem", fontFamily: "Poppins, sans-serif" }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label}</MenuItem>
              ))}
            </Select>

            {/* Outlet Filter */}
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

            <ButtonBase
              onClick={() => setFilters({ status: "", outletId: "" })}
              sx={{ color: "#7d2ae8", fontSize: "0.75rem", fontWeight: 600 }}
            >
              Clear
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
                        {(isAdmin || isManager) && (
                          <Box sx={{ display: "flex", gap: 0.75 }}>
                            {o.status === "PENDING" && (
                              <>
                                <Tooltip title="Approve">
                                  <ButtonBase className="action-btn edit" disableRipple onClick={() => updateStatus(o.id, "APPROVED")}>
                                    <ThumbUpRounded sx={{ fontSize: 14 }} />
                                  </ButtonBase>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <ButtonBase className="action-btn delete" disableRipple onClick={() => updateStatus(o.id, "REJECTED")}>
                                    <ThumbDownRounded sx={{ fontSize: 14 }} />
                                  </ButtonBase>
                                </Tooltip>
                              </>
                            )}
                            {o.status === "APPROVED" && (
                              <Tooltip title="Complete">
                                <ButtonBase className="action-btn edit" disableRipple onClick={() => updateStatus(o.id, "COMPLETED")}>
                                  <CheckRounded sx={{ fontSize: 14 }} />
                                </ButtonBase>
                              </Tooltip>
                            )}
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
      </Box>

      {/* ── Create Order Dialog ── */}
      <Dialog
        open={create.open}
        onClose={() => setCreate({ open: false, data: emptyOrder })}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle className="user-dialog-title" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Create New Order
          <IconButton onClick={() => setCreate({ open: false, data: emptyOrder })} size="small" sx={{ color: "#64748b" }}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography className="dialog-field-label">Select Outlet *</Typography>
            <SearchableSelect
              options={outlets.map((ot) => ({ id: ot.id, name: outletName(ot) }))}
              value={create.data.outletId}
              onChange={(id) => setCreate((p) => ({ ...p, data: { ...p.data, outletId: id } }))}
              placeholder="— Select Outlet —"
              searchPlaceholder="Search outlets..."
            />
          </Box>

          <Typography sx={{ fontWeight: 700, mb: 1, fontSize: "0.9rem", color: "#1e1b4b" }}>Order Items</Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {create.data.items.map((item, idx) => (
              <Box
                key={idx}
                sx={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1.2fr auto", gap: 1.5, alignItems: "center", p: 2, border: "1px solid #e2e8f0", borderRadius: 3 }}
              >
                <Box>
                  <Typography className="dialog-field-label">Product *</Typography>
                  <SearchableSelect
                    options={products}
                    value={item.productId}
                    onChange={(id) => updateItem(idx, "productId", id)}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </Box>
                <Box>
                  <Typography className="dialog-field-label">Batch (Optional)</Typography>
                  <SearchableSelect
                    options={
                      batches
                        .filter((b) => String(b.product?.id ?? b.productId) === String(item.productId))
                        .map((b) => ({ id: b.id, name: `${b.batchNo} (Qty: ${b.quantity})` }))
                    }
                    value={item.batchId}
                    onChange={(id) => updateItem(idx, "batchId", id)}
                    placeholder="FIFO Allocation"
                    searchPlaceholder="Search..."
                  />
                </Box>
                <Box>
                  <Typography className="dialog-field-label">Qty *</Typography>
                  <TextField
                    fullWidth size="small" type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    inputProps={{ min: 1 }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Typography className="dialog-field-label">Price ₹</Typography>
                  <TextField
                    fullWidth size="small" type="number"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                    inputProps={{ min: 0 }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Box>
                <IconButton onClick={() => removeItem(idx)} color="error" sx={{ mt: 2 }}>
                  <DeleteRounded />
                </IconButton>
              </Box>
            ))}
          </Box>

          <ButtonBase
            onClick={addItem}
            sx={{ mt: 2, color: "#7d2ae8", fontWeight: 600, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}
          >
            + Add Another Item
          </ButtonBase>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <ButtonBase
            onClick={() => setCreate({ open: false, data: emptyOrder })}
            sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}
          >
            Cancel
          </ButtonBase>
          <ButtonBase
            onClick={handleCreate}
            sx={{ px: 2.5, py: 1, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontWeight: 600, boxShadow: "0 4px 12px rgba(125,42,232,0.35)" }}
          >
            Create Order
          </ButtonBase>
        </DialogActions>
      </Dialog>

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
