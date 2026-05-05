import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import SearchableSelect from "../../components/SearchableSelect/SearchableSelect";
import { getOutlets, createOutlet, updateOutlet, deleteOutlet } from "../../services/outletService";
import { getLocations } from "../../services/locationService";
import { getDivisions } from "../../services/devisionService";
import "./Outlet.css";

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
const IcX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcOutlet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IcWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const IcOwner = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

/* ── OUTLET TYPES ── */
const OUTLET_TYPES = [
  "Retail",
  "Wholesale",
  "Franchise",
  "Online",
  "Distribution",
  "Warehouse",
  "Corporate",
  "Branch Office",
];


const TYPE_COLOR = {
  Retail:          { bg: "#eef2ff", color: "#6366f1" },
  Wholesale:       { bg: "#ecfdf5", color: "#10b981" },
  Franchise:       { bg: "#fffbeb", color: "#f59e0b" },
  Online:          { bg: "#ecfeff", color: "#06b6d4" },
  Distribution:    { bg: "#fdf4ff", color: "#a855f7" },
  Warehouse:       { bg: "#fff7ed", color: "#f97316" },
  Corporate:       { bg: "#f0fdf4", color: "#22c55e" },
  "Branch Office": { bg: "#fef2f2", color: "#ef4444" },
};

const EMPTY_FORM = {
  outletName: "", address: "", locationId: "", locationName: "",
  mappings: {}, outletType: "", ownerName: "",
};


const PAGE_SIZES = [5, 10, 25, 50];


