import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

/**
 * ✅ Day 82 — Login History Component
 * View all login attempts with device, IP, location info
 */
function LoginHistory() {
  const navigate = useNavigate();

  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filterType, setFilterType] = useState("all"); // all, device, ip

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= FETCH LOGIN HISTORY =================
  const fetchLoginHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(
        `/login-history?page=${page}&size=${size}`,
        { method: "GET" }
      );

      setLoginHistory(data.data.content || []);
      setTotalPages(data.data.totalPages || 0);
      setTotalElements(data.data.totalElements || 0);
    } catch (err) {
      if (err.message === "Session expired") {
        logoutUser();
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to load login history");
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH LOGIN STATS =================
  const fetchLoginStats = async () => {
    try {
      const data = await apiRequest("/login-history/stats", { method: "GET" });
      setStats(data.data);
    } catch (err) {
      console.error("Failed to load stats:", err.message);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
    fetchLoginStats();
  }, [page]);

  // ================= GET STATUS BADGE STYLE =================
  const getStatusStyle = (status) => {
    if (status === "SUCCESS") {
      return { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" };
    }
    if (status === "FAILED") {
      return { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" };
    }
    return { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" };
  };

  // ================= GET DEVICE ICON =================
  const getDeviceIcon = (deviceType) => {
    if (deviceType === "MOBILE") return "📱";
    if (deviceType === "DESKTOP") return "🖥️";
    return "❓";
  };

  // ================= GET SUSPICION COLOR =================
  const getSuspicionStyle = () => {
    return { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" };
  };

  // ================= FORMAT DATE =================
  const formatDateTime = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) {
      const [y, mo, d, h, min] = val;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    try {
      return new Date(val).toLocaleString();
    } catch {
      return String(val);
    }
  };

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>📍 Login History</h2>
            <p className="welcome-text">
              View all your login attempts, devices, and locations
            </p>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button type="button" onClick={() => navigate("/profile")}>Profile</button>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ===== ERROR MESSAGE ===== */}
        {error && <p className="error-message">{error}</p>}

        {/* ===== STATS SECTION ===== */}
        {stats && (
          <div className="dashboard-section">
            <h3>Login Statistics</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "14px", borderTop: "3px solid #2563eb" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Total Logins</p>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#2563eb" }}>{stats.totalLogins ?? 0}</p>
              </div>

              <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "12px", padding: "14px", borderTop: "3px solid #16a34a" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Successful</p>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#16a34a" }}>{stats.successfulLogins ?? 0}</p>
              </div>

              <div style={{ background: stats.failedLogins > 0 ? "#fee2e2" : "#f0fdf4", border: `1px solid ${stats.failedLogins > 0 ? "#fca5a5" : "#bbf7d0"}`, borderRadius: "12px", padding: "14px", borderTop: `3px solid ${stats.failedLogins > 0 ? "#dc2626" : "#16a34a"}` }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Failed</p>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: stats.failedLogins > 0 ? "#dc2626" : "#16a34a" }}>{stats.failedLogins ?? 0}</p>
              </div>

              <div style={{ background: stats.failedLast24Hours > 0 ? "#fef3c7" : "#f0fdf4", border: `1px solid ${stats.failedLast24Hours > 0 ? "#fde68a" : "#bbf7d0"}`, borderRadius: "12px", padding: "14px", borderTop: `3px solid ${stats.failedLast24Hours > 0 ? "#d97706" : "#16a34a"}` }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Failed (24h)</p>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: stats.failedLast24Hours > 0 ? "#d97706" : "#16a34a" }}>{stats.failedLast24Hours ?? 0}</p>
              </div>

              <div style={{ background: stats.suspiciousLogins > 0 ? "#fee2e2" : "#f0fdf4", border: `1px solid ${stats.suspiciousLogins > 0 ? "#fca5a5" : "#bbf7d0"}`, borderRadius: "12px", padding: "14px", borderTop: `3px solid ${stats.suspiciousLogins > 0 ? "#dc2626" : "#16a34a"}` }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>🚨 Suspicious</p>
                <p style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: stats.suspiciousLogins > 0 ? "#dc2626" : "#16a34a" }}>{stats.suspiciousLogins ?? 0}</p>
              </div>

              <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: "12px", padding: "14px", borderTop: "3px solid #0891b2" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Last Login</p>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#0891b2" }}>
                  {stats.lastLoginTime ? formatDateTime(stats.lastLoginTime) : "Never"}
                </p>
              </div>

            </div>
          </div>
        )}

        {/* ===== LOGIN HISTORY SECTION ===== */}
        <div className="dashboard-section">
          <h3>
            Login Records
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "#6b7280", fontWeight: "400" }}>
              ({totalElements} total)
            </span>
          </h3>

          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading login history...</p>
          ) : loginHistory.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "30px 0" }}>
              No login history found.
            </p>
          ) : (
            <>
              {/* ===== LOGIN RECORDS ===== */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                {loginHistory.map((login) => (
                  <div
                    key={login.id}
                    style={{
                      background: login.isSuspicious ? "#fff7ed" : "#ffffff",
                      border: `1px solid ${login.isSuspicious ? "#fed7aa" : "#e5e7eb"}`,
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {/* ===== TOP ROW: Status + Device + Time ===== */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Status Badge */}
                        <span
                          style={{
                            ...getStatusStyle(login.status),
                            padding: "3px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {login.status === "SUCCESS" ? "✅" : "❌"} {login.status}
                        </span>

                        {/* Device Badge */}
                        <span style={{ fontSize: "14px" }}>{getDeviceIcon(login.deviceType)}</span>

                        {/* Suspicious Badge */}
                        {login.isSuspicious && (
                          <span
                            style={{
                              ...getSuspicionStyle(),
                              padding: "3px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "700",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🚨 Suspicious
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "500", whiteSpace: "nowrap" }}>
                        {formatDateTime(login.loginTime)}
                      </span>
                    </div>

                    {/* ===== DEVICE INFO ===== */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", fontSize: "13px", color: "#6b7280" }}>
                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "#374151" }}>Device</p>
                        <p style={{ margin: 0 }}>{login.deviceType || "Unknown"}</p>
                      </div>

                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "#374151" }}>Browser</p>
                        <p style={{ margin: 0 }}>{login.browser || "Unknown"}</p>
                      </div>

                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "#374151" }}>OS</p>
                        <p style={{ margin: 0 }}>{login.operatingSystem || "Unknown"}</p>
                      </div>

                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "#374151" }}>IP Address</p>
                        <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px" }}>{login.ipAddress || "N/A"}</p>
                      </div>
                    </div>

                    {/* ===== FAILURE REASON (if failed) ===== */}
                    {login.status === "FAILED" && login.failureReason && (
                      <p style={{ margin: 0, fontSize: "12px", color: "#dc2626", fontWeight: "600" }}>
                        Reason: {login.failureReason}
                      </p>
                    )}

                    {/* ===== SUSPICION REASON (if suspicious) ===== */}
                    {login.isSuspicious && login.suspicionReason && (
                      <p style={{ margin: 0, fontSize: "12px", color: "#d97706", fontWeight: "600" }}>
                        ⚠️ {login.suspicionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* ===== PAGINATION ===== */}
              <div className="pagination">
                <button type="button" onClick={() => setPage(page - 1)} disabled={page === 0}>
                  Prev
                </button>
                <span>
                  Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                </span>
                <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1 || totalPages === 0}>
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginHistory;