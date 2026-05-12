import { useEffect, useState, useMemo } from "react";
import {
  getDivisions, createDivision, updateDivision, deleteDivision,
} from "../../services/divisionService";
import {
  getProductsByDivision, createProduct, deleteProduct,
} from "../../services/productService";

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

import "./Division.css";

/* ── SVG Icons ── */
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconTable = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="9" x2="9" y2="21" />
  </svg>
);
const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconDivision = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
    <line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" />
  </svg>
);
const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

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

/* ── Modal (100% unchanged) ── */
const Modal = ({ title, subtitle, icon, onClose, children, accent = "#6366f1" }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-box">
      <div className="modal-header" style={{ "--accent": accent }}>
        <div className="modal-header-icon" style={{ background: `${accent}20`, color: accent }}>
          {icon}
        </div>
        <div>
          <h3 className="modal-title">{title}</h3>
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        </div>
        <button className="modal-close" onClick={onClose}><IconX /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
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
  const [view, setView]                   = useState("table");

  const [addModal, setAddModal]       = useState(false);
  const [editModal, setEditModal]     = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal]     = useState(null);

  const [addName, setAddName]   = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const [productCountFilter, setProductCountFilter] = useState("");
  const [dateFilter, setDateFilter]                 = useState("");

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
    setLoading(true); setError("");
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
      setAddName(""); setAddModal(false);
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
      setEditModal(null); fetchDivisions();
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

  const openEdit = d => { setEditModal(d); setEditName(d.name); };

  const safePage = Math.min(page, totalPages || 1);
  const start    = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end      = Math.min(safePage * pageSize, totalElements);

  return (
    <>
      {/* ── Hero ── */}
      <div className="div-hero">
        <div>
          <h2 className="div-hero-title">Division Management</h2>
        </div>
        <button className="btn-primary" onClick={() => { setAddName(""); setAddModal(true); }}>
          <IconPlus /> Add Division
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="div-stats">
        <div className="div-stat-card">
          <div className="div-stat-icon"><IconDivision /></div>
          <div>
            <div className="div-stat-value">{loading ? "—" : divisions.length}</div>
            <div className="div-stat-label">Total Divisions</div>
          </div>
        </div>
        <div className="div-stat-card">
          <div className="div-stat-icon" style={{ background: "#f0fdf4", color: "#22c55e" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="div-stat-value">{loading ? "—" : divisions.length}</div>
            <div className="div-stat-label">Current Page</div>
          </div>
        </div>
        <div className="div-stat-card">
          <div className="div-stat-icon" style={{ background: "#fdf4ff", color: "#a855f7" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div className="div-stat-value">{loading ? "—" : totalPages}</div>
            <div className="div-stat-label">Total Pages</div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="error-banner">
          <IconWarning /> {error}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="div-toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <span className="search-ico"><IconSearch /></span>
            <input
              placeholder="Search divisions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => { setSearch(""); setSearchTerm(""); setPage(1); }}>
                <IconX />
              </button>
            )}
          </div>
        </div>
        <div className="toolbar-filters">
          <select value={productCountFilter} onChange={e => { setProductCountFilter(e.target.value); setPage(1); }} className="div-filter-select">
            <option value="">All Counts</option>
            <option value="0">No Products (0)</option>
            <option value="1-5">1-5 Products</option>
            <option value="6-10">6-10 Products</option>
            <option value="10+">10+ Products</option>
          </select>
          <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className="div-filter-select">
            <option value="">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          {(productCountFilter || dateFilter || search) && (
            <button className="div-clear-btn"
              onClick={() => { setProductCountFilter(""); setDateFilter(""); setSearch(""); setSearchTerm(""); setPage(1); }}
              title="Clear all filters">
              Clear
            </button>
          )}
        </div>
        <div className="toolbar-right">
          <div className="show-entries">
            <span>Show</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="view-toggle">
            <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Table view"><IconTable /></button>
            <button className={view === "card" ? "active" : ""} onClick={() => setView("card")} title="Card view"><IconGrid /></button>
          </div>
        </div>
      </div>

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
                      <div className="empty-state">
                        <div className="empty-icon"><IconDivision /></div>
                        <p>{searchTerm ? "No divisions match your search" : "No divisions yet"}</p>
                        {!searchTerm && (
                          <button className="btn-primary sm" onClick={() => { setAddName(""); setAddModal(true); }}>
                            <IconPlus /> Add First Division
                          </button>
                        )}
                      </div>
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
                        <div className="action-btns">
                          <Tooltip title="View" arrow placement="top">
                            <button className="act-btn view" onClick={() => setViewModal(d)}><IconEye /></button>
                          </Tooltip>
                          <Tooltip title="Products" arrow placement="top">
                            <button className="act-btn products" onClick={() => openProducts(d)}><IconBox /></button>
                          </Tooltip>
                          <Tooltip title="Edit" arrow placement="top">
                            <button className="act-btn edit" onClick={() => openEdit(d)}><IconEdit /></button>
                          </Tooltip>
                          <Tooltip title="Delete" arrow placement="top">
                            <button className="act-btn del" onClick={() => setDeleteModal(d)}><IconTrash /></button>
                          </Tooltip>
                        </div>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* ── Card View (100% unchanged) ── */}
      {view === "card" && (
        <div className="card-grid">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="div-card skeleton-card" />)
          ) : divisions.length === 0 ? (
            <div className="empty-state full-width">
              <div className="empty-icon"><IconDivision /></div>
              <p>{searchTerm ? "No divisions match your search" : "No divisions yet"}</p>
              {!searchTerm && (
                <button className="btn-primary sm" onClick={() => { setAddName(""); setAddModal(true); }}>
                  <IconPlus /> Add First Division
                </button>
              )}
            </div>
          ) : (
            filteredDivisions.map((d, i) => (
              <div className="div-card" key={d.id}>
                <div className="div-card-header">
                  <div className="div-card-avatar">{d.name?.charAt(0).toUpperCase()}</div>
                  <div className="div-card-info">
                    <div className="div-card-name">{d.name}</div>
                    <div className="div-card-meta">
                      <span className="product-count">{d.products?.length || 0} products</span>
                    </div>
                  </div>
                  <span className="div-card-index">#{(safePage - 1) * pageSize + i + 1}</span>
                </div>
                <div className="div-card-actions">
                  <button className="act-btn view" onClick={() => setViewModal(d)}><IconEye /> View</button>
                  <button className="act-btn products" onClick={() => openProducts(d)}><IconBox /> Products</button>
                  <button className="act-btn edit" onClick={() => openEdit(d)}><IconEdit /> Edit</button>
                  <button className="act-btn del" onClick={() => setDeleteModal(d)}><IconTrash /> Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Pagination (100% unchanged) ── */}
      {!loading && filteredDivisions.length > 0 && (
        <div className="pagination-bar">
          <span className="pag-info">
            Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> entries
          </span>
          <div className="pag-btns">
            <button disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
            <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…"
                  ? <span key={`e${i}`} className="pag-ellipsis">…</span>
                  : <button key={p} className={safePage === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
              )}
            <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      )}

      {/* ── View Modal (100% unchanged) ── */}
      {viewModal && (
        <Modal title="Division Details" subtitle={`Viewing: ${viewModal.name}`} icon={<IconEye />} onClose={() => setViewModal(null)} accent="#0ea5e9">
          <div className="div-view-details">
            <div className="div-detail-row">
              <div className="div-detail-label">Division ID:</div>
              <div className="div-detail-value">{viewModal.id}</div>
            </div>
            <div className="div-detail-row">
              <div className="div-detail-label">Division Name:</div>
              <div className="div-detail-value">{viewModal.name}</div>
            </div>
            <div className="div-detail-row">
              <div className="div-detail-label">Total Products:</div>
              <div className="div-detail-value"><span className="product-count">{viewModal.products?.length || 0}</span></div>
            </div>
            <div className="div-detail-row">
              <div className="div-detail-label">Created Date:</div>
              <div className="div-detail-value">
                {new Date(viewModal.createdAt || viewModal.created_at || viewModal.dateCreated || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="div-detail-row">
              <div className="div-detail-label">Last Updated:</div>
              <div className="div-detail-value">
                {new Date(viewModal.updatedAt || viewModal.updated_at || viewModal.dateUpdated || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="div-detail-row">
              <div className="div-detail-label">Status:</div>
              <div className="div-detail-value"><span className="status-badge active">Active</span></div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => setViewModal(null)}>Close</button>
            <button className="modal-btn confirm" style={{ "--btn-color": "#0ea5e9" }} onClick={() => { setViewModal(null); openEdit(viewModal); }}>
              <IconEdit /> Edit Division
            </button>
          </div>
        </Modal>
      )}

      {/* ── Products Modal (100% unchanged) ── */}
      {productModal && (
        <Modal title={`Products — ${productModal.name}`} subtitle="Manage products in this division" icon={<IconBox />} onClose={() => setProductModal(null)} accent="#10b981">
          <div className="div-prod-form">
            <div className="div-form-row">
              <div className="modal-field">
                <label>Product Name <span className="req">*</span></label>
                <input autoFocus placeholder="e.g. Cheese 500g" value={newProd.name}
                  onChange={e => setNewProd(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleAddProduct()} />
              </div>
            </div>
            <div className="div-form-row">
              <div className="modal-field">
                <label>UIM Price</label>
                <input type="number" min="0" placeholder="0" value={newProd.uimPrice} onChange={e => setNewProd(f => ({ ...f, uimPrice: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>MRP</label>
                <input type="number" min="0" placeholder="0" value={newProd.mrp} onChange={e => setNewProd(f => ({ ...f, mrp: e.target.value }))} />
              </div>
            </div>
            <div className="div-form-row">
              <div className="modal-field">
                <label>Selling Price</label>
                <input type="number" min="0" placeholder="0" value={newProd.sellingPrice} onChange={e => setNewProd(f => ({ ...f, sellingPrice: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>Purchase Price</label>
                <input type="number" min="0" placeholder="0" value={newProd.purchasePrice} onChange={e => setNewProd(f => ({ ...f, purchasePrice: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions" style={{ marginBottom: 20 }}>
              <button className="modal-btn cancel" onClick={() => setNewProd(EMPTY_PROD)}>Clear</button>
              <button className="modal-btn confirm" style={{ "--btn-color": "#10b981" }} onClick={handleAddProduct} disabled={prodSaving || !newProd.name.trim()}>
                {prodSaving ? <span className="btn-spinner" /> : <IconPlus />}
                {prodSaving ? "Adding…" : "Add Product"}
              </button>
            </div>
          </div>
          <div className="modal-field" style={{ marginBottom: 0 }}>
            <label>Existing Products</label>
            <div className="prod-list">
              {prodLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="prod-item">
                    <Skeleton variant="text" width="60%" />
                  </div>
                ))
              ) : products.length === 0 ? (
                <p className="prod-empty">No products yet. Add one above.</p>
              ) : (
                products.map(p => (
                  <div className="prod-item" key={p.id}>
                    <div className="prod-info">
                      <span className="prod-name"><IconBox />{p.name}</span>
                      <span className="prod-code">{p.productCode}</span>
                    </div>
                    <div className="prod-prices">
                      <span className="prod-price">₹{p.sellingPrice || 0}</span>
                    </div>
                    <button className="prod-del" onClick={() => handleDeleteProduct(p.id)} title="Delete"><IconTrash /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Modal (100% unchanged) ── */}
      {addModal && (
        <Modal title="Add Divisions" subtitle="Create one or multiple division units" icon={<IconPlus />} onClose={() => { setAddModal(false); setAddName(""); }} accent="#6366f1">
          <div className="div-form-row">
            <div className="modal-field">
              <label>Division Names <span className="req">*</span></label>
              <input autoFocus placeholder="e.g. North Region, South Region, East Region (separate multiple divisions with commas)"
                value={addName}
                onChange={e => handleInputChange(e.target.value, setAddName)}
                onKeyDown={e => e.key === "Enter" && handleAdd()} />
              <div className="div-input-help">
                💡 Tip: You can add multiple divisions at once by separating them with commas
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => { setAddModal(false); setAddName(""); }}>Cancel</button>
            <button className="modal-btn confirm" onClick={handleAdd} disabled={saving || !addName.trim()}>
              {saving ? <span className="btn-spinner" /> : <IconPlus />}
              {saving ? "Adding…" : "Add Divisions"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal (100% unchanged) ── */}
      {editModal && (
        <Modal title="Edit Division" subtitle={`Editing: ${editModal.name}`} icon={<IconEdit />} onClose={() => setEditModal(null)} accent="#8b5cf6">
          <div className="div-form-row">
            <div className="modal-field">
              <label>Division Name <span className="req">*</span></label>
              <input autoFocus placeholder="Division name" value={editName}
                onChange={e => handleInputChange(e.target.value, setEditName)}
                onKeyDown={e => e.key === "Enter" && handleUpdate()} />
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="modal-btn confirm" style={{ "--btn-color": "#8b5cf6" }} onClick={handleUpdate} disabled={saving || !editName.trim()}>
              {saving ? <span className="btn-spinner" /> : <IconEdit />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal (100% unchanged) ── */}
      {deleteModal && (
        <Modal title="Delete Division" subtitle="This action cannot be undone" icon={<IconWarning />} onClose={() => setDeleteModal(null)} accent="#ef4444">
          <div className="delete-confirm-body">
            <p>Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?</p>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="modal-btn danger" onClick={handleDelete} disabled={saving}>
              {saving ? <span className="btn-spinner" /> : <IconTrash />}
              {saving ? "Deleting…" : "Delete Division"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Toast (100% unchanged) ── */}
      {toast && (
        <div className={`div-toast div-toast-${toast.type}`}>
          <div className="div-toast-content">
            <div className="div-toast-icon">
              {toast.type === "success" ? "✓" : toast.type === "warning" ? "ⓘ" : "⚠"}
            </div>
            <span className="div-toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Division;
