import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, ButtonBase, InputBase,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
  FormControl, Select, MenuItem, Tooltip,
  CircularProgress, Snackbar, Alert,
} from "@mui/material";
import {
  SearchRounded, SwapHorizRounded, WarehouseRounded,
  TrendingUpRounded, TrendingDownRounded, CheckRounded,
} from "@mui/icons-material";
import { stockService } from "../../services/stockService";
import "./Stock.css";
import "../UserManagement/UserManagement.css";

/* ── Stock level helper ── */
const stockLevel = (qty, max = 200) => {
  const pct = Math.min((qty / max) * 100, 100);
  if (pct > 60)  return { cls: "high",   label: "Good" };
  if (pct > 25)  return { cls: "medium", label: "Low" };
  return           { cls: "low",    label: "Critical" };
};

const emptyTransfer = { outletId: "", productId: "", batchId: "", quantity: "" };

/* ══════════════════════════════════════════
   Stock Management Page
══════════════════════════════════════════ */
const Stock = () => {
  const [stock,    setStock]    = useState([]);
  const [txns,     setTxns]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState("stock"); // "stock" | "history"
  const [transfer, setTransfer] = useState({ open: false, data: emptyTransfer });
  const [snack,    setSnack]    = useState({ open: false, msg: "", severity: "success" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        stockService.getAll(),
        stockService.getTransactions(),
      ]);
      const sData = sRes.data || [];
      const tData = tRes.data || [];
      setStock(Array.isArray(sData) ? sData : sData?.content || []);
      setTxns(Array.isArray(tData) ? tData : tData?.content || []);
    } catch { setStock([]); setTxns([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toast = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const filteredStock = stock.filter((s) =>
    [s.productName, s.outletName, s.batchNo].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const handleTransfer = async () => {
    try {
      await stockService.transfer(transfer.data);
      toast("Stock transferred successfully");
      setTransfer({ open: false, data: emptyTransfer });
      load();
    } catch (err) { 
      const msg = err.response?.data?.message || "Transfer failed";
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
          <Typography className="page-title">Stock Management</Typography>
          <Typography className="page-subtitle">Monitor and transfer outlet stock</Typography>
        </Box>
        <ButtonBase onClick={() => setTransfer({ open: true, data: emptyTransfer })} disableRipple
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.2, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 4px 16px rgba(125,42,232,0.35)" }}>
          <SwapHorizRounded sx={{ fontSize: 18 }} /> Transfer Stock
        </ButtonBase>
      </Box>

      {/* Stat Cards */}
      <Box className="stat-cards-row">
        {[
          { label: "Stock Entries",  value: stock.length,  bg: "#f5f0ff", color: "#7d2ae8", Icon: WarehouseRounded },
          { label: "Total IN",       value: totalIn,        bg: "#dcfce7", color: "#16a34a", Icon: TrendingUpRounded },
          { label: "Total OUT",      value: totalOut,       bg: "#fee2e2", color: "#ef4444", Icon: TrendingDownRounded },
          { label: "Transactions",   value: txns.length,    bg: "#e0f2fe", color: "#0284c7", Icon: SwapHorizRounded },
        ].map(({ label, value, bg, color, Icon }) => (
          <Box className="stat-card" key={label}>
            <Box className="stat-card-icon" sx={{ background: bg }}><Icon sx={{ color, fontSize: 22 }} /></Box>
            <Box>
              <Typography className="stat-card-value">{value}</Typography>
              <Typography className="stat-card-label">{label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Tab Row */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {["stock", "history"].map((t) => (
          <ButtonBase key={t} onClick={() => setTab(t)} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", fontFamily: "Poppins, sans-serif", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.2s", background: tab === t ? "linear-gradient(135deg,#7d2ae8,#a855f7)" : "#f5f0ff", color: tab === t ? "#fff" : "#7d2ae8", boxShadow: tab === t ? "0 4px 12px rgba(125,42,232,0.3)" : "none" }}>
            {t === "stock" ? "Outlet Stock" : "Transaction History"}
          </ButtonBase>
        ))}
      </Box>

      {/* Table */}
      <Box className="table-card">
        <Box className="table-toolbar">
          <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>
            {tab === "stock" ? "Current Stock" : "Transaction History"}
          </Typography>
          <Box className="table-search">
            <SearchRounded sx={{ fontSize: 18, color: "#7d2ae8", flexShrink: 0 }} />
            <InputBase placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", color: "#1e1b4b" }} />
          </Box>
        </Box>

        <TableContainer>
          {tab === "stock" ? (
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#faf5ff" }}>
                  {["Outlet", "Product", "Batch", "Available", "Reserved", "Level"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#7d2ae8", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress sx={{ color: "#7d2ae8" }} size={32} /></TableCell></TableRow>
                ) : filteredStock.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "#94a3b8", fontFamily: "Poppins, sans-serif" }}>No stock found</TableCell></TableRow>
                ) : (
                  filteredStock.map((s) => {
                    const lvl = stockLevel(s.availableQty);
                    return (
                      <TableRow key={s.id} hover sx={{ "&:hover": { background: "#faf5ff" } }}>
                        <TableCell sx={{ fontWeight: 600, color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.outletName || s.outletId}</TableCell>
                        <TableCell sx={{ color: "#1e1b4b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.productName || s.productId}</TableCell>
                        <TableCell sx={{ color: "#7d2ae8", fontWeight: 600, fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.batchNo || s.batchId}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e1b4b", fontFamily: "Poppins, sans-serif" }}>{s.availableQty}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif" }}>{s.reservedQty || 0}</TableCell>
                        <TableCell>
                          <Box className="stock-level">
                            <Box className="stock-level-bar">
                              <Box className={`stock-level-fill ${lvl.cls}`} sx={{ width: `${Math.min((s.availableQty / 200) * 100, 100)}%` }} />
                            </Box>
                            <Typography className={`stock-level-text ${lvl.cls}`}>{lvl.label}</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#faf5ff" }}>
                  {["Type", "Product", "Batch", "Outlet", "Qty", "By", "Date"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: "#7d2ae8", fontFamily: "Poppins, sans-serif", fontSize: "0.78rem", py: 1.5 }}>{h}</TableCell>
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
                    <TableRow key={t.id} hover sx={{ "&:hover": { background: "#faf5ff" } }}>
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
      </Box>

      {/* Transfer Dialog */}
      <Dialog open={transfer.open} onClose={() => setTransfer({ open: false, data: emptyTransfer })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
        <DialogTitle className="transfer-dialog-title">Transfer Stock to Outlet</DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { key: "outletId",   label: "Outlet ID" },
              { key: "productId",  label: "Product ID" },
              { key: "batchId",    label: "Batch ID" },
              { key: "quantity",   label: "Quantity",  type: "number" },
            ].map(({ key, label, type = "text" }) => (
              <Box key={key}>
                <Typography className="dialog-field-label">{label}</Typography>
                <TextField fullWidth size="small" type={type} placeholder={`Enter ${label}`}
                  value={transfer.data[key]}
                  onChange={(e) => setTransfer((t) => ({ ...t, data: { ...t.data, [key]: e.target.value } }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: "Poppins, sans-serif" } }} />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <ButtonBase onClick={() => setTransfer({ open: false, data: emptyTransfer })} disableRipple
            sx={{ px: 2.5, py: 1, borderRadius: "50px", border: "1.5px solid #e2e8f0", color: "#64748b", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600 }}>Cancel</ButtonBase>
          <ButtonBase onClick={handleTransfer} disableRipple
            sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2.5, py: 1, borderRadius: "50px", background: "linear-gradient(135deg,#7d2ae8,#a855f7)", color: "#fff", fontSize: "0.875rem", fontFamily: "Poppins, sans-serif", fontWeight: 600, boxShadow: "0 4px 12px rgba(125,42,232,0.35)" }}>
            <CheckRounded sx={{ fontSize: 16 }} /> Transfer
          </ButtonBase>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ fontFamily: "Poppins, sans-serif" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Stock;
