import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logout } from "./apiClient";
import AlertBell from "./AlertBell"; // ✅ Day 77 — Import alert bell

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
    <div style={container}>

      {/* ===== HEADER ===== */}
      <div style={header}>
        <div>
          <h2>Dashboard</h2>
          <p style={subText}>Manage users, sessions & security</p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* ✅ Day 77 — Alert Bell */}
          <AlertBell onClick={() => navigate("/security-alerts")} />

          <button style={{ ...btn, background: "#2563eb" }} onClick={() => navigate("/profile")}>
            My Profile
          </button>

          <button style={{ ...btn, background: "#0891b2" }} onClick={() => navigate("/my-activity")}>
            My Activity
          </button>

          <button style={{ ...btn, background: "#7c3aed" }} onClick={() => navigate("/security-audit")}>
            Security Audit
          </button>

          {isAdmin && (
            <button style={{ ...btn, background: "#0f766e" }} onClick={() => navigate("/users")}>
              Manage Users
            </button>
          )}

          {isAdmin && (
            <button style={{ ...btn, background: "#d97706" }} onClick={() => navigate("/risk-assessment")}>
              Risk Assessment
            </button>
          )}

          {isAdmin && (
            <button style={{ ...btn, background: "#be185d" }} onClick={() => navigate("/security-dashboard")}>
              Security Dashboard
            </button>
          )}

          {isAdmin && (
            <button style={{ ...btn, background: "#0f766e" }} onClick={() => navigate("/active-sessions")}>
              Active Sessions
            </button>
          )}

          {isAdmin && (
            <button style={{ ...btn, background: "#0f766e" }} onClick={() => navigate("/audit-logs")}>
              Audit Logs
            </button>
          )}

          {isAdmin && (
            <button style={{ ...btn, background: "#b45309" }} onClick={() => navigate("/analytics")}>
              Analytics
            </button>
          )}

          {/* ✅ Day 79 — Alert History Button */}
          <button style={{ ...btn, background: "#6b7280" }} onClick={() => navigate("/security-alerts/history")}>
            Alert History
          </button>
          <button type="button" onClick={() => navigate("/login-history")}>
  📍 Login History
