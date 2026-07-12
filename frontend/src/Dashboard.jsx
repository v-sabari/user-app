import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logout } from "./apiClient";
import AlertBell from "./AlertBell"; // ✅ Day 77 — Import alert bell
import { Button, StatCard } from "./ui";

function Dashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [profile, setProfile] = useState(null);

  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  const [loginAlert, setLoginAlert] = useState(null);

  const [quickStats, setQuickStats] = useState(null);
  const [activeSessions, setActiveSessions] = useState(null);

  const [securityScore, setSecurityScore] = useState(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    const alert = localStorage.getItem("loginAlert");
    if (alert && alert !== "none") {
      setLoginAlert(alert);
    }
    localStorage.removeItem("loginAlert");
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    try {
      await apiRequest("/auth/logout-all", { method: "POST" });
      logout();
      navigate("/login");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleSingleLogout = async (id) => {
    try {
      await apiRequest(`/auth/session/${id}`, { method: "DELETE" });
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: false } : s))
      );
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleSessionError = (err) => {
    setMessage(err.message || "Session expired");
    if (err.message === "Session expired") {
      logout();
      navigate("/login");
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await apiRequest("/auth/me");
      setProfile(data.data);
    } catch (err) {
      handleSessionError(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const query = new URLSearchParams({ search: searchTerm, page, size });
      const data = await apiRequest(`/users?${query}`);
      setUsers(data.data.content || []);
      setTotalPages(data.data.totalPages || 0);
    } catch (err) {
      handleSessionError(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await apiRequest("/auth/sessions");
      setSessions(data.data || []);
    } catch (err) {
      handleSessionError(err);
    }
  };

  const fetchQuickStats = async () => {
    try {
      const [analyticsData, sessionsData] = await Promise.all([
        apiRequest("/analytics/admin", { method: "GET" }),
        apiRequest("/admin/sessions", { method: "GET" }),
      ]);
      setQuickStats(analyticsData.data);
      setActiveSessions((sessionsData.data || []).length);
    } catch (err) {
      console.error("Quick stats error:", err.message);
    }
  };

  const fetchSecurityScore = async () => {
    setSecurityLoading(true);
    try {
      const data = await apiRequest("/security-audit/my-account", { method: "GET" });
      setSecurityScore(data.data.metrics);
    } catch (err) {
      console.error("Security score error:", err.message);
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchUsers();
      fetchSecurityScore();
      if (profile.role === "ADMIN") {
        fetchQuickStats();
      }
    }
  }, [profile, page, searchTerm]);

  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Dashboard</h2>
            <p className="welcome-text">Manage users, sessions &amp; security</p>
          </div>

          <div className="nav-pills">
            {/* ✅ Day 77 — Alert Bell */}
            <AlertBell onClick={() => navigate("/security-alerts")} />

            <Button variant="secondary" onClick={() => navigate("/profile")}>My profile</Button>
            <Button variant="secondary" onClick={() => navigate("/my-activity")}>My activity</Button>
            <Button variant="secondary" onClick={() => navigate("/security-audit")}>Security audit</Button>

            {isAdmin && <Button variant="secondary" onClick={() => navigate("/users")}>Manage users</Button>}
            {isAdmin && <Button variant="secondary" onClick={() => navigate("/risk-assessment")}>Risk assessment</Button>}
            {isAdmin && <Button variant="secondary" onClick={() => navigate("/security-dashboard")}>Security dashboard</Button>}
            {isAdmin && <Button variant="secondary" onClick={() => navigate("/active-sessions")}>Active sessions</Button>}
            {isAdmin && <Button variant="secondary" onClick={() => navigate("/audit-logs")}>Audit logs</Button>}
            {isAdmin && <Button variant="secondary" onClick={() => navigate("/analytics")}>Analytics</Button>}

            {/* ✅ Day 79 — Alert History Button */}
            <Button variant="secondary" onClick={() => navigate("/security-alerts/history")}>Alert history</Button>
            <Button variant="secondary" onClick={() => navigate("/login-history")}>📍 Login history</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
            <Button variant="danger" onClick={handleLogoutAll}>Logout all</Button>
          </div>
        </div>

        {/* ===== SECURITY SCORE WIDGET ===== */}
        {!securityLoading && securityScore && (
          <div className="security-score-panel" style={{ borderLeft: `4px solid ${securityScore.riskColor}`, marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div className="score-ring" style={{ background: securityScore.riskColor }}>
                  <span>{securityScore.riskScore}</span>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "var(--ink)" }}>
                    Your security score
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                    {securityScore.riskLevel === "SECURE"
                      ? "✅ Your account is secure"
                      : securityScore.riskLevel === "CAUTION"
                      ? "⚠️ Review recommendations"
                      : securityScore.riskLevel === "AT_RISK"
                      ? "⚠️ Action recommended"
                      : "🔴 Immediate action needed"}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                style={{ background: securityScore.riskColor }}
                onClick={() => navigate("/security-audit")}
              >
                View details →
              </Button>
            </div>
          </div>
        )}

        {/* ===== ADMIN QUICK STATS ===== */}
        {isAdmin && quickStats && (
          <div className="stat-grid" style={{ marginBottom: "20px" }}>

            <StatCard
              label="Total users"
              value={quickStats.totalUsers}
              sub="registered accounts"
              accent="var(--primary)"
              valueColor="var(--primary)"
            />

            <StatCard
              label="Active users"
              value={quickStats.activeUsers}
              sub={`${quickStats.totalUsers > 0
                ? Math.round((quickStats.activeUsers / quickStats.totalUsers) * 100)
                : 0}% of total`}
              accent="var(--success)"
              valueColor="var(--success)"
            />

            <StatCard
              label="Locked users"
              value={quickStats.lockedUsers}
              sub={quickStats.lockedUsers > 0 ? "⚠️ action needed" : "✅ all clear"}
              accent="var(--danger)"
              valueColor={quickStats.lockedUsers > 0 ? "var(--danger)" : "var(--ink)"}
            />

            <StatCard
              label="Live sessions"
              value={activeSessions}
              sub="system-wide"
              accent="var(--info)"
              valueColor="var(--info)"
            />

            <StatCard
              label="Audit logs"
              value={quickStats.totalAuditLogs}
              sub={`${quickStats.successfulActions} success / ${quickStats.failedActions} failed`}
              accent="#7c3aed"
              valueColor="#7c3aed"
            />

            <StatCard
              label="Admin users"
              value={quickStats.adminUsers}
              sub={`${quickStats.normalUsers} regular users`}
              accent="var(--warning)"
              valueColor="var(--warning)"
            />

          </div>
        )}

        {/* ===== SUSPICIOUS LOGIN BANNER ===== */}
        {loginAlert === "suspicious" && (
          <div className="alert-callout tone-danger" style={{ marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontWeight: "700", color: "var(--danger-dark)", fontSize: "15px" }}>
                🚨 Suspicious login detected
              </p>
              <p style={{ margin: "0 0 12px", color: "var(--danger-dark)", fontSize: "13px", lineHeight: "1.5" }}>
                Your account was accessed from a new IP address on a known device.
                If this was not you, change your password immediately.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Button variant="danger" onClick={() => navigate("/profile")}>Change password</Button>
                <Button variant="secondary" onClick={() => navigate("/my-activity")}>View my activity</Button>
              </div>
            </div>
            <button onClick={() => setLoginAlert(null)} className="alert-dismiss" title="Dismiss">✕</button>
          </div>
        )}

        {/* ===== NEW DEVICE LOGIN BANNER ===== */}
        {loginAlert === "newDevice" && (
          <div className="alert-callout tone-warning" style={{ marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontWeight: "700", color: "var(--warning-dark)", fontSize: "15px" }}>
                📱 New device login
              </p>
              <p style={{ margin: "0 0 12px", color: "var(--warning-dark)", fontSize: "13px", lineHeight: "1.5" }}>
                Your account was accessed from a new device. If this was not you,
                change your password and terminate all active sessions immediately.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Button variant="secondary" style={{ background: "var(--warning)", color: "#fff" }} onClick={() => navigate("/profile")}>Secure my account</Button>
                <Button variant="secondary" onClick={() => navigate("/my-activity")}>View my activity</Button>
              </div>
            </div>
            <button onClick={() => setLoginAlert(null)} className="alert-dismiss" title="Dismiss">✕</button>
          </div>
        )}

        {message && <p className="error-message">{message}</p>}

        {/* ===== PROFILE ===== */}
        <div className="dashboard-section">
          <h3>My profile</h3>
          {profile && (
            <div className="dashboard-meta">
              <p><b>Name:</b> {profile.name}</p>
              <p><b>Email:</b> {profile.email}</p>
              <p><b>Role:</b> {profile.role}</p>
            </div>
          )}
        </div>

        {/* ===== SESSIONS ===== */}
        <div className="dashboard-section">
          <h3>Active sessions</h3>
          {sessions.length === 0 && <p>No sessions found</p>}
          {sessions.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
              <div>
                <p><b>Device:</b> {s.deviceType}</p>
                <p><b>IP:</b> {s.ipAddress}</p>
                <p>
                  <b>Status:</b>{" "}
                  <span className={s.active ? "status-badge status-active" : "status-badge status-inactive"}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              {s.active ? (
                <Button variant="danger" onClick={() => handleSingleLogout(s.id)}>Logout</Button>
              ) : (
                <span style={{ color: "var(--faint)", fontSize: "12px" }}>Logged out</span>
              )}
            </div>
          ))}
        </div>

        {/* ===== USERS ===== */}
        {isAdmin && (
          <div className="dashboard-section">
            <h3>Users</h3>
            <input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="user-list">
              {users.map((u) => (
                <div key={u.id} className="user-card">
                  <p><b>{u.name}</b></p>
                  <p>{u.email}</p>
                  <p>{u.status}</p>
                </div>
              ))}
            </div>
            <div className="pagination">
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
              <span>{page + 1} / {totalPages}</span>
              <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;