const Modal = ({ title, subtitle, icon, accent = "#6366f1", onClose, children }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-box">
      <div className="modal-header" style={{ "--accent": accent }}>
        <div className="modal-header-icon" style={{ background: `${accent}20`, color: accent }}>{icon}</div>
        <div>
          <h3 className="modal-title">{title}</h3>
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        </div>
        <button className="modal-close" onClick={onClose}><IcX /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export default function Outlet() {
  const [outlets,   setOutlets]   = useState([]);
  const [locations, setLocations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const [search,   setSearch]   = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page,     setPage]     = useState(1);
  const [view,     setView]     = useState("table");

  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);


  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const extractList = (res) => {
    // Handle different API response structures
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true); 
    setError("");
    try {
      const [oRes, lRes, dRes] = await Promise.allSettled([
        getOutlets(), 
        getLocations(0, 100), // Fetch more locations with explicit parameters
        getDivisions(0, 100)  // Fetch more divisions with explicit parameters
      ]);

      // Handle locations
      if (lRes.status === "fulfilled") {
        const locList = extractList(lRes.value);
        console.log('Locations API response:', lRes.value); // Debug full response
        console.log('Extracted locations:', locList); // Debug extracted list
        setLocations(locList);
      } else {
        console.error("Locations fetch failed:", lRes.reason);
        setLocations([]);
      }

      // Handle divisions
      if (dRes.status === "fulfilled") {
        const divList = extractList(dRes.value);
        console.log('Divisions loaded:', divList.length); // Debug log
        setDivisions(divList);
      } else {
        console.error("Divisions fetch failed:", dRes.reason);
        setDivisions([]);
      }

      // Handle outlets
      if (oRes.status === "fulfilled") {
        const raw = extractList(oRes.value);

       
        const enriched = raw.map((o) => {
          const divObjs = Array.isArray(o.divisions) ? o.divisions : [];
          const divIds  = divObjs.map((d) => d.id);
          const divNames = divObjs.map((d) => d.name).filter(Boolean);
          const productNames = divObjs.flatMap((d) => Array.isArray(d.products) ? d.products : []).map((p) => p.name).filter(Boolean);
          return {
            ...o,
            locationName: o.locationName || null,
            divisions:    divObjs,   
            divisionIds:  divIds,
            divisionNames: divNames,
            productNames: productNames,
            ownerName: o.ownerName ?? null,
            address:   o.address   ?? null,
          };
        });

        setOutlets(enriched);
      } else {
        console.error("Outlets fetch failed:", oRes.reason);
        setError("Failed to load outlets.");
      }
    } finally { 
      if (!silent) setLoading(false); 
    }
  };

 
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Handle division selection
  const handleDivisionSelect = (divisionId, divisionName) => {
    if (!divisionId) return;
    
    const division = divisions.find(d => d.id == divisionId);
    if (!division) return;
    
    // Add to selected divisions if not already selected
    if (!selectedDivisions.find(d => d.id == divisionId)) {
      setSelectedDivisions(prev => [...prev, division]);
      
      // Initialize empty product selection for this division
      setForm(f => ({
        ...f,
        mappings: {
          ...f.mappings,
          [divisionId]: []
        }
      }));
      
      // Update available products
      updateAvailableProducts([...selectedDivisions, division]);
    }
  };
  
  // Remove division
  const removeDivision = (divisionId) => {
    setSelectedDivisions(prev => prev.filter(d => d.id != divisionId));
    
    // Remove from form mappings
    setForm(f => {
      const newMappings = { ...f.mappings };
      delete newMappings[divisionId];
      return { ...f, mappings: newMappings };
    });
    
    // Update available products
    const remainingDivisions = selectedDivisions.filter(d => d.id != divisionId);
    updateAvailableProducts(remainingDivisions);
  };
  
  // Update available products based on selected divisions
  const updateAvailableProducts = (divisionList) => {
    const products = divisionList.flatMap(d => 
      (d.products || []).map(p => ({
        ...p,
        divisionId: d.id,
        divisionName: d.name,
        displayName: `${p.name} (${d.name})`
      }))
    );
    setAvailableProducts(products);
  };
  
  // Handle product selection
  const handleProductSelect = (productId, productName) => {
    if (!productId) return;
    
    const product = availableProducts.find(p => p.id == productId);
    if (!product) return;
    
    const divisionId = product.divisionId;
    
    // Add product to division mapping
    setForm(f => {
      const currentProducts = f.mappings[divisionId] || [];
      if (!currentProducts.includes(Number(productId))) {
        return {
          ...f,
          mappings: {
            ...f.mappings,
            [divisionId]: [...currentProducts, Number(productId)]
          }
        };
      }
      return f;
    });
  };
  
  // Remove product
  const removeProduct = (divisionId, productId) => {
    setForm(f => {
      const currentProducts = f.mappings[divisionId] || [];
      return {
        ...f,
        mappings: {
          ...f.mappings,
          [divisionId]: currentProducts.filter(pid => pid != productId)
        }
      };
    });
  };

  const buildPayload = (id = null) => {
    const locId = form.locationId
      ? Number(form.locationId)
      : locations.find((l) => l.name === form.locationName)?.id ?? null;
    const mappings = Object.entries(form.mappings).flatMap(([divId, prodIds]) =>
      prodIds.map((pid) => ({ divisionId: Number(divId), productId: Number(pid) }))
    );
    const payload = {
      outletName: form.outletName.trim(),
      address:    form.address.trim(),
      locationId: locId,
      outletType: form.outletType,
      ownerName:  form.ownerName.trim(),
      mappings,
    };
    if (id) payload.id = id;
    return payload;
  };

  
  const isValid = () =>
    form.outletName.trim() &&
    form.locationId &&
    form.outletType &&
    Object.values(form.mappings).some((pids) => pids.length > 0);

  
  const handleAdd = async () => {
    if (!isValid()) return;
    setSaving(true);
    try {
      await createOutlet(buildPayload());
      await fetchAll(true);
      setAddModal(false); setForm(EMPTY_FORM);
    } catch (e) {
      alert("Failed to add: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  // Refresh locations when opening modals
  const refreshLocations = async () => {
    try {
      console.log('Refreshing locations...'); // Debug log
      const res = await getLocations(0, 100); // Fetch with explicit parameters
      console.log('Location refresh response:', res); // Debug full response
      const locList = extractList(res);
      console.log('Refreshed locations count:', locList.length); // Debug count
      console.log('Refreshed locations:', locList); // Debug list
      setLocations(locList);
      return locList;
    } catch (e) {
      console.error('Failed to refresh locations:', e);
      return [];
    }
  };

  const openAddModal = async () => {
    setForm(EMPTY_FORM);
    setSelectedDivisions([]);
    setAvailableProducts([]);
    setAddModal(true);
    const locations = await refreshLocations();
    console.log('Add modal opened with locations:', locations.length);
  };

  const openEditModal = async (o) => {
    const locations = await refreshLocations();
    
    const locName = o.locationName || "";
    const locId   = o.locationId
      ? String(o.locationId)
      : String(locations.find((l) => l.name === locName)?.id ?? "");

    const mappings = {};
    const selectedDivs = [];
    
    (o.divisions ?? []).forEach((d) => {
      mappings[d.id] = (d.products ?? []).map((p) => p.id);
      selectedDivs.push(d);
    });
    
    setSelectedDivisions(selectedDivs);
    updateAvailableProducts(selectedDivs);

    setForm({
      outletName:   o.outletName ?? "",
      address:      o.address    ?? "",
      locationId:   locId,
      locationName: locName,
      mappings,
      outletType:   o.outletType ?? "",
      ownerName:    o.ownerName  ?? "",
    });
    setEditModal(o);
    console.log('Edit modal opened with locations:', locations.length);
  };

  const handleUpdate = async () => {
    if (!isValid()) return;
    setSaving(true);
    try {
      await updateOutlet(editModal.id, buildPayload(editModal.id));
      await fetchAll(true);
      setEditModal(null); setForm(EMPTY_FORM);
    } catch (e) {
      alert("Failed to update: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteOutlet(deleteModal.id);
      await fetchAll(true);
      setDeleteModal(null);
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  /* filter + paginate */
  const filtered = useMemo(() =>
    outlets.filter((o) =>
      [o.outletName, o.outletType, o.locationName, o.location, o.ownerName]
        .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
    ), [outlets, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const start      = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end        = Math.min(safePage * pageSize, filtered.length);

  const renderFormFields = () => (
    <>
      <div className="form-row">
        <div className="modal-field">
          <label>Outlet Name <span className="req">*</span></label>
          <input
            name="outletName"
            value={form.outletName}
            onChange={handleChange}
            placeholder="e.g. Main Branch"
          />
        </div>
        <div className="modal-field">
          <label>Owner Name</label>
          <input
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            placeholder="e.g. John Doe"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="modal-field">
          <label>Location <span className="req">*</span></label>
          <SearchableSelect
            options={locations}
            value={form.locationId}
            onChange={(id, name) => {
              console.log('Location selected:', { id, name }); // Debug log
              setForm(f => ({ ...f, locationId: id, locationName: name }));
            }}
            placeholder="— Select location —"
            searchPlaceholder="Search locations..."
            required
          />
          {locations.length === 0 && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
              ⚠️ No locations loaded. Please check the Location page.
            </div>
          )}
        </div>
        <div className="modal-field">
          <label>Outlet Type <span className="req">*</span></label>
          <select name="outletType" value={form.outletType} onChange={handleChange}>
            <option value="">— Select type —</option>
            {OUTLET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="modal-field">
        <label>Address</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="e.g. 123 Main St, City"
          rows={2}
        />
      </div>

      <div className="modal-field">
        <label>
          Divisions & Products <span className="req">*</span>
          <span className="field-hint">(select division then its products)</span>
        </label>
        
        {/* Division Selection */}
        <div className="form-row">
          <div className="modal-field">
            <label>Select Division</label>
            <SearchableSelect
              options={divisions.filter(d => !selectedDivisions.find(sd => sd.id === d.id))}
              value=""
              onChange={handleDivisionSelect}
              placeholder="— Add division —"
              searchPlaceholder="Search divisions..."
            />
          </div>
          <div className="modal-field">
            <label>Select Product</label>
            <SearchableSelect
              options={availableProducts.filter(p => {
                const currentProducts = form.mappings[p.divisionId] || [];
                return !currentProducts.includes(p.id);
              })}
              value=""
              onChange={handleProductSelect}
              placeholder="— Add product —"
              searchPlaceholder="Search products..."
              disabled={selectedDivisions.length === 0}
            />
          </div>
        </div>
        
        {/* Selected Divisions and Products */}
        {selectedDivisions.length > 0 && (
          <div className="selected-mappings">
            {selectedDivisions.map((division) => {
              const selectedProducts = (form.mappings[division.id] || []).map(pid => 
                availableProducts.find(p => p.id === pid)
              ).filter(Boolean);
              
              return (
                <div key={division.id} className="mapping-group">
                  <div className="mapping-header">
                    <span className="division-name">{division.name}</span>
                    <button 
                      type="button" 
                      className="remove-division-btn"
                      onClick={() => removeDivision(division.id)}
                      title="Remove division"
                    >
                      ×
                    </button>
                  </div>
                  <div className="products-list">
                    {selectedProducts.length === 0 ? (
                      <span className="no-products">No products selected</span>
                    ) : (
                      selectedProducts.map((product) => (
                        <div key={product.id} className="product-item">
                          <span className="product-name">{product.name}</span>
                          <button 
                            type="button" 
                            className="remove-product-btn"
                            onClick={() => removeProduct(division.id, product.id)}
                            title="Remove product"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Navbar title="Outlet Management" />
        <div className="page-content">

          {/* Hero */}
          <div className="page-hero">
            <div>
              <h2 className="hero-title">Outlet Management</h2>
              
            </div>
            <button className="btn-primary" onClick={openAddModal}>
              <IcPlus /> Add Outlet
            </button>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { label: "Total Outlets",   value: outlets.length,   color: "#6366f1", bg: "#eef2ff", icon: <IcOutlet /> },
              { label: "Filtered",        value: filtered.length,  color: "#10b981", bg: "#ecfdf5", icon: <IcSearch /> },
              { label: "Locations Used",  value: [...new Set(outlets.map((o) => o.locationName).filter(Boolean))].length, color: "#f59e0b", bg: "#fffbeb", icon: <IcLocation /> },
              { label: "Types",           value: [...new Set(outlets.map((o) => o.outletType).filter(Boolean))].length,   color: "#06b6d4", bg: "#ecfeff", icon: <IcGrid /> },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div className="stat-value" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="error-banner"><IcWarn />{error}</div>}

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-ico"><IcSearch /></span>
              <input placeholder="Search by name, type, location…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              {search && <button className="search-clear" onClick={() => { setSearch(""); setPage(1); }}><IcX /></button>}
            </div>
            <div className="toolbar-right">
              <div className="show-entries">
                <span>Show</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div className="view-toggle">
                <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Table"><IcTable /></button>
                <button className={view === "card"  ? "active" : ""} onClick={() => setView("card")}  title="Cards"><IcGrid /></button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {view === "table" && (
            <div className="table-wrap">
              <table className="outlet-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Outlet Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Divisions</th>
                    <th>Products</th>
                    <th>Owner Name</th>
                    <th>Address</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4,5].map((i) => (
                      <tr key={i}>
                        {[50,140,100,90,110,140,140,100,120,110].map((w, j) => (
                          <td key={j}><span className="skel" style={{ width: w }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={10}>
                      <div className="empty-state">
                        <div className="empty-icon"><IcOutlet /></div>
                        <p>{search ? "No outlets match your search" : "No outlets yet"}</p>
                        {!search && (
                          <button className="btn-primary sm" onClick={openAddModal}>
                            <IcPlus /> Add First Outlet
                          </button>
                        )}
                      </div>
                    </td></tr>
                  ) : (
                    paginated.map((o, i) => {
                      const tc = TYPE_COLOR[o.outletType] ?? { bg: "#f1f5f9", color: "#64748b" };
                      return (
                        <tr key={o.id}>
                          <td className="td-num">{(safePage - 1) * pageSize + i + 1}</td>
                          <td>
                            <div className="td-name-wrap">
                              <span className="td-avatar">{o.outletName?.charAt(0).toUpperCase()}</span>
                              <span className="td-name">{o.outletName}</span>
                            </div>
                          </td>
                          <td>
                            {o.outletCode
                              ? <span className="td-code-pill">{o.outletCode}</span>
                              : <span className="td-muted">—</span>}
                          </td>
                          <td>
                            {o.outletType
                              ? <span className="type-badge" style={{ background: tc.bg, color: tc.color }}>{o.outletType}</span>
                              : <span className="td-muted">—</span>}
                          </td>
                          <td className="td-location">
                            {o.locationName
                              ? <span className="td-loc-wrap"><IcLocation />{o.locationName}</span>
                              : <span className="td-muted">—</span>}
                          </td>
                          <td>
                            <div className="div-tags">
                              {(o.divisionNames ?? []).length === 0
                                ? <span className="td-muted">—</span>
                                : (o.divisionNames ?? []).map((d) => (
                                    <span key={d} className="div-tag">{d}</span>
                                  ))}
                            </div>
                          </td>
                          <td>
                            <div className="div-tags">
                              {(o.productNames ?? []).length === 0
                                ? <span className="td-muted">—</span>
                                : (o.productNames ?? []).map((p, idx) => (
                                    <span key={`${p}-${idx}`} className="div-tag" style={{ background: '#eef2ff', color: '#6366f1' }}>{p}</span>
                                  ))}
                            </div>
                          </td>
                          <td className="td-owner">
                            {o.ownerName
                              ? <span className="td-owner-wrap"><IcOwner />{o.ownerName}</span>
                              : <span className="td-muted">—</span>}
                          </td>
                          <td className="td-address">
                            {o.address
                              ? <span className="td-address-text">{o.address}</span>
                              : <span className="td-muted">—</span>}
                          </td>
                          <td>
                            <div className="action-btns">
                              <button className="act-btn edit" onClick={() => openEditModal(o)} title="Edit"><IcEdit /></button>
                              <button className="act-btn del"  onClick={() => setDeleteModal(o)} title="Delete"><IcTrash /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Card View */}
          {view === "card" && (
            <div className="card-grid">
              {loading ? (
                [1,2,3,4,5,6].map((i) => <div key={i} className="outlet-card skeleton-card" />)
              ) : paginated.length === 0 ? (
                <div className="empty-state full-width">
                  <div className="empty-icon"><IcOutlet /></div>
                  <p>{search ? "No outlets match your search" : "No outlets yet"}</p>
                </div>
              ) : (
                paginated.map((o, i) => {
                  const tc = TYPE_COLOR[o.outletType] ?? { bg: "#f1f5f9", color: "#64748b" };
                  return (
                    <div className="outlet-card" key={o.id}>
                      <div className="oc-top">
                        <div className="oc-avatar">{o.outletName?.charAt(0).toUpperCase()}</div>
                        <span className="oc-index">#{(safePage - 1) * pageSize + i + 1}</span>
                      </div>
                      <div className="oc-name">{o.outletName}</div>
                      {o.outletCode && <div className="oc-code">{o.outletCode}</div>}
                      <div className="oc-meta-row">
                        {o.outletType && (
                          <span className="type-badge" style={{ background: tc.bg, color: tc.color }}>{o.outletType}</span>
                        )}
                        {o.locationName && (
                          <span className="oc-loc"><IcLocation />{o.locationName}</span>
                        )}
                      </div>
                      {(o.divisionNames ?? []).length > 0 && (
                        <div className="div-tags">
                          {o.divisionNames.map((d) => <span key={d} className="div-tag">{d}</span>)}
                        </div>
                      )}
                      {(o.productNames ?? []).length > 0 && (
                        <div className="div-tags">
                          {o.productNames.map((p, idx) => <span key={`${p}-${idx}`} className="div-tag" style={{ background: '#eef2ff', color: '#6366f1' }}>{p}</span>)}
                        </div>
                      )}
                      {o.ownerName && (
                        <div className="oc-owner"><IcOwner />{o.ownerName}</div>
                      )}
                      {o.address && (
                        <div className="oc-address">{o.address}</div>
                      )}
                      <div className="oc-actions">
                        <button className="act-btn edit" onClick={() => openEditModal(o)}><IcEdit /> Edit</button>
                        <button className="act-btn del"  onClick={() => setDeleteModal(o)}><IcTrash /> Delete</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="pagination-bar">
              <span className="pag-info">
                Showing <strong>{start}–{end}</strong> of <strong>{filtered.length}</strong> entries
              </span>
              <div className="pag-btns">
                <button disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                <button disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "…"
                    ? <span key={`e${i}`} className="pag-ellipsis">…</span>
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
        <Modal title="Add Outlet" subtitle="Register a new outlet" icon={<IcPlus />} accent="#6366f1"
          onClose={() => { setAddModal(false); setForm(EMPTY_FORM); }}>
          {renderFormFields()}
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => { setAddModal(false); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="modal-btn confirm" onClick={handleAdd} disabled={saving || !isValid()}>
              {saving ? <span className="btn-spinner" /> : <IcPlus />}
              {saving ? "Adding…" : "Add Outlet"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit Outlet" subtitle={`Editing: ${editModal.outletName}`} icon={<IcEdit />} accent="#8b5cf6"
          onClose={() => { setEditModal(null); setForm(EMPTY_FORM); }}>
          {renderFormFields()}
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => { setEditModal(null); setForm(EMPTY_FORM); }}>Cancel</button>
            <button className="modal-btn confirm" style={{ "--btn-color": "#8b5cf6" }} onClick={handleUpdate} disabled={saving || !isValid()}>
              {saving ? <span className="btn-spinner" /> : <IcEdit />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <Modal title="Delete Outlet" subtitle="This action cannot be undone" icon={<IcWarn />} accent="#ef4444"
          onClose={() => setDeleteModal(null)}>
          <div className="delete-body">
            <p>Are you sure you want to delete <strong>"{deleteModal.outletName}"</strong>?</p>
            <p className="delete-warn">All associated data will be permanently removed.</p>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="modal-btn danger" onClick={handleDelete} disabled={saving}>
              {saving ? <span className="btn-spinner" /> : <IcTrash />}
              {saving ? "Deleting…" : "Delete Outlet"}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
