import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, StatCard } from "./ui";

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
            <h2>📍 Login history</h2>
            <p className="welcome-text">
              View all your login attempts, devices, and locations
            </p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate("/profile")}>Profile</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* ===== ERROR MESSAGE ===== */}
        {error && <p className="error-message">{error}</p>}

        {/* ===== STATS SECTION ===== */}
        {stats && (
          <div className="dashboard-section">
            <h3>Login statistics</h3>
            <div className="stat-grid">

              <StatCard label="Total logins" value={stats.totalLogins ?? 0} accent="var(--primary)" valueColor="var(--primary)" />

              <StatCard label="Successful" value={stats.successfulLogins ?? 0} accent="var(--success)" valueColor="var(--success)" />

              <StatCard
                label="Failed"
                value={stats.failedLogins ?? 0}
                accent={stats.failedLogins > 0 ? "var(--danger)" : "var(--success)"}
                valueColor={stats.failedLogins > 0 ? "var(--danger)" : "var(--success)"}
              />

              <StatCard
                label="Failed (24h)"
                value={stats.failedLast24Hours ?? 0}
                accent={stats.failedLast24Hours > 0 ? "var(--warning)" : "var(--success)"}
                valueColor={stats.failedLast24Hours > 0 ? "var(--warning)" : "var(--success)"}
              />

              <StatCard
                label="🚨 Suspicious"
                value={stats.suspiciousLogins ?? 0}
                accent={stats.suspiciousLogins > 0 ? "var(--danger)" : "var(--success)"}
                valueColor={stats.suspiciousLogins > 0 ? "var(--danger)" : "var(--success)"}
              />

              <StatCard
                label="Last login"
                value={stats.lastLoginTime ? formatDateTime(stats.lastLoginTime) : "Never"}
                accent="var(--info)"
                valueColor="var(--info)"
              />

            </div>
          </div>
        )}

        {/* ===== LOGIN HISTORY SECTION ===== */}
        <div className="dashboard-section">
          <h3>
            Login records
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "var(--muted)", fontWeight: "400" }}>
              ({totalElements} total)
            </span>
          </h3>

          {loading ? (
            <p style={{ color: "var(--faint)" }}>Loading login history...</p>
          ) : loginHistory.length === 0 ? (
            <p style={{ color: "var(--faint)", textAlign: "center", padding: "30px 0" }}>
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
                      background: login.isSuspicious ? "#fff7ed" : "var(--surface)",
                      border: `1px solid ${login.isSuspicious ? "#fed7aa" : "var(--line)"}`,
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
                      <span style={{ fontSize: "11px", color: "var(--faint)", fontWeight: "500", whiteSpace: "nowrap" }}>
                        {formatDateTime(login.loginTime)}
                      </span>
                    </div>

                    {/* ===== DEVICE INFO ===== */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", fontSize: "13px", color: "var(--muted)" }}>
                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "var(--ink-soft)" }}>Device</p>
                        <p style={{ margin: 0 }}>{login.deviceType || "Unknown"}</p>
                      </div>

                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "var(--ink-soft)" }}>Browser</p>
                        <p style={{ margin: 0 }}>{login.browser || "Unknown"}</p>
                      </div>

                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "var(--ink-soft)" }}>OS</p>
                        <p style={{ margin: 0 }}>{login.operatingSystem || "Unknown"}</p>
                      </div>

                      <div>
                        <p style={{ margin: "0 0 3px", fontSize: "11px", fontWeight: "600", color: "var(--ink-soft)" }}>IP Address</p>
                        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "12px" }}>{login.ipAddress || "N/A"}</p>
                      </div>
                    </div>

                    {/* ===== FAILURE REASON (if failed) ===== */}
                    {login.status === "FAILED" && login.failureReason && (
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--danger)", fontWeight: "600" }}>
                        Reason: {login.failureReason}
                      </p>
                    )}

                    {/* ===== SUSPICION REASON (if suspicious) ===== */}
                    {login.isSuspicious && login.suspicionReason && (
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--warning)", fontWeight: "600" }}>
                        ⚠️ {login.suspicionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* ===== PAGINATION ===== */}
              <div className="pagination">
                <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</Button>
                <span>
                  Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
                </span>
                <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1 || totalPages === 0}>Next</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginHistory;