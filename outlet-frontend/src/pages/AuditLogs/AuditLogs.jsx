import { useEffect, useState, useCallback } from "react";
import API from "../../api/apiClient";
import TypingText from "../../components/TypingText";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Tooltip,
  Select,
  MenuItem,
  Pagination,
  Chip,
  Skeleton,
  IconButton,
  InputBase,
  Alert,
  FormControl,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";

import "../UserManagement/UserManagement.css";
import ExportMenu from "../../components/ExportMenu/ExportMenu";

const PAGE_SIZES = [5, 10, 20, 50];

// Color mapping for actions
const getActionChipProps = (action) => {
  const act = (action || "").toUpperCase();
  const displayLabel = act.replace(/_/g, " ");
  if (act.includes("DELETE")) {
    return { label: displayLabel, bgcolor: "#fee2e2", color: "#ef4444" };
  }
  if (act.includes("CREATE")) {
    return { label: displayLabel, bgcolor: "#dbeafe", color: "#2563eb" };
  }
  if (act.includes("UPDATE")) {
    return { label: displayLabel, bgcolor: "#fef3c7", color: "#d97706" };
  }
  if (act.includes("LOGIN") && !act.includes("FAILED")) {
    return { label: displayLabel, bgcolor: "#dcfce7", color: "#16a34a" };
  }
  if (act.includes("FAILED")) {
    return { label: displayLabel, bgcolor: "#fee2e2", color: "#dc2626" };
  }
  if (act.includes("IMPERSONATE")) {
    return { label: displayLabel, bgcolor: "#f3e8ff", color: "#7c3aed" };
  }
  if (act.includes("REGISTER")) {
    return { label: displayLabel, bgcolor: "#e0f7fa", color: "#00acc1" };
  }
  return { label: displayLabel, bgcolor: "#f1f5f9", color: "#475569" };
};

// Filter categories
const ACTION_CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "AUTH", label: "Authentication & Impersonation" },
  { value: "USER_MGMT", label: "User Management" },
  { value: "PRODUCT_CATALOG", label: "Product & Catalog" },
  { value: "OUTLETS_LOCATIONS", label: "Outlets & Locations" },
  { value: "ORDERS_STOCK", label: "Orders & Stock Transfers" }
];

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(parseInt(localStorage.getItem("auditItemsPerPage") || "20", 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreLogId, setRestoreLogId] = useState(null);
  const [restoreLogAction, setRestoreLogAction] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const handleRestore = async (logId) => {
    setRestoring(true);
    try {
      await API.post(`/api/audit-logs/${logId}/restore`);
      setToast({ open: true, msg: "Resource restored successfully!", severity: "success" });
      fetchLogs();
    } catch (err) {
      console.error("Restore failed:", err);
      const errorMsg = err.response?.data?.message || "Restore operation failed.";
      setToast({ open: true, msg: errorMsg, severity: "error" });
    } finally {
      setRestoring(false);
      setRestoreConfirmOpen(false);
    }
  };

  const fetchLogs = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      let queryParam = search.trim();
      let finalSearch = queryParam;
      if (category !== "ALL") {
        if (category === "AUTH") finalSearch = finalSearch ? `${finalSearch} USER_` : "USER_";
        else if (category === "USER_MGMT") finalSearch = finalSearch ? `${finalSearch} USER` : "USER";
        else if (category === "PRODUCT_CATALOG") finalSearch = finalSearch ? `${finalSearch} PRODUCT` : "PRODUCT";
        else if (category === "OUTLETS_LOCATIONS") finalSearch = finalSearch ? `${finalSearch} OUTLET` : "OUTLET";
        else if (category === "ORDERS_STOCK") finalSearch = finalSearch ? `${finalSearch} ORDER` : "ORDER";
      }

      const res = await API.get("/api/audit-logs", {
        params: {
          search: finalSearch,
          page: page - 1,
          size: pageSize,
          sortBy: "createdAt",
          direction: "desc"
        },
        signal
      });

      const data = res.data?.data || res.data;
      if (data) {
        setLogs(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      console.error("Failed to load audit logs:", err);
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [search, category, page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(() => {
      fetchLogs(controller.signal);
    }, 400);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setPage(1);
    localStorage.setItem("auditItemsPerPage", newSize);
  };

  const safePage = Math.min(page, totalPages || 1);
  const start = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalElements);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Page Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e293b", mb: 0.25 }}>
            <TypingText text="Audit Logs" />
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
            Monitor admin operations, login events, and database mutations
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Tooltip title="Refresh Logs">
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              size="small"
              sx={{
                color: "#7d2ae8",
                bgcolor: "#f5f0ff",
                "&:hover": { bgcolor: "#ede9fe" }
              }}
            >
              {loading ? <CircularProgress size={16} sx={{ color: "#7d2ae8" }} /> : <RefreshRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Stat Cards ── */}
      <Box className="stat-cards-row">
        {[
          { label: "Total Logs Recorded", value: totalElements, icon: HistoryRoundedIcon, theme: "purple", color: "#7d2ae8", bg: "#f3e8ff" },
          { label: "This Page", value: logs.length, icon: LayersRoundedIcon, theme: "blue", color: "#0284c7", bg: "#e0f2fe" },
          { label: "Access Level", value: "ADMIN ONLY", icon: SecurityRoundedIcon, theme: "green", color: "#10b981", bg: "#dcfce7" },
        ].map((s, i) => (
          <Box className={`stat-card stat-${s.theme}`} key={i}>
            <Box className="stat-card-icon" sx={{ background: s.bg }}>
              <s.icon sx={{ fontSize: 22, color: s.color }} />
            </Box>
            <Box>
              <Typography className="stat-card-value">{loading ? "—" : s.value}</Typography>
              <Typography className="stat-card-label">{s.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Error Banner ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontFamily: "inherit" }}>
          {error}
        </Alert>
      )}

      {/* ── Table Card ── */}
      <Box className="table-card" sx={{ bgcolor: "#fff", border: "1px solid rgba(125,42,232,0.08)", borderRadius: 3, mb: 2 }}>
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, borderBottom: "1px solid rgba(125,42,232,0.07)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, color: "#1e1b4b", fontFamily: "inherit" }}>Operational Audit Trail</Typography>
            <Chip label={totalElements} size="small" sx={{ bgcolor: "#f3e8ff", color: "#7d2ae8", fontWeight: 700, fontFamily: "inherit", height: 20, fontSize: "0.7rem" }} />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <ExportMenu backendType="audit-logs" filename="audit_logs" title="Audit Logs Report" />

            {/* Category Filter */}
            <FormControl size="small" sx={{ width: 180 }}>
              <Select
                value={category}
                onChange={handleCategoryChange}
                sx={{
                  fontFamily: "inherit",
                  fontSize: "0.8rem",
                  borderRadius: 2,
                  "& .MuiSelect-select": { py: 0.5, px: 1.5 },
                  bgcolor: "#fff"
                }}
              >
                {ACTION_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value} sx={{ fontFamily: "inherit", fontSize: "0.85rem" }}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Page Size Select */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ color: "#64748b", fontSize: "0.8rem", fontFamily: "inherit", whiteSpace: "nowrap" }}>Show</Typography>
              <Select value={pageSize} size="small"
                onChange={handlePageSizeChange}
                sx={{ fontFamily: "inherit", fontSize: "0.8rem", borderRadius: 2, "& .MuiSelect-select": { py: 0.5, px: 1.5 } }}>
                {PAGE_SIZES.map(n => <MenuItem key={n} value={n} sx={{ fontFamily: "inherit", fontSize: "0.85rem" }}>{n}</MenuItem>)}
              </Select>
            </Box>

            {/* Search */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f5f0ff", border: "1.5px solid transparent", borderRadius: "50px", px: 2, py: 0.8, width: 240, transition: "all 0.3s", "&:focus-within": { borderColor: "#7d2ae8", bgcolor: "#fff", boxShadow: "0 0 0 3px rgba(125,42,232,0.1)" } }}>
              <SearchRoundedIcon sx={{ fontSize: 17, color: "#7d2ae8", flexShrink: 0 }} />
              <InputBase placeholder="Search logs…" value={search}
                onChange={handleSearchChange}
                sx={{ fontSize: "0.875rem", fontFamily: "inherit", color: "#1e1b4b", flex: 1 }}
              />
              {search && (
                <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }} sx={{ p: 0, color: "#94a3b8" }}>
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: "inherit", width: 60, fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontFamily: "inherit", width: 180, fontWeight: 700 }}>Timestamp</TableCell>
                <TableCell sx={{ fontFamily: "inherit", width: 200, fontWeight: 700 }}>Action Code</TableCell>
                <TableCell sx={{ fontFamily: "inherit", width: 150, fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontFamily: "inherit", fontWeight: 700 }}>Activity Description</TableCell>
                <TableCell sx={{ fontFamily: "inherit", width: 100, fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="text" width={24} /></TableCell>
                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={100} height={20} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Skeleton variant="circular" width={28} height={28} />
                        <Skeleton variant="text" width={60} />
                      </Box>
                    </TableCell>
                    <TableCell><Skeleton variant="text" width="85%" /></TableCell>
                    <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <HistoryRoundedIcon sx={{ fontSize: 52, color: "#cbd5e1" }} />
                      <Typography sx={{ color: "#94a3b8", fontWeight: 600, fontFamily: "inherit" }}>
                        {search || category !== "ALL" ? "No audit records match the filters" : "No audit trail logs recorded yet"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => {
                  const chip = getActionChipProps(log.action);
                  const logIndex = (safePage - 1) * pageSize + i + 1;

                  const formattedTime = log.createdAt
                    ? new Date(log.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    })
                    : "—";

                  const initial = (log.username || "S").charAt(0).toUpperCase();

                  return (
                    <TableRow key={log.id || i} hover sx={{ "&:hover": { bgcolor: "#faf5ff" }, "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "#94a3b8", fontWeight: 700, fontFamily: "inherit", fontSize: "0.8rem" }}>
                        {logIndex}
                      </TableCell>
                      <TableCell sx={{ color: "#475569", fontSize: "0.85rem", fontFamily: "inherit" }}>
                        {formattedTime}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "inherit" }}>
                        <Chip
                          label={chip.label}
                          size="small"
                          sx={{
                            bgcolor: chip.bgcolor,
                            color: chip.color,
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            borderRadius: 1.5,
                            border: `1px solid ${chip.color}15`,
                            fontFamily: "inherit"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              bgcolor: "#f5f3ff",
                              color: "#7c3aed",
                              border: "1px solid #ddd6fe",
                              fontFamily: "inherit"
                            }}
                          >
                            {initial}
                          </Avatar>
                          <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem", fontFamily: "inherit" }}>
                            {log.username || "system"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "#334155", fontSize: "0.85rem", fontWeight: 500, fontFamily: "inherit" }}>
                        {log.details}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "inherit" }}>
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailOpen(true);
                              }}
                              sx={{ color: "#7d2ae8", background: "#f5f0ff", "&:hover": { background: "#ede9fe" } }}
                            >
                              <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {log.action?.startsWith("DELETE_") && (
                            <Tooltip title="Restore Entity">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setRestoreLogId(log.id);
                                  setRestoreLogAction(log.action);
                                  setRestoreConfirmOpen(true);
                                }}
                                sx={{ color: "#10b981", background: "#dcfce7", "&:hover": { background: "#bbf7d0" } }}
                              >
                                <RestoreRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
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

      {/* ── Pagination ── */}
      {!loading && totalElements > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5, flexWrap: "wrap", gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: "#64748b", fontFamily: "inherit" }}>
            Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> entries
          </Typography>
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={handlePageChange}
            shape="rounded"
            size="small"
            sx={{
              "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 600, fontFamily: "inherit" },
              "& .Mui-selected": { bgcolor: "#7d2ae8 !important", color: "#fff" }
            }}
          />
        </Box>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 800, color: "#1e1b4b", pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Audit Log Details
          <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ color: "#94a3b8" }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "rgba(125,42,232,0.08)" }}>
          {selectedLog && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, py: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Action:</Typography>
                  <Chip
                    label={selectedLog.action}
                    size="small"
                    sx={{
                      bgcolor: getActionChipProps(selectedLog.action).bgcolor,
                      color: getActionChipProps(selectedLog.action).color,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      borderRadius: 1.5,
                      fontFamily: "inherit"
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
                  ID: #{selectedLog.id}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, mb: 0.5 }}>Performed By</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: "0.85rem", fontWeight: 700, bgcolor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
                      {(selectedLog.username || "S").charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem", fontFamily: "inherit" }}>
                      {selectedLog.username || "system"}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, mb: 0.5 }}>Timestamp</Typography>
                  <Typography sx={{ color: "#334155", fontSize: "0.9rem", fontWeight: 500, fontFamily: "inherit" }}>
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "—"}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, mb: 0.5 }}>Activity Description</Typography>
                <Box sx={{ p: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 3 }}>
                  <Typography sx={{ color: "#334155", fontSize: "0.9rem", fontWeight: 500, fontFamily: "inherit", whiteSpace: "pre-line" }}>
                    {selectedLog.details}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2, bgcolor: "#7d2ae8", "&:hover": { bgcolor: "#6b21c8" }, textTransform: "none", fontFamily: "inherit", fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Restore Confirm Dialog ── */}
      <Dialog open={restoreConfirmOpen} onClose={() => setRestoreConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontFamily: "inherit", fontWeight: 700, color: "#1e1b4b" }}>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "inherit", color: "#64748b", fontSize: "0.9rem" }}>
            Are you sure you want to restore this deleted entity? This will reactivate the record in the system database.
            <br /><br />
            <strong>Action Code:</strong> {restoreLogAction}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={() => setRestoreConfirmOpen(false)} disabled={restoring}
            sx={{ borderRadius: 2, color: "#64748b", borderColor: "#e2e8f0", textTransform: "none", fontFamily: "inherit" }}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={() => handleRestore(restoreLogId)} disabled={restoring}
            sx={{ borderRadius: 2, boxShadow: "none", textTransform: "none", fontFamily: "inherit", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
            {restoring ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast Notifications ── */}
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ fontFamily: "inherit", borderRadius: 2, width: "100%" }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AuditLogs;
