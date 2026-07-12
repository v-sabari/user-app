import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, Banner, StatCard } from "./ui";

function Users() {
  const navigate = useNavigate();

  // ================= LIST STATE =================
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("asc");
  const [listMessage, setListMessage] = useState("");
  const [listError, setListError] = useState("");

  const [exporting, setExporting] = useState(false);

  // ================= BULK STATE =================
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // ================= HISTORY STATE =================
  const [historyUserId, setHistoryUserId] = useState(null);
  const [historyUserEmail, setHistoryUserEmail] = useState("");
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // ✅ Day 72 — Login stats state
  const [statsUserId, setStatsUserId] = useState(null);
  const [statsData, setStatsData] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  // ================= ADD USER STATE =================
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "USER", status: "ACTIVE" });
  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  // ================= EDIT USER STATE =================
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", status: "" });
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");

  const [tempPasswordData, setTempPasswordData] = useState(null);
// ✅ ADD THIS BLOCK HERE
const [noteEditingId, setNoteEditingId] = useState(null);
const [noteDrafts, setNoteDrafts] = useState({});
  // Day 63 — Reason modal
  const [reasonModal, setReasonModal] = useState(null);

  const handleLogout = () => { logoutUser(); navigate("/login"); };

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    setListError("");
    try {
      const query = new URLSearchParams({ search: searchTerm, role: roleFilter, status: statusFilter, page, size, sortBy, direction });
      const data = await apiRequest(`/users?${query.toString()}`, { method: "GET" });
      setUsers(data?.data?.content || []);
      setTotalPages(data?.data?.totalPages || 0);
      setTotalElements(data?.data?.totalElements || 0);
      setSelectedIds([]);
    } catch (err) {
      if (err.message === "Session expired") { logoutUser(); navigate("/login"); return; }
      if (err.message === "Access denied") { navigate("/dashboard"); return; }
      setListError(err.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") { navigate("/dashboard"); return; }
    fetchUsers();
  }, [page, size, sortBy, direction, searchTerm, roleFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchTerm(""); setRoleFilter(""); setStatusFilter("");
    setSortBy("name"); setDirection("asc"); setPage(0);
  };

  // ================= EXPORT CSV =================
  const buildExportQuery = () => new URLSearchParams({ search: searchTerm, role: roleFilter, status: statusFilter, sortBy, direction }).toString();

  const handleExportCsv = async () => {
    setExporting(true); setListMessage(""); setListError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/users/export?${buildExportQuery()}`, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export failed");
      const disposition = res.headers.get("Content-Disposition");
      let filename = "users-export.csv";
      if (disposition && disposition.includes("filename=")) filename = disposition.split("filename=")[1].replace(/"/g, "").trim();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setListMessage(`Exported successfully as ${filename}`);
    } catch (err) {
      setListError(err.message || "Failed to export");
    } finally { setExporting(false); }
  };

  // ================= SELECT =================
  const handleSelectOne = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedIds(selectedIds.length === users.length ? [] : users.map((u) => u.id));

  // ================= BULK ACTION =================
  const handleBulkAction = async () => {
    if (selectedIds.length === 0) { setListError("Please select at least one user"); return; }
    if (!bulkAction) { setListError("Please select a bulk action"); return; }
    if (!window.confirm(`Apply "${bulkAction}" to ${selectedIds.length} selected user(s)?`)) return;
    setBulkLoading(true); setListMessage(""); setListError("");
    try {
      const data = await apiRequest("/users/bulk-action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: selectedIds, action: bulkAction }) });
      setListMessage(data.message || "Bulk action applied successfully");
      setSelectedIds([]); setBulkAction(""); fetchUsers();
    } catch (err) { setListError(err.message || "Bulk action failed"); }
    finally { setBulkLoading(false); }
  };

  // ================= VIEW HISTORY =================
  const handleViewHistory = async (user) => {
    if (historyUserId === user.id) { setHistoryUserId(null); setHistoryUserEmail(""); setHistoryLogs([]); setHistoryError(""); return; }
    setHistoryUserId(user.id); setHistoryUserEmail(user.email);
    setHistoryLogs([]); setHistoryLoading(true); setHistoryError("");
    try {
      const data = await apiRequest(`/users/${user.id}/history`, { method: "GET" });
      setHistoryLogs(data.data || []);
    } catch (err) { setHistoryError(err.message || "Failed to load history"); }
    finally { setHistoryLoading(false); }
  };

  // ✅ Day 72 — VIEW LOGIN STATS
  const handleViewStats = async (user) => {
    if (statsUserId === user.id) { setStatsUserId(null); return; }
    setStatsUserId(user.id);
    setStatsLoading(true);
    try {
      const data = await apiRequest(`/users/${user.id}/login-stats`, { method: "GET" });
      setStatsData((prev) => ({ ...prev, [user.id]: data.data }));
    } catch (err) {
      setStatsData((prev) => ({ ...prev, [user.id]: { error: err.message || "Failed to load stats" } }));
    } finally { setStatsLoading(false); }
  };

  // ================= ADD USER =================
  const handleAddUser = async (e) => {
    e.preventDefault(); setAddMessage(""); setAddError("");
    try {
      await apiRequest("/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
      setAddMessage("User added successfully");
      setAddForm({ name: "", email: "", password: "", role: "USER", status: "ACTIVE" });
      setShowAddForm(false); fetchUsers();
    } catch (err) { setAddError(err.message || "Failed to add user"); }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setEditMessage(""); setEditError(""); setTempPasswordData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault(); setEditMessage(""); setEditError("");
    try {
      await apiRequest(`/users/${editingUser.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      setEditMessage("User updated successfully");
      setEditingUser(null); fetchUsers();
    } catch (err) { setEditError(err.message || "Failed to update user"); }
  };

  const openReasonModal = (userId, userEmail, action) => { setReasonModal({ userId, userEmail, action, reasonText: "" }); setListMessage(""); setListError(""); };

  const handleConfirmWithReason = async () => {
    if (!reasonModal) return;
    const { userId, userEmail, action, reasonText } = reasonModal;
    setReasonModal(null); setListMessage(""); setListError("");
    try {
      if (action === "delete") {
        await apiRequest(`/users/${userId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reasonText }) });
        setListMessage(`${userEmail} deleted successfully`);
      } else {
        await apiRequest(`/users/${userId}/${action}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reasonText }) });
        const labels = { deactivate: "deactivated", lock: "locked" };
        setListMessage(`${userEmail} ${labels[action] || action} successfully`);
      }
      fetchUsers();
    } catch (err) { setListError(err.message || "Action failed"); }
  };

  const handleStatusAction = async (id, action) => {
    setListMessage(""); setListError("");
    try {
      await apiRequest(`/users/${id}/${action}`, { method: "PUT" });
      const labels = { activate: "User activated", unlock: "User unlocked" };
      setListMessage(labels[action] || "Action successful");
      fetchUsers();
    } catch (err) { setListError(err.message || "Action failed"); }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Generate temporary password and invalidate all sessions?")) return;
    setTempPasswordData(null); setListMessage(""); setListError("");
    try {
      const data = await apiRequest(`/users/${id}/reset-password`, { method: "PUT" });
      setTempPasswordData(data.data);
    } catch (err) { setListError(err.message || "Failed to reset password"); }
  };

  const statusBadge = (status) => {
    const cls = status === "ACTIVE" ? "status-badge status-active" : status === "LOCKED" ? "status-badge status-locked" : "status-badge status-inactive";
    return <span className={cls}>{status}</span>;
  };

  const getActionColor = (action) => {
    if (!action) return "#374151";
    const a = action.toUpperCase();
    if (a.includes("LOCK")) return "#7c3aed";
    if (a.includes("DELETE")) return "#dc2626";
    if (a.includes("ACTIVATE")) return "#16a34a";
    if (a.includes("UNLOCK")) return "#0891b2";
    if (a.includes("DEACTIVATE")) return "#d97706";
    if (a.includes("RESET")) return "#92400e";
    if (a.includes("UPDATE")) return "#2563eb";
    return "#374151";
  };

  const formatDateTime = (value) => {
    if (!value) return "Never";
    if (Array.isArray(value)) {
      const [y, mo, d, h, mi] = value;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
    }
    return new Date(value).toLocaleString();
  };

  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const someSelected = selectedIds.length > 0;
  const filtersActive = searchTerm || roleFilter || statusFilter;

  const getModalLabel = (action) => {
    if (action === "lock") return { title: "🔒 Lock User", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
    if (action === "deactivate") return { title: "⏸ Deactivate User", color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    if (action === "delete") return { title: "🗑 Delete User", color: "#dc2626", bg: "#fff1f2", border: "#fecaca" };
    return { title: "Confirm Action", color: "#374151", bg: "#f9fafb", border: "#e5e7eb" };
  };
  
  const handleSaveNote = async (id) => {
  try {
    await apiRequest(`/users/${id}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteDrafts[id] || "" })
    });

    setNoteEditingId(null);
    setNoteText("");
    fetchUsers();
  } catch (err) {
    setListError(err.message || "Failed to save note");
  }
};
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>User management</h2>
            <p className="welcome-text">Add, edit, manage users and reset passwords.</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* ===== REASON MODAL ===== */}
        {reasonModal && (() => {
          const { action, userEmail, reasonText } = reasonModal;
          const label = getModalLabel(action);
          return (
            <div className="modal-overlay">
              <div className="modal-panel" style={{ borderColor: label.border }}>
                <h3 style={{ margin: "0 0 6px", color: label.color, fontSize: "18px" }}>{label.title}</h3>
                <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: "14px" }}>Target: <strong>{userEmail}</strong></p>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "6px" }}>
                  Reason <span style={{ color: "var(--faint)", fontWeight: "400" }}>(optional)</span>
                </label>
                <textarea placeholder={`Why are you ${action === "delete" ? "deleting" : action === "lock" ? "locking" : "deactivating"} this user?`}
                  value={reasonText} onChange={(e) => setReasonModal({ ...reasonModal, reasonText: e.target.value })}
                  rows={3} autoFocus
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--line-strong)", fontSize: "14px", resize: "vertical", fontFamily: "inherit", marginBottom: "20px", boxSizing: "border-box", outline: "none", background: "var(--surface-sunken)" }} />
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <Button type="button" variant="secondary" onClick={() => setReasonModal(null)}>Cancel</Button>
                  <Button type="button" variant="secondary" style={{ background: label.color, color: "#fff" }} onClick={handleConfirmWithReason}>
                    Confirm {action === "delete" ? "delete" : action === "lock" ? "lock" : "deactivate"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== TEMP PASSWORD ===== */}
        {tempPasswordData && (
          <Banner tone="warning" style={{ marginBottom: "20px", flexDirection: "column", alignItems: "flex-start" }}>
            <p style={{ fontWeight: "700", margin: "0 0 6px" }}>⚠️ Temporary password generated</p>
            <p style={{ margin: "0 0 4px" }}><strong>User:</strong> {tempPasswordData.email}</p>
            <p style={{ margin: "0 0 10px" }}><strong>Password:</strong>{" "}
              <span style={{ fontFamily: "var(--font-mono)", background: "var(--surface)", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--line)" }}>{tempPasswordData.temporaryPassword}</span>
            </p>
            <Button type="button" variant="secondary" style={{ background: "var(--warning)", color: "#fff" }} onClick={() => setTempPasswordData(null)}>Dismiss</Button>
          </Banner>
        )}

        {listMessage && <p className="message">{listMessage}</p>}
        {listError && <p className="error-message">{listError}</p>}

        {/* ===== EDIT USER FORM ===== */}
        {editingUser && (
          <div className="dashboard-section">
            <h3>Edit user — {editingUser.email}</h3>
            {editMessage && <p className="message">{editMessage}</p>}
            {editError && <p className="error-message">{editError}</p>}
            <form onSubmit={handleSaveEdit}>
              <input type="text" placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required minLength={2} maxLength={50} />
              <input type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
              </select>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="LOCKED">LOCKED</option>
              </select>
              <div className="inline-actions">
                <Button type="submit" variant="primary">Save changes</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingUser(null); setEditMessage(""); setEditError(""); }}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* ===== ADD USER ===== */}
        <div className="dashboard-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showAddForm ? "16px" : "0" }}>
            <h3 style={{ margin: 0 }}>Add new user</h3>
            <Button type="button" variant="secondary" onClick={() => { setShowAddForm(!showAddForm); setAddMessage(""); setAddError(""); }}>
              {showAddForm ? "Cancel" : "+ Add user"}
            </Button>
          </div>
          {addMessage && <p className="message">{addMessage}</p>}
          {addError && <p className="error-message">{addError}</p>}
          {showAddForm && (
            <form onSubmit={handleAddUser}>
              <input type="text" placeholder="Full name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required minLength={2} maxLength={50} />
              <input type="email" placeholder="Email address" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
              <input type="password" placeholder="Password (min 6 characters)" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required minLength={6} />
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
              </select>
              <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="LOCKED">LOCKED</option>
              </select>
              <Button type="submit" variant="primary">Add user</Button>
            </form>
          )}
        </div>

        {/* ===== FILTER TOOLBAR ===== */}
        <div className="dashboard-section">
          <h3 style={{ marginBottom: "14px" }}>
            Filter users
            {filtersActive && (
              <span style={{ marginLeft: "10px", fontSize: "13px", background: "var(--primary-soft)", color: "var(--primary)", padding: "2px 10px", borderRadius: "999px", fontWeight: "600" }}>
                {totalElements} result{totalElements !== 1 ? "s" : ""}
              </span>
            )}
          </h3>
          <div className="dashboard-toolbar">
            <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }} />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
              <option value="">All roles</option><option value="USER">USER</option><option value="ADMIN">ADMIN</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">All statuses</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="LOCKED">LOCKED</option>
            </select>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
              <option value="name">Sort by name</option><option value="email">Sort by email</option><option value="role">Sort by role</option><option value="status">Sort by status</option>
            </select>
            <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(0); }}>
              <option value="asc">Ascending</option><option value="desc">Descending</option>
            </select>
            {filtersActive && <Button type="button" variant="secondary" onClick={handleClearFilters}>Clear filters</Button>}
          </div>
        </div>

        {/* ===== BULK ACTION BAR ===== */}
        {users.length > 0 && (
          <div className={`toolbar-callout ${someSelected ? "is-active" : ""}`}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "var(--ink-soft)" }}>
              <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              {allSelected ? "Deselect all" : `Select all (${users.length})`}
            </label>
            {someSelected && (
              <>
                <span style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "600" }}>{selectedIds.length} selected</span>
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "14px", background: "var(--surface)", cursor: "pointer", width: "auto", marginTop: 0 }}>
                  <option value="">Select action</option>
                  <option value="ACTIVATE">✅ Activate</option>
                  <option value="DEACTIVATE">⏸ Deactivate</option>
                  <option value="LOCK">🔒 Lock</option>
                  <option value="DELETE">🗑 Delete</option>
                </select>
                <Button type="button" variant="secondary"
                  style={{ background: bulkAction === "DELETE" ? "var(--danger)" : bulkAction === "LOCK" ? "#7c3aed" : bulkAction === "DEACTIVATE" ? "var(--warning)" : "var(--success)", color: "#fff", opacity: !bulkAction || bulkLoading ? 0.6 : 1 }}
                  onClick={handleBulkAction} disabled={!bulkAction || bulkLoading}>
                  {bulkLoading ? "Applying…" : `Apply to ${selectedIds.length}`}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelectedIds([])}>Clear</Button>
              </>
            )}
          </div>
        )}

        {/* ===== ALL USERS HEADER ===== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 14px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>
            All users
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "var(--muted)", fontWeight: "400" }}>({totalElements} total)</span>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: "500", whiteSpace: "nowrap" }}>Per page:</span>
              <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }} style={{ padding: "6px 8px", borderRadius: "8px", border: "1px solid var(--line-strong)", fontSize: "13px", background: "var(--surface)", cursor: "pointer", width: "auto", marginTop: 0 }}>
                <option value={5}>5</option><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
            </div>
            <Button type="button" variant="secondary" style={{ background: exporting ? "var(--faint)" : totalElements === 0 ? "var(--line-strong)" : "var(--success)", color: "#fff" }}
              onClick={handleExportCsv} disabled={exporting || totalElements === 0}>
              {exporting ? "Exporting…" : "⬇ Export CSV"}
            </Button>
          </div>
        </div>

        {/* ===== USER LIST ===== */}
        {users.length === 0 ? <p>No users found</p> : (
          <div className="user-list">
            {users.map((user) => (
              <div key={user.id}>
                <div className="user-card" style={{ border: selectedIds.includes(user.id) ? "2px solid #2563eb" : "1px solid #e5e7eb", background: selectedIds.includes(user.id) ? "#eff6ff" : "#ffffff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelectOne(user.id)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                    <strong style={{ fontSize: "15px", color: "#111827" }}>{user.name}</strong>
                  </div>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong>{" "}<span style={{ fontWeight: "700", color: user.role === "ADMIN" ? "#7c3aed" : "#374151" }}>{user.role}</span></p>
                  <p><strong>Status:</strong> {statusBadge(user.status)}</p>

{/* ===== ADMIN NOTE FEATURE START ===== */}
<p>
  <strong>Admin Note:</strong>{" "}
  {noteEditingId === user.id ? (
    <textarea
      value={noteDrafts[user.id] ?? user.adminNote ?? ""}
onChange={(e) =>
  setNoteDrafts((prev) => ({
    ...prev,
    [user.id]: e.target.value
  }))
}
      rows={2}
      style={{ width: "100%" }}
    />
  ) : (
    user.adminNote || "No note added"
  )}
</p>

<div className="user-actions">
  {noteEditingId === user.id ? (
    <>
      <button type="button" onClick={() => handleSaveNote(user.id)}>
        Save Note
      </button>
      <button type="button" onClick={() => {
  setNoteEditingId(null);
}}>
        Cancel
      </button>
    </>
  ) : (
    <button
      type="button"
      onClick={() => {
        setNoteEditingId(user.id);
setNoteDrafts((prev) => ({
  ...prev,
  [user.id]: user.adminNote || ""
}));
      }}
    >
      Edit Note
    </button>
  )}
</div>
{/* ===== ADMIN NOTE FEATURE END ===== */}

                  <div className="user-actions">
                    <Button type="button" variant="secondary" onClick={() => handleOpenEdit(user)}>Edit</Button>
                    <Button type="button" variant="secondary" style={{ background: "var(--success)", color: "#fff" }} onClick={() => handleStatusAction(user.id, "activate")} disabled={user.status === "ACTIVE"}>Activate</Button>
                    <Button type="button" variant="secondary" style={{ background: "var(--warning)", color: "#fff" }} onClick={() => openReasonModal(user.id, user.email, "deactivate")} disabled={user.status === "INACTIVE"}>Deactivate</Button>
                    <Button type="button" variant="secondary" style={{ background: "#7c3aed", color: "#fff" }} onClick={() => openReasonModal(user.id, user.email, "lock")} disabled={user.status === "LOCKED"}>Lock</Button>
                    <Button type="button" variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={() => handleStatusAction(user.id, "unlock")} disabled={user.status === "ACTIVE"}>Unlock</Button>
                    <Button type="button" variant="secondary" style={{ background: "#92400e", color: "#fff" }} onClick={() => handleResetPassword(user.id)}>Reset password</Button>

                    {/* ✅ Day 72 — Stats button */}
                    <Button type="button" variant="secondary"
                      style={{ background: statsUserId === user.id ? "#059669" : "#0f766e", color: "#fff" }}
                      onClick={() => handleViewStats(user)}>
                      {statsUserId === user.id ? "Hide stats" : "📊 Stats"}
                    </Button>

                    <Button type="button" variant="secondary" style={{ background: historyUserId === user.id ? "var(--primary-dark)" : "var(--ink-soft)", color: "#fff" }} onClick={() => handleViewHistory(user)}>
                      {historyUserId === user.id ? "Hide history" : "View history"}
                    </Button>
                    <Button type="button" variant="danger" onClick={() => openReasonModal(user.id, user.email, "delete")}>Delete</Button>
                  </div>
                </div>

                {/* ✅ Day 72 — LOGIN STATS PANEL */}
                {statsUserId === user.id && (
                  <div style={{ background: "var(--success-soft)", border: "1px solid #bbf7d0", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "16px", marginBottom: "4px" }}>
                    <p style={{ fontWeight: "700", marginBottom: "12px", color: "var(--success-dark)", fontSize: "14px" }}>
                      📊 Login stats — {user.email}
                    </p>

                    {statsLoading && statsData[user.id] === undefined ? (
                      <p style={{ color: "var(--muted)", fontSize: "13px" }}>Loading stats...</p>
                    ) : statsData[user.id]?.error ? (
                      <p className="error-message">{statsData[user.id].error}</p>
                    ) : statsData[user.id] ? (
                      <div className="stat-grid">

                        <StatCard
                          label="Total logins"
                          value={statsData[user.id].totalLogins ?? 0}
                          sub="successful all time"
                          accent="var(--primary)"
                          valueColor="var(--primary)"
                        />

                        <StatCard
                          label="Failed (7 days)"
                          value={statsData[user.id].recentFailedLogins ?? 0}
                          sub={statsData[user.id].recentFailedLogins > 3 ? "⚠️ suspicious" : "✅ normal"}
                          accent={statsData[user.id].recentFailedLogins > 0 ? "var(--danger)" : "var(--line-strong)"}
                          valueColor={statsData[user.id].recentFailedLogins > 0 ? "var(--danger)" : "var(--ink)"}
                        />

                        <StatCard
                          label="Total actions"
                          value={statsData[user.id].totalActions ?? 0}
                          sub="audit log entries"
                          accent="#7c3aed"
                          valueColor="#7c3aed"
                        />

                        <StatCard
                          label="Last login"
                          value={statsData[user.id].lastLoginAt ? formatDateTime(statsData[user.id].lastLoginAt) : "Never"}
                          accent="var(--info)"
                          valueColor="var(--info)"
                        />

                      </div>
                    ) : null}
                  </div>
                )}

                {/* ===== HISTORY TIMELINE ===== */}
                {historyUserId === user.id && (
                  <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--line)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "16px", marginBottom: "4px" }}>
                    <p style={{ fontWeight: "700", marginBottom: "10px", color: "var(--ink)", fontSize: "14px" }}>
                      📋 Account history — {historyUserEmail}
                    </p>
                    {historyLoading && <p style={{ color: "var(--muted)", fontSize: "13px" }}>Loading history...</p>}
                    {historyError && <p className="error-message">{historyError}</p>}
                    {!historyLoading && historyLogs.length === 0 && <p style={{ color: "var(--faint)", fontSize: "13px" }}>No history found.</p>}
                    {!historyLoading && historyLogs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {historyLogs.map((log) => (
                          <div key={log.id} style={{ border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", background: "var(--surface)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: getActionColor(log.action), flexShrink: 0, marginTop: "4px" }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                <span style={{ fontFamily: "var(--font-mono)", background: getActionColor(log.action) + "18", color: getActionColor(log.action), padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>{log.action}</span>
                                <span style={{ fontSize: "12px", color: "var(--muted)" }}>by <strong>{log.actorEmail}</strong></span>
                              </div>
                              {log.details && <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.5" }}>{log.details}</p>}
                            </div>
                            <span style={{ fontSize: "11px", color: "var(--faint)", flexShrink: 0, whiteSpace: "nowrap" }}>{formatDateTime(log.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ===== PAGINATION ===== */}
        <div className="pagination">
          <Button type="button" variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</Button>
          <span>Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
          <Button type="button" variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1 || totalPages === 0}>Next</Button>
        </div>

      </div>
    </div>
  );
}

export default Users;