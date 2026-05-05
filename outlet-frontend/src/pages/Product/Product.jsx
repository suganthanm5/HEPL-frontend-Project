import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { addProduct, updateProduct, deleteProduct } from "../../services/productService";
import { getDivisions } from "../../services/devisionService";
import "./Product.css";

/* ── Icons ── */
const IcPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IcSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcBox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IcWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcTable = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="9" x2="9" y2="21"/>
  </svg>
);
const IcGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/* ── Modal ── */
const Modal = ({ title, subtitle, icon, accent = "#f59e0b", onClose, children }) => (
  <div className="prod-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="prod-modal-box">
      <div className="prod-modal-header" style={{ "--accent": accent }}>
        <div className="prod-modal-icon" style={{ background: `${accent}20`, color: accent }}>{icon}</div>
        <div>
          <h3 className="prod-modal-title">{title}</h3>
          {subtitle && <p className="prod-modal-subtitle">{subtitle}</p>}
        </div>
        <button className="prod-modal-close" onClick={onClose}><IcX /></button>
      </div>
      <div className="prod-modal-body">{children}</div>
    </div>
  </div>
);

const EMPTY_FORM = { name: "", productCode: "", uimPrice: "", mrp: "", sellingPrice: "", purchasePrice: "", divisionId: "" };
const PAGE_SIZES = [5, 10, 25, 50];

