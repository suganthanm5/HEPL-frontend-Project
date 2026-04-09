import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getLocations, createLocation, updateLocation, deleteLocation } from "../../services/locationService";
import "./Location.css";

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
const IcLocation = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const IcWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ── Modal ── */
const Modal = ({ title, subtitle, icon, accent = "#10b981", onClose, children }) => (
  <div className="loc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="loc-modal-box">
      <div className="loc-modal-header" style={{ "--accent": accent }}>
        <div className="loc-modal-icon" style={{ background: `${accent}20`, color: accent }}>{icon}</div>
        <div>
          <h3 className="loc-modal-title">{title}</h3>
          {subtitle && <p className="loc-modal-subtitle">{subtitle}</p>}
        </div>
        <button className="loc-modal-close" onClick={onClose}><IcX /></button>
      </div>
      <div className="loc-modal-body">{children}</div>
    </div>
  </div>
);

const PAGE_SIZES = [5, 10, 25, 50];

const Location = () => {
  const [locations, setLocations] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [pageSize,  setPageSize]  = useState(10);
  const [page,      setPage]      = useState(1);
  const [view,      setView]      = useState("table");
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  /* modals */
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  /* form */
  const [addName,  setAddName]  = useState("");
  const [editName, setEditName] = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { fetchLocations(); }, [page, pageSize, search]);

  const fetchLocations = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getLocations(page - 1, pageSize, search);
      const pageData = res?.data?.data;
      setLocations(pageData?.content || []);
      setTotalPages(pageData?.totalPages || 1);
      setTotalElements(pageData?.totalElements || 0);
    } catch (e) {
      setError("Failed to load locations. Check API connection.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setSaving(true);
    try {
      await createLocation({ name: addName.trim() });
      setPage(1);
      fetchLocations();
      setAddName(""); setAddModal(false);
    } catch (e) {
      alert("Failed to add: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateLocation(editModal.id, { name: editName.trim() });
      fetchLocations();
      setEditModal(null);
    } catch (e) {
      alert("Failed to update: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteLocation(deleteModal.id);
      fetchLocations();
      setDeleteModal(null);
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const openEdit = (loc) => { setEditModal(loc); setEditName(loc.name); };

  const safePage = Math.min(page, totalPages || 1);
  const start    = totalElements === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end      = Math.min(safePage * pageSize, totalElements);

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Navbar title="Location Management" />
        <div className="page-content">

          {/* Hero */}
          <div className="loc-hero">
            <div>
              <h2 className="loc-hero-title">Location Management</h2>
              
            </div>
            <button className="loc-btn-primary" onClick={() => { setAddName(""); setAddModal(true); }}>
              <IcPlus /> Add Location
            </button>
          </div>

          {/* Stats */}
          <div className="loc-stats">
            {[
              { label: "Total Locations", value: totalElements, color: "#10b981", bg: "#ecfdf5", icon: <IcLocation /> },
              { label: "Current Page", value: locations.length, color: "#6366f1", bg: "#eef2ff", icon: <IcSearch /> },
              { label: "Total Pages", value: totalPages, color: "#f59e0b", bg: "#fffbeb", icon: <IcGrid /> },
            ].map((s) => (
              <div className="loc-stat-card" key={s.label}>
                <div className="loc-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div className="loc-stat-value" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
                  <div className="loc-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="loc-error"><IcWarn />{error}</div>}

          {/* Toolbar */}
          <div className="loc-toolbar">
            <div className="loc-search-wrap">
              <span className="loc-search-ico"><IcSearch /></span>
              <input
                placeholder="Search locations…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button className="loc-search-clear" onClick={() => { setSearch(""); setPage(1); }}>
                  <IcX />
                </button>
              )}
            </div>
            <div className="loc-toolbar-right">
              <div className="loc-show-entries">
                <span>Show</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div className="loc-view-toggle">
                <button className={view === "table" ? "active" : ""} onClick={() => setView("table")} title="Table"><IcTable /></button>
                <button className={view === "card"  ? "active" : ""} onClick={() => setView("card")}  title="Cards"><IcGrid /></button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {view === "table" && (
            <div className="loc-table-wrap">
              <table className="loc-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Location Name</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4,5].map((i) => (
                      <tr key={i}>
                        <td><span className="loc-skel" style={{ width: 24 }} /></td>
                        <td><span className="loc-skel" style={{ width: "60%" }} /></td>
                        <td><span className="loc-skel" style={{ width: 100 }} /></td>
                      </tr>
                    ))
                  ) : locations.length === 0 ? (
                    <tr><td colSpan={3}>
                      <div className="loc-empty">
                        <div className="loc-empty-icon"><IcLocation /></div>
                        <p>{search ? "No locations match your search" : "No locations yet"}</p>
                        {!search && (
                          <button className="loc-btn-primary sm" onClick={() => { setAddName(""); setAddModal(true); }}>
                            <IcPlus /> Add First Location
                          </button>
                        )}
                      </div>
                    </td></tr>
                  ) : (
                    locations.map((loc, i) => (
                      <tr key={loc.id}>
                        <td className="loc-td-num">{(safePage - 1) * pageSize + i + 1}</td>
                        <td>
                          <div className="loc-td-name-wrap">
                            <span className="loc-td-avatar">{loc.name?.charAt(0).toUpperCase()}</span>
                            <span className="loc-td-name">{loc.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="loc-action-btns">
                            <button className="loc-act-btn edit" onClick={() => openEdit(loc)} title="Edit"><IcEdit /></button>
                            <button className="loc-act-btn del"  onClick={() => setDeleteModal(loc)} title="Delete"><IcTrash /></button>
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
            <div className="loc-card-grid">
              {loading ? (
                [1,2,3,4,5,6].map((i) => <div key={i} className="loc-card loc-skeleton-card" />)
              ) : locations.length === 0 ? (
                <div className="loc-empty full-width">
                  <div className="loc-empty-icon"><IcLocation /></div>
                  <p>{search ? "No locations match your search" : "No locations yet"}</p>
                </div>
              ) : (
                locations.map((loc, i) => (
                  <div className="loc-card" key={loc.id}>
                    <div className="loc-card-top">
                      <div className="loc-card-avatar">{loc.name?.charAt(0).toUpperCase()}</div>
                      <span className="loc-card-index">#{(safePage - 1) * pageSize + i + 1}</span>
                    </div>
                    <div className="loc-card-name">{loc.name}</div>
                    <div className="loc-card-meta">Location Node</div>
                    <div className="loc-card-actions">
                      <button className="loc-act-btn edit" onClick={() => openEdit(loc)}><IcEdit /> Edit</button>
                      <button className="loc-act-btn del"  onClick={() => setDeleteModal(loc)}><IcTrash /> Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalElements > 0 && (
            <div className="loc-pagination">
              <span className="loc-pag-info">
                Showing <strong>{start}–{end}</strong> of <strong>{totalElements}</strong> entries
              </span>
              <div className="loc-pag-btns">
                <button disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                <button disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "…"
                    ? <span key={`e${i}`} className="loc-pag-ellipsis">…</span>
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
        <Modal title="Add Location" subtitle="Create a new location node" icon={<IcPlus />} accent="#10b981"
          onClose={() => { setAddModal(false); setAddName(""); }}>
          <div className="loc-modal-field">
            <label>Location Name <span className="loc-req">*</span></label>
            <input
              autoFocus
              placeholder="e.g. Colombo"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="loc-modal-actions">
            <button className="loc-modal-btn cancel" onClick={() => { setAddModal(false); setAddName(""); }}>Cancel</button>
            <button className="loc-modal-btn confirm" onClick={handleAdd} disabled={saving || !addName.trim()}>
              {saving ? <span className="loc-spinner" /> : <IcPlus />}
              {saving ? "Adding…" : "Add Location"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editModal && (
        <Modal title="Edit Location" subtitle={`Editing: ${editModal.name}`} icon={<IcEdit />} accent="#6366f1"
          onClose={() => setEditModal(null)}>
          <div className="loc-modal-field">
            <label>Location Name <span className="loc-req">*</span></label>
            <input
              autoFocus
              placeholder="Location name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
            />
          </div>
          <div className="loc-modal-actions">
            <button className="loc-modal-btn cancel" onClick={() => setEditModal(null)}>Cancel</button>
            <button className="loc-modal-btn confirm" style={{ "--btn-color": "#6366f1" }} onClick={handleUpdate} disabled={saving || !editName.trim()}>
              {saving ? <span className="loc-spinner" /> : <IcEdit />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <Modal title="Delete Location" subtitle="This action cannot be undone" icon={<IcWarn />} accent="#ef4444"
          onClose={() => setDeleteModal(null)}>
          <div className="loc-delete-body">
            <p>Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?</p>
            <p className="loc-delete-warn">All associated data will be permanently removed.</p>
          </div>
          <div className="loc-modal-actions">
            <button className="loc-modal-btn cancel" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="loc-modal-btn danger" onClick={handleDelete} disabled={saving}>
              {saving ? <span className="loc-spinner" /> : <IcTrash />}
              {saving ? "Deleting…" : "Delete Location"}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Location;
