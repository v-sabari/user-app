import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function Users() {
  const navigate = useNavigate();

  // ================= LIST STATE =================
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5); // ✅ Day 61 — mutable page size
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState("name");
  const [direction, setDirection] = useState("asc");
  const [listMessage, setListMessage] = useState("");
  const [listError, setListError] = useState("");

  // ✅ Day 61 — Export state
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

  // ================= ADD USER STATE =================
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", password: "", role: "USER", status: "ACTIVE",
  });
  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  // ================= EDIT USER STATE =================
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "", email: "", role: "", status: "",
  });
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");

  // ================= TEMP PASSWORD STATE =================
  const [tempPasswordData, setTempPasswordData] = useState(null);

  // ================= LOGOUT =================
  const handleLogout = () => { logoutUser(); navigate("/login"); };

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    setListError("");
    try {
      const query = new URLSearchParams({
        search: searchTerm, role: roleFilter, status: statusFilter,
        page, size, sortBy, direction,
      });
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

  // ================= CLEAR FILTERS =================
  const handleClearFilters = () => {
    setSearchTerm(""); setRoleFilter(""); setStatusFilter("");
    setSortBy("name"); setDirection("asc"); setPage(0);
  };

  // ================= DAY 61 — EXPORT USERS CSV =================
  const buildExportQuery = () => {
    const query = new URLSearchParams({
      search: searchTerm,
      role: roleFilter,
      status: statusFilter,
      sortBy,
      direction,
    });
    return query.toString();
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setListMessage("");
    setListError("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/users/export?${buildExportQuery()}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Export failed");

      const disposition = res.headers.get("Content-Disposition");
      let filename = "users-export.csv";
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "").trim();
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setListMessage(`Exported successfully as ${filename}`);
    } catch (err) {
      setListError(err.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  // ================= SELECT ONE =================
  const handleSelectOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === users.length ? [] : users.map((u) => u.id));
  };

  // ================= BULK ACTION =================
  const handleBulkAction = async () => {
    if (selectedIds.length === 0) { setListError("Please select at least one user"); return; }
    if (!bulkAction) { setListError("Please select a bulk action"); return; }
    if (!window.confirm(`Apply "${bulkAction}" to ${selectedIds.length} selected user(s)?`)) return;

    setBulkLoading(true);
    setListMessage(""); setListError("");

    try {
      const data = await apiRequest("/users/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedIds, action: bulkAction }),
      });
      setListMessage(data.message || "Bulk action applied successfully");
      setSelectedIds([]); setBulkAction("");
      fetchUsers();
    } catch (err) {
      setListError(err.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // ================= VIEW HISTORY =================
  const handleViewHistory = async (user) => {
    if (historyUserId === user.id) {
      setHistoryUserId(null); setHistoryUserEmail(""); setHistoryLogs([]); setHistoryError("");
      return;
    }
    setHistoryUserId(user.id); setHistoryUserEmail(user.email);
    setHistoryLogs([]); setHistoryLoading(true); setHistoryError("");
    try {
      const data = await apiRequest(`/users/${user.id}/history`, { method: "GET" });
      setHistoryLogs(data.data || []);
    } catch (err) {
      setHistoryError(err.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ================= ADD USER =================
  const handleAddUser = async (e) => {
    e.preventDefault(); setAddMessage(""); setAddError("");
    try {
      await apiRequest("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      setAddMessage("User added successfully");
      setAddForm({ name: "", email: "", password: "", role: "USER", status: "ACTIVE" });
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      setAddError(err.message || "Failed to add user");
    }
  };

  // ================= OPEN EDIT =================
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, status: user.status });
    setEditMessage(""); setEditError(""); setTempPasswordData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= SAVE EDIT =================
  const handleSaveEdit = async (e) => {
    e.preventDefault(); setEditMessage(""); setEditError("");
    try {
      await apiRequest(`/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditMessage("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err.message || "Failed to update user");
    }
  };

  // ================= STATUS ACTION =================
  const handleStatusAction = async (id, action) => {
    setListMessage(""); setListError("");
    try {
      await apiRequest(`/users/${id}/${action}`, { method: "PUT" });
      const labels = { activate: "User activated", deactivate: "User deactivated", lock: "User locked", unlock: "User unlocked" };
      setListMessage(labels[action] || "Action successful");
      fetchUsers();
    } catch (err) {
      setListError(err.message || "Action failed");
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;
    setListMessage(""); setListError("");
    try {
      await apiRequest(`/users/${id}`, { method: "DELETE" });
      setListMessage("User deleted successfully");
      fetchUsers();
    } catch (err) {
      setListError(err.message || "Failed to delete user");
    }
  };

  // ================= RESET PASSWORD =================
  const handleResetPassword = async (id) => {
    if (!window.confirm("Generate temporary password and invalidate all sessions?")) return;
    setTempPasswordData(null); setListMessage(""); setListError("");
    try {
      const data = await apiRequest(`/users/${id}/reset-password`, { method: "PUT" });
      setTempPasswordData(data.data);
    } catch (err) {
      setListError(err.message || "Failed to reset password");
    }
  };

  // ================= STATUS BADGE =================
  const statusBadge = (status) => {
    const cls = status === "ACTIVE" ? "status-badge status-active"
      : status === "LOCKED" ? "status-badge status-locked"
      : "status-badge status-inactive";
    return <span className={cls}>{status}</span>;
  };

  // ================= ACTION COLOR =================
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

  // ================= FORMAT DATE =================
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    if (Array.isArray(value)) {
      const [y, mo, d, h, mi] = value;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
    }
    return new Date(value).toLocaleString();
  };

  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const someSelected = selectedIds.length > 0;
  const filtersActive = searchTerm || roleFilter || statusFilter;

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>User Management</h2>
            <p className="welcome-text">Add, edit, manage users and reset passwords.</p>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ===== TEMP PASSWORD ===== */}
        {tempPasswordData && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ fontWeight: "700", color: "#92400e" }}>⚠️ Temporary Password Generated</p>
            <p><strong>User:</strong> {tempPasswordData.email}</p>
            <p><strong>Password:</strong>{" "}
              <span style={{ fontFamily: "monospace", background: "#fff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                {tempPasswordData.temporaryPassword}
              </span>
            </p>
            <button type="button" style={{ width: "auto", marginTop: "10px", background: "#92400e" }} onClick={() => setTempPasswordData(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* ===== MESSAGES ===== */}
        {listMessage && <p className="message">{listMessage}</p>}
        {listError && <p className="error-message">{listError}</p>}

        {/* ===== EDIT USER FORM ===== */}
        {editingUser && (
          <div className="dashboard-section">
            <h3>Edit User — {editingUser.email}</h3>
            {editMessage && <p className="message">{editMessage}</p>}
            {editError && <p className="error-message">{editError}</p>}
            <form onSubmit={handleSaveEdit}>
              <input type="text" placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required minLength={2} maxLength={50} />
              <input type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="LOCKED">LOCKED</option>
              </select>
              <div className="inline-actions">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => { setEditingUser(null); setEditMessage(""); setEditError(""); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* ===== ADD USER ===== */}
        <div className="dashboard-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showAddForm ? "16px" : "0" }}>
            <h3 style={{ margin: 0 }}>Add New User</h3>
            <button type="button" style={{ width: "auto", minWidth: "120px", marginTop: 0 }}
              onClick={() => { setShowAddForm(!showAddForm); setAddMessage(""); setAddError(""); }}>
              {showAddForm ? "Cancel" : "+ Add User"}
            </button>
          </div>
          {addMessage && <p className="message">{addMessage}</p>}
          {addError && <p className="error-message">{addError}</p>}
          {showAddForm && (
            <form onSubmit={handleAddUser}>
              <input type="text" placeholder="Full name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required minLength={2} maxLength={50} />
              <input type="email" placeholder="Email address" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
              <input type="password" placeholder="Password (min 6 characters)" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required minLength={6} />
              <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="LOCKED">LOCKED</option>
              </select>
              <button type="submit">Add User</button>
            </form>
          )}
        </div>

        {/* ===== FILTER TOOLBAR ===== */}
        <div className="dashboard-section">
          <h3 style={{ marginBottom: "14px" }}>
            Filter Users
            {filtersActive && (
              <span style={{ marginLeft: "10px", fontSize: "13px", background: "#dbeafe", color: "#1d4ed8", padding: "2px 10px", borderRadius: "999px", fontWeight: "600" }}>
                {totalElements} result{totalElements !== 1 ? "s" : ""}
              </span>
            )}
          </h3>

          <div className="dashboard-toolbar">
            <input type="text" placeholder="Search by name or email..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }} />

            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
              <option value="">All Roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="LOCKED">LOCKED</option>
            </select>

            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="role">Sort by Role</option>
              <option value="status">Sort by Status</option>
            </select>

            <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(0); }}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            {filtersActive && (
              <button type="button" onClick={handleClearFilters} style={{ background: "#6b7280" }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ===== BULK ACTION BAR ===== */}
        {users.length > 0 && (
          <div style={{
            background: someSelected ? "#eff6ff" : "#f9fafb",
            border: `1px solid ${someSelected ? "#bfdbfe" : "#e5e7eb"}`,
            borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#374151" }}>
              <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
              {allSelected ? "Deselect All" : `Select All (${users.length})`}
            </label>

            {someSelected && (
              <>
                <span style={{ fontSize: "13px", color: "#2563eb", fontWeight: "600" }}>{selectedIds.length} selected</span>
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", background: "#fff", cursor: "pointer", width: "auto", marginTop: 0 }}>
                  <option value="">Select Action</option>
                  <option value="ACTIVATE">✅ Activate</option>
                  <option value="DEACTIVATE">⏸ Deactivate</option>
                  <option value="LOCK">🔒 Lock</option>
                  <option value="DELETE">🗑 Delete</option>
                </select>
                <button type="button" onClick={handleBulkAction} disabled={!bulkAction || bulkLoading}
                  style={{
                    width: "auto", minWidth: "140px", marginTop: 0,
                    background: bulkAction === "DELETE" ? "#dc2626" : bulkAction === "LOCK" ? "#7c3aed" : bulkAction === "DEACTIVATE" ? "#d97706" : "#16a34a",
                    opacity: !bulkAction || bulkLoading ? 0.6 : 1,
                  }}>
                  {bulkLoading ? "Applying..." : `Apply to ${selectedIds.length}`}
                </button>
                <button type="button" onClick={() => setSelectedIds([])}
                  style={{ width: "auto", minWidth: "80px", marginTop: 0, background: "#6b7280" }}>
                  Clear
                </button>
              </>
            )}
          </div>
        )}

        {/* ===== DAY 61 — ALL USERS HEADER + EXPORT + PAGE SIZE ===== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 14px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>
            All Users
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "#6b7280", fontWeight: "400" }}>
              ({totalElements} total)
            </span>
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

            {/* ✅ Day 61 — Page size selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "500", whiteSpace: "nowrap" }}>
                Per page:
              </span>
              <select
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                style={{ padding: "5px 8px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", background: "#fff", cursor: "pointer", width: "auto", marginTop: 0 }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* ✅ Day 61 — Export CSV button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting || totalElements === 0}
              style={{
                width: "auto", minWidth: "160px", marginTop: 0,
                background: exporting ? "#9ca3af" : totalElements === 0 ? "#d1d5db" : "#16a34a",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}
            >
              {exporting ? "Exporting..." : "⬇ Export CSV"}
            </button>
          </div>
        </div>

        {/* ===== USER LIST ===== */}
        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <div key={user.id}>
                <div className="user-card" style={{ border: selectedIds.includes(user.id) ? "2px solid #2563eb" : "1px solid #e5e7eb", background: selectedIds.includes(user.id) ? "#eff6ff" : "#ffffff" }}>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelectOne(user.id)} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                    <strong style={{ fontSize: "15px", color: "#111827" }}>{user.name}</strong>
                  </div>

                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong>{" "}
                    <span style={{ fontWeight: "700", color: user.role === "ADMIN" ? "#7c3aed" : "#374151" }}>{user.role}</span>
                  </p>
                  <p><strong>Status:</strong> {statusBadge(user.status)}</p>

                  <div className="user-actions">
                    <button type="button" onClick={() => handleOpenEdit(user)}>Edit</button>
                    <button type="button" style={{ background: "#16a34a" }} onClick={() => handleStatusAction(user.id, "activate")} disabled={user.status === "ACTIVE"}>Activate</button>
                    <button type="button" style={{ background: "#d97706" }} onClick={() => handleStatusAction(user.id, "deactivate")} disabled={user.status === "INACTIVE"}>Deactivate</button>
                    <button type="button" style={{ background: "#7c3aed" }} onClick={() => handleStatusAction(user.id, "lock")} disabled={user.status === "LOCKED"}>Lock</button>
                    <button type="button" style={{ background: "#0891b2" }} onClick={() => handleStatusAction(user.id, "unlock")} disabled={user.status === "ACTIVE"}>Unlock</button>
                    <button type="button" style={{ background: "#92400e" }} onClick={() => handleResetPassword(user.id)}>Reset Password</button>
                    <button type="button" style={{ background: historyUserId === user.id ? "#1e40af" : "#374151" }} onClick={() => handleViewHistory(user)}>
                      {historyUserId === user.id ? "Hide History" : "View History"}
                    </button>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(user.id, user.email)}>Delete</button>
                  </div>
                </div>

                {/* ===== HISTORY TIMELINE ===== */}
                {historyUserId === user.id && (
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "16px", marginBottom: "4px" }}>
                    <p style={{ fontWeight: "700", marginBottom: "10px", color: "#1e293b", fontSize: "14px" }}>
                      📋 Account History — {historyUserEmail}
                    </p>
                    {historyLoading && <p style={{ color: "#6b7280", fontSize: "13px" }}>Loading history...</p>}
                    {historyError && <p className="error-message">{historyError}</p>}
                    {!historyLoading && historyLogs.length === 0 && <p style={{ color: "#9ca3af", fontSize: "13px" }}>No history found.</p>}
                    {!historyLoading && historyLogs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {historyLogs.map((log) => (
                          <div key={log.id} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px", background: "#fff", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: getActionColor(log.action), flexShrink: 0, marginTop: "4px" }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                <span style={{ fontFamily: "monospace", background: getActionColor(log.action) + "18", color: getActionColor(log.action), padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                                  {log.action}
                                </span>
                                <span style={{ fontSize: "12px", color: "#6b7280" }}>by <strong>{log.actorEmail}</strong></span>
                              </div>
                              {log.details && <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>{log.details}</p>}
                            </div>
                            <span style={{ fontSize: "11px", color: "#9ca3af", flexShrink: 0, whiteSpace: "nowrap" }}>{formatDateTime(log.createdAt)}</span>
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
          <button type="button" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</button>
          <span>Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
          <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1 || totalPages === 0}>Next</button>
        </div>

      </div>
    </div>
  );
}

export default Users;