</button>
          <button style={btn} onClick={handleLogout}>Logout</button>
          <button style={dangerBtn} onClick={handleLogoutAll}>Logout All</button>
        </div>
      </div>

      {/* ===== SECURITY SCORE WIDGET ===== */}
      {!securityLoading && securityScore && (
        <div style={{ ...securityScoreWidget, borderLeft: `4px solid ${securityScore.riskColor}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: securityScore.riskColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: "800", color: "white", lineHeight: "1" }}>
                  {securityScore.riskScore}
                </div>
              </div>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                  Your Security Score
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
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
            <button
              style={{ ...btn, background: securityScore.riskColor }}
              onClick={() => navigate("/security-audit")}
            >
              View Details →
            </button>
          </div>
        </div>
      )}

      {/* ===== ADMIN QUICK STATS ===== */}
      {isAdmin && quickStats && (
        <div style={quickStatsGrid}>

          <div style={{ ...statCard, borderTop: "3px solid #2563eb" }}>
            <p style={statLabel}>Total Users</p>
            <p style={{ ...statValue, color: "#2563eb" }}>{quickStats.totalUsers}</p>
            <p style={statSub}>registered accounts</p>
          </div>

          <div style={{ ...statCard, borderTop: "3px solid #16a34a" }}>
            <p style={statLabel}>Active Users</p>
            <p style={{ ...statValue, color: "#16a34a" }}>{quickStats.activeUsers}</p>
            <p style={statSub}>
              {quickStats.totalUsers > 0
                ? Math.round((quickStats.activeUsers / quickStats.totalUsers) * 100)
                : 0}% of total
            </p>
          </div>

          <div style={{ ...statCard, borderTop: "3px solid #dc2626" }}>
            <p style={statLabel}>Locked Users</p>
            <p style={{ ...statValue, color: quickStats.lockedUsers > 0 ? "#dc2626" : "#111827" }}>
              {quickStats.lockedUsers}
            </p>
            <p style={statSub}>
              {quickStats.lockedUsers > 0 ? "⚠️ action needed" : "✅ all clear"}
            </p>
          </div>

          <div style={{ ...statCard, borderTop: "3px solid #0891b2" }}>
            <p style={statLabel}>Live Sessions</p>
            <p style={{ ...statValue, color: "#0891b2" }}>{activeSessions}</p>
            <p style={statSub}>system-wide</p>
          </div>

          <div style={{ ...statCard, borderTop: "3px solid #7c3aed" }}>
            <p style={statLabel}>Audit Logs</p>
            <p style={{ ...statValue, color: "#7c3aed" }}>{quickStats.totalAuditLogs}</p>
            <p style={statSub}>
              {quickStats.successfulActions} success / {quickStats.failedActions} failed
            </p>
          </div>

          <div style={{ ...statCard, borderTop: "3px solid #d97706" }}>
            <p style={statLabel}>Admin Users</p>
            <p style={{ ...statValue, color: "#d97706" }}>{quickStats.adminUsers}</p>
            <p style={statSub}>{quickStats.normalUsers} regular users</p>
          </div>

        </div>
      )}

      {/* ===== SUSPICIOUS LOGIN BANNER ===== */}
      {loginAlert === "suspicious" && (
        <div style={suspiciousBanner}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#991b1b", fontSize: "15px" }}>
              🚨 Suspicious Login Detected
            </p>
            <p style={{ margin: "0 0 12px", color: "#7f1d1d", fontSize: "13px", lineHeight: "1.5" }}>
              Your account was accessed from a new IP address on a known device.
              If this was not you, change your password immediately.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button style={{ ...btn, background: "#dc2626", padding: "6px 14px", fontSize: "13px" }} onClick={() => navigate("/profile")}>
                Change Password
              </button>
              <button style={{ ...btn, background: "#374151", padding: "6px 14px", fontSize: "13px" }} onClick={() => navigate("/my-activity")}>
                View My Activity
              </button>
            </div>
          </div>
          <button onClick={() => setLoginAlert(null)} style={dismissBtn} title="Dismiss">✕</button>
        </div>
      )}

      {/* ===== NEW DEVICE LOGIN BANNER ===== */}
      {loginAlert === "newDevice" && (
        <div style={newDeviceBanner}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#92400e", fontSize: "15px" }}>
              📱 New Device Login
            </p>
            <p style={{ margin: "0 0 12px", color: "#78350f", fontSize: "13px", lineHeight: "1.5" }}>
              Your account was accessed from a new device. If this was not you,
              change your password and terminate all active sessions immediately.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button style={{ ...btn, background: "#d97706", padding: "6px 14px", fontSize: "13px" }} onClick={() => navigate("/profile")}>
                Secure My Account
              </button>
              <button style={{ ...btn, background: "#374151", padding: "6px 14px", fontSize: "13px" }} onClick={() => navigate("/my-activity")}>
                View My Activity
              </button>
            </div>
          </div>
          <button onClick={() => setLoginAlert(null)} style={dismissBtn} title="Dismiss">✕</button>
        </div>
      )}

      {message && <p style={errorText}>{message}</p>}

      {/* ===== PROFILE ===== */}
      <div style={card}>
        <h3>My Profile</h3>
        {profile && (
          <>
            <p><b>Name:</b> {profile.name}</p>
            <p><b>Email:</b> {profile.email}</p>
            <p><b>Role:</b> {profile.role}</p>
          </>
        )}
      </div>

      {/* ===== SESSIONS ===== */}
      <div style={card}>
        <h3>Active Sessions</h3>
        {sessions.length === 0 && <p>No sessions found</p>}
        {sessions.map((s) => (
          <div key={s.id} style={sessionCard}>
            <div>
              <p><b>Device:</b> {s.deviceType}</p>
              <p><b>IP:</b> {s.ipAddress}</p>
              <p>
                <b>Status:</b>{" "}
                <span style={{ color: s.active ? "green" : "gray" }}>
                  {s.active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
            {s.active ? (
              <button style={dangerBtn} onClick={() => handleSingleLogout(s.id)}>Logout</button>
            ) : (
              <span style={inactiveText}>Logged out</span>
            )}
          </div>
        ))}
      </div>

      {/* ===== USERS ===== */}
      {isAdmin && (
        <div style={card}>
          <h3>Users</h3>
          <input
            style={input}
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {users.map((u) => (
            <div key={u.id} style={userCard}>
              <div>
                <p><b>{u.name}</b></p>
                <p>{u.email}</p>
                <p>{u.status}</p>
              </div>
            </div>
          ))}
          <div style={pagination}>
            <button style={btn} disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</button>
            <span>{page + 1} / {totalPages}</span>
            <button style={btn} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */

const container = { maxWidth: "1100px", margin: "auto", padding: "30px" };
const header = { display: "flex", justifyContent: "space-between", marginBottom: "25px", flexWrap: "wrap", gap: "12px" };
const subText = { color: "gray" };
const card = { border: "1px solid #ddd", borderRadius: "10px", padding: "20px", marginBottom: "20px", background: "#fff" };
const sessionCard = { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "10px 0" };
const userCard = { borderBottom: "1px solid #eee", padding: "10px 0" };
const pagination = { marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" };
const btn = { padding: "6px 12px", cursor: "pointer", border: "none", borderRadius: "6px", color: "white", background: "#374151" };
const dangerBtn = { padding: "6px 12px", background: "red", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const input = { width: "100%", padding: "8px", marginBottom: "10px" };
const errorText = { color: "red" };
const inactiveText = { color: "gray", fontSize: "12px" };

const quickStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "14px",
  marginBottom: "24px",
};

const statCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const statLabel = {
  margin: "0 0 6px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const statValue = {
  margin: "0 0 4px",
  fontSize: "28px",
  fontWeight: "800",
  color: "#111827",
  lineHeight: "1",
};

const statSub = {
  margin: 0,
  fontSize: "12px",
  color: "#9ca3af",
};

const securityScoreWidget = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px 20px",
  marginBottom: "20px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

const suspiciousBanner = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" };
const newDeviceBanner = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" };
const dismissBtn = { background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", color: "#6b7280", padding: "0 4px", flexShrink: 0 };

export default Dashboard;