const Product = () => {
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [pageSize,    setPageSize]    = useState(10);
  const [page,        setPage]        = useState(1);
  const [view,        setView]        = useState("table");
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [divisions,   setDivisions]   = useState([]);
  const [viewModal, setViewModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Toast notification system
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Price validation
  const validatePrices = () => {
    const mrp = Number(form.mrp) || 0;
    const sellingPrice = Number(form.sellingPrice) || 0;
    const purchasePrice = Number(form.purchasePrice) || 0;
    
    if (sellingPrice > mrp) {
      showToast('Selling price cannot be greater than MRP', 'error');
      return false;
    }
    
    if (purchasePrice > mrp) {
      showToast('Purchase price cannot be greater than MRP', 'error');
      return false;
    }
    
    return true;
  };

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true); setError("");
    try {
      // Fetch all divisions (with their nested products) in one call
      const res = await getDivisions(0, 200);
      const divList = res?.data?.data?.content ?? res?.data?.data ?? [];
      setDivisions(divList);

      // Flatten: each product gets divisionId + divisionName from its parent
      const flat = divList.flatMap((d) =>
        (Array.isArray(d.products) ? d.products : []).map((p) => ({
          ...p,
          divisionId:   d.id,
          divisionName: d.name,
        }))
      );
      setProducts(flat);
    } catch {
      setError("Failed to load products. Check API connection.");
    } finally { setLoading(false); }
  };

  // Generate unique product code starting with MKL
  const generateProductCode = () => {
    const existingCodes = products.map(p => p.productCode).filter(Boolean);
    let counter = 1;
    let newCode;
    
    do {
      newCode = `MKL${counter.toString().padStart(3, '0')}`;
      counter++;
    } while (existingCodes.includes(newCode));
    
    return newCode;
  };

  const divMap = useMemo(() => Object.fromEntries(divisions.map((d) => [d.id, d.name])), [divisions]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const numField = (v) => (v === "" ? 0 : Number(v));
  const buildPayload = () => ({
    name:          form.name.trim(),
    productCode:   form.productCode.trim(),
    uimPrice:      numField(form.uimPrice),
    mrp:           numField(form.mrp),
    sellingPrice:  numField(form.sellingPrice),
    purchasePrice: numField(form.purchasePrice),
    ...(form.divisionId ? { divisionId: Number(form.divisionId), division: { id: Number(form.divisionId) } } : {}),
  });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    if (!validatePrices()) return;
    setSaving(true);
    try {
      // Generate product code automatically
      const autoCode = generateProductCode();
      const payload = { ...buildPayload(), productCode: autoCode };
      await addProduct(payload);
      await fetchProducts();
      setAddModal(false); setForm(EMPTY_FORM);
      showToast('Product added successfully!', 'success');
    } catch (e) {
      showToast("Failed to add product: " + (e.response?.data?.message || e.message), 'error');
    } finally { setSaving(false); }
  };

  const divNameOf = (p) => p.division?.name ?? divMap[p.divisionId] ?? p.divisionName ?? "—";

  const openEdit = (p) => {
    setForm({
      name:          p.name          ?? "",
      productCode:   p.productCode   ?? "",
      uimPrice:      p.uimPrice      ?? "",
      mrp:           p.mrp           ?? "",
      sellingPrice:  p.sellingPrice  ?? "",
      purchasePrice: p.purchasePrice ?? "",
      divisionId:    String(p.division?.id ?? p.divisionId ?? ""),
    });
    setEditModal(p);
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) return;
    if (!validatePrices()) return;
    setSaving(true);
    try {
      await updateProduct(editModal.id, buildPayload());
      await fetchProducts();
      setEditModal(null); setForm(EMPTY_FORM);
      showToast('Product updated successfully!', 'success');
    } catch (e) {
      showToast("Failed to update product: " + (e.response?.data?.message || e.message), 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteProduct(deleteModal.id);
      await fetchProducts();
      setDeleteModal(null);
      showToast('Product deleted successfully!', 'success');
    } catch (e) {
      showToast("Failed to delete product: " + (e.response?.data?.message || e.message), 'error');
    } finally { setSaving(false); }
  };

  const filtered = useMemo(() =>
    products.filter((p) =>
      [p.name, p.productCode, divNameOf(p)].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    ), [products, search, divMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start      = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end        = Math.min(safePage * pageSize, filtered.length);
  const fmt        = (v) => (v == null || v === "" ? "—" : Number(v).toLocaleString());

  const renderFormFields = (isEdit = false) => (
    <>
      <div className="prod-form-row">
        <div className="prod-modal-field">
          <label>Product Name <span className="prod-req">*</span></label>
          <input autoFocus name="name" value={form.name} onChange={handleChange} placeholder="e.g. Milk 1L" />
        </div>
        {isEdit && (
          <div className="prod-modal-field">
            <label>Product Code</label>
            <input name="productCode" value={form.productCode} readOnly 
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              placeholder="Auto-generated" />
          </div>
        )}
      </div>
      <div className="prod-modal-field" style={{ marginBottom: 14 }}>
        <label>Division</label>
        <SearchableSelect
          options={divisions}
          value={form.divisionId}
          onChange={(id, name) => setForm(f => ({ ...f, divisionId: id }))}
          placeholder="— Select division —"
          searchPlaceholder="Search divisions..."
        />
      </div>
      <div className="prod-form-row">
        <div className="prod-modal-field">
          <label>UIM Price</label>
          <input name="uimPrice" type="number" min="0" value={form.uimPrice} onChange={handleChange} placeholder="0" />
        </div>
        <div className="prod-modal-field">
          <label>MRP</label>
          <input name="mrp" type="number" min="0" value={form.mrp} onChange={handleChange} placeholder="0" />
        </div>
      </div>
      <div className="prod-form-row">
        <div className="prod-modal-field">
          <label>Selling Price</label>
          <input name="sellingPrice" type="number" min="0" value={form.sellingPrice} onChange={handleChange} placeholder="0" />
        </div>
        <div className="prod-modal-field">
          <label>Purchase Price</label>
          <input name="purchasePrice" type="number" min="0" value={form.purchasePrice} onChange={handleChange} placeholder="0" />
        </div>
      </div>
    </>
  );

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Navbar title="Product Management" />
        <div className="page-content">

          {/* Hero */}
          <div className="prod-hero">
            <h2 className="prod-hero-title">Product Management</h2>
            <button className="prod-btn-primary" onClick={() => { setForm(EMPTY_FORM); setAddModal(true); }}>
              <IcPlus /> Add Product
            </button>
          </div>

          {/* Stats */}
          <div className="prod-stats">
            {[
              { label: "Total Products",   value: products.length, color: "#f59e0b", bg: "#fffbeb", icon: <IcBox /> },
              { label: "Filtered Results", value: filtered.length, color: "#6366f1", bg: "#eef2ff", icon: <IcSearch /> },
              { label: "Total Pages",      value: totalPages,      color: "#10b981", bg: "#ecfdf5", icon: <IcGrid /> },
            ].map((s) => (
              <div className="prod-stat-card" key={s.label}>
                <div className="prod-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div className="prod-stat-value" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
                  <div className="prod-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="prod-error"><IcWarn />{error}</div>}

          {/* Toolbar */}
          <div className="prod-toolbar">
            <div className="prod-search-wrap">
              <span className="prod-search-ico"><IcSearch /></span>
              <input
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button className="prod-search-clear" onClick={() => { setSearch(""); setPage(1); }}>
                  <IcX />
                </button>
              )}
            </div>
            <div className="prod-toolbar-right">
              <div className="prod-show-entries">
                <span>Show</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div className="prod-view-toggle">
                <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Table"><IcTable /></button>
                <button className={view === "card"  ? "active" : ""} onClick={() => setView("card")}  title="Cards"><IcGrid /></button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {view === "table" && (
            <div className="prod-table-wrap">
              <table className="prod-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Name</th>
                    <th>Division</th>
                    <th>Code</th>
                    <th>UIM Price</th>
                    <th>MRP</th>
                    <th>Selling Price</th>
                    <th>Purchase Price</th>
                    <th style={{ width: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4,5].map((i) => (
                      <tr key={i}>
                        {[50,"30%","15%","12%","10%","10%","10%","10%",100].map((w, j) => (
                          <td key={j}><span className="prod-skel" style={{ width: w }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={9}>
                      <div className="prod-empty">
                        <div className="prod-empty-icon"><IcBox /></div>
                        <p>{search ? "No products match your search" : "No products yet"}</p>
                        {!search && (
                          <button className="prod-btn-primary sm" onClick={() => { setForm(EMPTY_FORM); setAddModal(true); }}>
                            <IcPlus /> Add First Product
                          </button>
                        )}
                      </div>
                    </td></tr>
                  ) : (
                    paginated.map((p, i) => (
                      <tr key={p.id}>
                        <td className="prod-td-num">{(safePage - 1) * pageSize + i + 1}</td>
                        <td>
                          <div className="prod-td-name-wrap">
                            <span className="prod-td-avatar">{p.name?.charAt(0).toUpperCase()}</span>
                            <span className="prod-td-name">{p.name}</span>
                          </div>
                        </td>
                        <td><span className="prod-div-badge">{divNameOf(p)}</span></td>
                        <td><span className="prod-code-badge">{p.productCode || "—"}</span></td>
                        <td className="prod-td-price">{fmt(p.uimPrice)}</td>
                        <td className="prod-td-price">{fmt(p.mrp)}</td>
                        <td className="prod-td-price prod-price-sell">{fmt(p.sellingPrice)}</td>
                        <td className="prod-td-price">{fmt(p.purchasePrice)}</td>
                        <td>
                          <div className="prod-action-btns">
                            <button className="prod-act-btn view" onClick={() => setViewModal(p)} title="View"><IcEye /></button>
                            <button className="prod-act-btn edit" onClick={() => openEdit(p)} title="Edit"><IcEdit /></button>
                            <button className="prod-act-btn del"  onClick={() => setDeleteModal(p)} title="Delete"><IcTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Card View */}
          {view === "card" && (
            <div className="prod-card-grid">
              {loading ? (
                [1,2,3,4,5,6].map((i) => <div key={i} className="prod-card prod-skeleton-card" />)
              ) : paginated.length === 0 ? (
                <div className="prod-empty full-width">
                  <div className="prod-empty-icon"><IcBox /></div>
                  <p>{search ? "No products match your search" : "No products yet"}</p>
                </div>
              ) : (
                paginated.map((p, i) => (
                  <div className="prod-card" key={p.id}>
                    <div className="prod-card-top">
                      <div className="prod-card-avatar">{p.name?.charAt(0).toUpperCase()}</div>
                      <span className="prod-card-index">#{(safePage - 1) * pageSize + i + 1}</span>
                    </div>
                    <div className="prod-card-name">{p.name}</div>
                    <span className="prod-div-badge">{divNameOf(p)}</span>
                    {p.productCode && <span className="prod-code-badge">{p.productCode}</span>}
                    <div className="prod-card-prices">
                      <div className="prod-card-price-row"><span>MRP</span><strong>{fmt(p.mrp)}</strong></div>
                      <div className="prod-card-price-row"><span>Selling</span><strong className="prod-price-sell">{fmt(p.sellingPrice)}</strong></div>
                      <div className="prod-card-price-row"><span>Purchase</span><strong>{fmt(p.purchasePrice)}</strong></div>
                    </div>
                    <div className="prod-card-actions">
                      <button className="prod-act-btn view" onClick={() => setViewModal(p)}><IcEye /> View</button>
                      <button className="prod-act-btn edit" onClick={() => openEdit(p)}><IcEdit /> Edit</button>
                      <button className="prod-act-btn del"  onClick={() => setDeleteModal(p)}><IcTrash /> Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="prod-pagination">
              <span className="prod-pag-info">
                Showing <strong>{start}–{end}</strong> of <strong>{filtered.length}</strong> entries
              </span>
              <div className="prod-pag-btns">
                <button disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                <button disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "…"
                    ? <span key={`e${i}`} className="prod-pag-ellipsis">…</span>
                    : <button key={p} className={safePage === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
                  )}
                <button disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                <button disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Modal */}
      {addModal && (
        <Modal title="Add Product" subtitle="Create a new product" icon={<IcPlus />} accent="#f59e0b"
          onClose={() => { setAddModal(false); setForm(EMPTY_FORM); }}>
          {renderFormFields(false)}
          <div className="prod-modal-actions">
            <button className="prod-modal-btn cancel" onClick={() => { setAddModal(false); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="prod-modal-btn confirm" onClick={handleAdd} disabled={saving || !form.name.trim()}>
              {saving ? <span className="prod-spinner" /> : <IcPlus />}
              {saving ? "Adding…" : "Add Product"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit Product" subtitle={`Editing: ${editModal.name}`} icon={<IcEdit />} accent="#6366f1"
          onClose={() => { setEditModal(null); setForm(EMPTY_FORM); }}>
          {renderFormFields(true)}
          <div className="prod-modal-actions">
            <button className="prod-modal-btn cancel" onClick={() => { setEditModal(null); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="prod-modal-btn confirm" style={{ "--btn-color": "#6366f1" }} onClick={handleUpdate} disabled={saving || !form.name.trim()}>
              {saving ? <span className="prod-spinner" /> : <IcEdit />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <Modal title="Delete Product" subtitle="This action cannot be undone" icon={<IcWarn />} accent="#ef4444"
          onClose={() => setDeleteModal(null)}>
          <div className="prod-delete-body">
            <p>Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?</p>
            <p className="prod-delete-warn">This product will be permanently removed.</p>
          </div>
          <div className="prod-modal-actions">
            <button className="prod-modal-btn cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="prod-modal-btn danger" onClick={handleDelete} disabled={saving}>
              {saving ? <span className="prod-spinner" /> : <IcTrash />}
              {saving ? "Deleting…" : "Delete Product"}
            </button>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewModal && (
        <Modal title="Product Details" subtitle={`Viewing: ${viewModal.name}`} icon={<IcEye />} accent="#0ea5e9"
          onClose={() => setViewModal(null)}>
          <div className="prod-view-details">
            <div className="prod-detail-row">
              <div className="prod-detail-label">Product Name:</div>
              <div className="prod-detail-value">{viewModal.name}</div>
            </div>
            <div className="prod-detail-row">
              <div className="prod-detail-label">Product Code:</div>
              <div className="prod-detail-value">{viewModal.productCode || '—'}</div>
            </div>
            <div className="prod-detail-row">
              <div className="prod-detail-label">Division:</div>
              <div className="prod-detail-value">{divNameOf(viewModal)}</div>
            </div>
            <div className="prod-detail-row">
              <div className="prod-detail-label">UIM Price:</div>
              <div className="prod-detail-value">₹{fmt(viewModal.uimPrice)}</div>
            </div>
            <div className="prod-detail-row">
              <div className="prod-detail-label">MRP:</div>
              <div className="prod-detail-value">₹{fmt(viewModal.mrp)}</div>
            </div>
            <div className="prod-detail-row">
              <div className="prod-detail-label">Selling Price:</div>
              <div className="prod-detail-value">₹{fmt(viewModal.sellingPrice)}</div>
            </div>
            <div className="prod-detail-row">
              <div className="prod-detail-label">Purchase Price:</div>
              <div className="prod-detail-value">₹{fmt(viewModal.purchasePrice)}</div>
            </div>
          </div>
          <div className="prod-modal-actions">
            <button className="prod-modal-btn cancel" onClick={() => setViewModal(null)}>Close</button>
            <button className="prod-modal-btn confirm" style={{ "--btn-color": "#0ea5e9" }} onClick={() => { setViewModal(null); openEdit(viewModal); }}>
              <IcEdit /> Edit Product
            </button>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`prod-toast prod-toast-${toast.type}`}>
          <div className="prod-toast-content">
            <div className="prod-toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'warning' ? 'ⓘ' : '⚠'}
            </div>
            <span className="prod-toast-message">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default Product;
