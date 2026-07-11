import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button } from "./ui";

function MyActivity() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Day 65 — Filter state
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appliedAction, setAppliedAction] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");

  // ================= LOGOUT =================
  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= FETCH ACTIVITY =================
  const fetchActivity = async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({ page, size });

      // ✅ Day 65 — append filters if set
      if (appliedAction) query.append("action", appliedAction);
      if (appliedStatus) query.append("status", appliedStatus);

      const data = await apiRequest(
        `/profile/my-activity?${query.toString()}`,
        { method: "GET" }
      );

      setActivities(data.data.content || []);
      setTotalPages(data.data.totalPages || 0);
      setTotalElements(data.data.totalElements || 0);
    } catch (err) {
      if (err.message === "Session expired") {
        logoutUser();
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [page, appliedAction, appliedStatus]);

  // ================= APPLY FILTERS =================
  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedAction(actionFilter);
    setAppliedStatus(statusFilter);
  };

  // ================= CLEAR FILTERS =================
  const handleClearFilters = () => {
    setActionFilter("");
    setStatusFilter("");
    setAppliedAction("");
    setAppliedStatus("");
    setPage(0);
  };

  const filtersActive = appliedAction || appliedStatus;

  // ================= STATUS HELPERS =================
  const getStatusBadgeClass = (status) => {
    if (status === "SUCCESS" || status === "INFO") return "status-badge status-active";
    if (status === "WARNING") return "status-badge status-inactive";
    if (status === "FAILED") return "status-badge status-locked";
    return "status-badge";
  };

  // ================= ACTION COLOR =================
  const getActionColor = (action) => {
    if (action === "LOGIN") return "#2563eb";
    if (action === "LOGOUT" || action === "LOGOUT_ALL") return "#6b7280";
    if (action === "CHANGE_PASSWORD" || action === "ADMIN_RESET_PASSWORD") return "#7c3aed";
    if (action === "UPDATE_PROFILE") return "#0891b2";
    if (action === "REGISTER") return "#16a34a";
    if (action === "REFRESH_TOKEN") return "#9ca3af";
    if (action === "SESSION_LOGOUT") return "#d97706";
    if (action === "REFRESH_TOKEN_REUSE") return "#dc2626";
    if (action === "DELETE_ACCOUNT") return "#dc2626";
    return "#374151";
  };

  // ================= DATE FORMATTER =================
  const formatDateTime = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) {
      const [y, mo, d, h, min, s] = val;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s || 0).padStart(2, "0")}`;
    }
    return new Date(val).toLocaleString();
  };

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>My activity</h2>
            <p className="welcome-text">
              Your complete personal activity history —{" "}
              <strong>{totalElements}</strong> {filtersActive ? "filtered" : "total"}{" "}
              {totalElements === 1 ? "entry" : "entries"}.
            </p>
          </div>

          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate("/profile")}>My profile</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* ===== DAY 65 — FILTER BAR ===== */}
        <form onSubmit={handleApplyFilters}>
          <div className="dashboard-toolbar" style={{ marginBottom: "20px" }}>
            {/* Action filter */}
            <div style={{ flex: 1, minWidth: "160px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "5px" }}>
                Action type
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={{ width: "100%", marginTop: 0 }}
              >
                <option value="">All actions</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="REGISTER">REGISTER</option>
                <option value="CHANGE_PASSWORD">CHANGE_PASSWORD</option>
                <option value="UPDATE_PROFILE">UPDATE_PROFILE</option>
                <option value="REFRESH_TOKEN">REFRESH_TOKEN</option>
                <option value="SESSION_LOGOUT">SESSION_LOGOUT</option>
                <option value="REFRESH_TOKEN_REUSE">REFRESH_TOKEN_REUSE</option>
                <option value="DELETE_ACCOUNT">DELETE_ACCOUNT</option>
              </select>
            </div>

            {/* Status filter */}
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "5px" }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "100%", marginTop: 0 }}
              >
                <option value="">All statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="WARNING">WARNING</option>
                <option value="INFO">INFO</option>
              </select>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingBottom: "1px" }}>
              <Button type="submit" variant="primary">Apply filters</Button>
              {filtersActive && (
                <Button type="button" variant="secondary" onClick={handleClearFilters}>Clear</Button>
              )}
            </div>
          </div>
        </form>

        {/* ✅ Active filter badges */}
        {filtersActive && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {appliedAction && (
              <span style={{ fontSize: "12px", background: "var(--primary-soft)", color: "var(--primary)", padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>
                Action: {appliedAction}
              </span>
            )}
            {appliedStatus && (
              <span style={{ fontSize: "12px", background: "var(--success-soft)", color: "var(--success-dark)", padding: "3px 10px", borderRadius: "999px", fontWeight: "600" }}>
                Status: {appliedStatus}
              </span>
            )}
          </div>
        )}

        {/* ===== ERROR ===== */}
        {error && <p className="error-message">{error}</p>}

        {/* ===== LOADING ===== */}
        {loading ? (
          <p>Loading your activity...</p>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--faint)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>No activity found.</p>
            {filtersActive && (
              <p style={{ fontSize: "13px", margin: 0 }}>
                Try clearing your filters to see all activity.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* ===== ACTIVITY LIST ===== */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="user-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* ===== LEFT: Action + Status + Details ===== */}
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>

                      {/* Action badge */}
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        background: getActionColor(item.action) + "18",
                        color: getActionColor(item.action),
                        padding: "3px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        border: `1px solid ${getActionColor(item.action)}30`,
                      }}>
                        {item.action}
                      </span>

                      {/* Status badge */}
                      <span className={getStatusBadgeClass(item.status)}>
                        {item.status}
                      </span>
                    </div>

                    {/* Details */}
                    {item.details && (
                      <p style={{ margin: "0", color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                        {item.details}
                      </p>
                    )}
                  </div>

                  {/* ===== RIGHT: Timestamp ===== */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: "0", color: "var(--faint)", fontSize: "12px", fontWeight: "500" }}>
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== PAGINATION ===== */}
            <div className="pagination">
              <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</Button>
              <span>Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
              <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1 || totalPages === 0}>Next</Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default MyActivity;