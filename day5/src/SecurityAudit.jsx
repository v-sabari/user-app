import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button } from "./ui";

/**
 * ✅ Day 76 — Security Audit Component
 * Displays personal security score and recommendations
 */
function SecurityAudit() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchSecurityScore = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/security-audit/my-account", { method: "GET" });
      setMetrics(data.data.metrics);
      setRecommendations(data.data.recommendations || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to load security score");
      if (error.message === "Session expired") {
        logoutUser();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityScore();
  }, []);

  // ================= HELPER: Format days =================
  const formatDaysAgo = (daysAgo) => {
    if (daysAgo === -1) return "Never changed";
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "1 day ago";
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return `${Math.floor(daysAgo / 30)} months ago`;
  };

  const formatLastLogin = (dateStr) => {
    if (!dateStr) return "Never logged in";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Security audit</h2>
            <p className="welcome-text">Your account's security score &amp; recommendations</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && <p className="error-message">{message}</p>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Loading your security score...</p>
          </div>
        ) : !metrics ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Unable to load security metrics</p>
          </div>
        ) : (
          <>
            {/* ===== MAIN SCORE CARD ===== */}
            <div className="security-score-panel" style={{ borderTop: `4px solid ${metrics.riskColor}`, marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
                {/* Score Circle */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      background: metrics.riskColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ fontSize: "44px", fontWeight: "800", color: "white", lineHeight: "1" }}>
                      {metrics.riskScore}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", marginTop: "4px", fontWeight: "600" }}>
                      {metrics.riskScore <= 25 ? "SECURE" : metrics.riskScore <= 50 ? "CAUTION" : metrics.riskScore <= 75 ? "AT RISK" : "CRITICAL"}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", textAlign: "center", fontWeight: "500" }}>
                    {metrics.riskLevel === "SECURE"
                      ? "✅ Your account is secure"
                      : metrics.riskLevel === "CAUTION"
                      ? "⚠️ Review recommendations"
                      : metrics.riskLevel === "AT_RISK"
                      ? "⚠️ Action recommended"
                      : "🔴 Immediate action needed"}
                  </p>
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "var(--ink)", fontWeight: "700" }}>
                    Account overview
                  </h3>

                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{metrics.email}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Role</span>
                    <span className="detail-value" style={{ background: metrics.role === "ADMIN" ? "#f5f3ff" : "var(--surface-sunken)", color: metrics.role === "ADMIN" ? "#7c3aed" : "var(--ink-soft)", padding: "2px 8px", borderRadius: "var(--r-sm)", fontSize: "12px", fontWeight: "600" }}>
                      {metrics.role}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Account status</span>
                    <span className="detail-value" style={{ color: metrics.status === "ACTIVE" ? "var(--success)" : "var(--danger)", fontWeight: "600" }}>
                      {metrics.status}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Last login</span>
                    <span className="detail-value">{formatLastLogin(metrics.lastLogin)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Password age</span>
                    <span className="detail-value" style={{ color: metrics.passwordAgeDays > 90 ? "var(--danger)" : "var(--ink)" }}>
                      {formatDaysAgo(metrics.passwordAgeDays)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Total actions</span>
                    <span className="detail-value">{metrics.totalActions}</span>
                  </div>

                  <div className="detail-row" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                    <span className="detail-label">Failed logins (7 days)</span>
                    <span className="detail-value" style={{ color: metrics.failedLoginsLast7Days > 0 ? "var(--danger)" : "var(--success)" }}>
                      {metrics.failedLoginsLast7Days}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== RISK BREAKDOWN ===== */}
            <div className="dashboard-section">
              <h3>Risk factors</h3>

              <div className="stat-grid">
                {/* Failed Logins */}
                <div className="stat-card" style={{ borderTop: `3px solid ${metrics.failedLoginsLast7Days > 3 ? "var(--danger)" : "var(--success)"}`, textAlign: "center" }}>
                  <p className="stat-label">Failed logins (7d)</p>
                  <p className="stat-value" style={{ color: metrics.failedLoginsLast7Days > 3 ? "var(--danger)" : "var(--success)", fontSize: "22px" }}>
                    {metrics.failedLoginsLast7Days}
                  </p>
                  <p className="stat-sub">
                    {metrics.failedLoginsLast7Days === 0
                      ? "✅ Clean"
                      : metrics.failedLoginsLast7Days <= 3
                      ? "⚠️ Watch"
                      : "🔴 Concerning"}
                  </p>
                </div>

                {/* Password Age */}
                <div className="stat-card" style={{ borderTop: `3px solid ${metrics.passwordAgeDays > 90 ? "var(--danger)" : "var(--success)"}`, textAlign: "center" }}>
                  <p className="stat-label">Password age</p>
                  <p className="stat-value" style={{ color: metrics.passwordAgeDays > 90 ? "var(--danger)" : "var(--success)", fontSize: "22px" }}>
                    {metrics.passwordAgeDays <= 0 ? "New" : `${Math.min(metrics.passwordAgeDays, 365)}d`}
                  </p>
                  <p className="stat-sub">
                    {metrics.passwordAgeDays <= 0
                      ? "✅ Recently changed"
                      : metrics.passwordAgeDays <= 90
                      ? "✅ Current"
                      : "⚠️ Update soon"}
                  </p>
                </div>

                {/* Account Status */}
                <div className="stat-card" style={{ borderTop: `3px solid ${metrics.status === "ACTIVE" ? "var(--success)" : "var(--danger)"}`, textAlign: "center" }}>
                  <p className="stat-label">Account status</p>
                  <p className="stat-value" style={{ color: metrics.status === "ACTIVE" ? "var(--success)" : "var(--danger)", fontSize: "22px" }}>
                    {metrics.status}
                  </p>
                  <p className="stat-sub">
                    {metrics.status === "ACTIVE" ? "✅ Active" : "🔴 Needs review"}
                  </p>
                </div>

                {/* Activity Level */}
                <div className="stat-card" style={{ borderTop: `3px solid ${metrics.lastActivity && new Date(metrics.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? "var(--success)" : "var(--warning)"}`, textAlign: "center" }}>
                  <p className="stat-label">Recent activity</p>
                  <p className="stat-value" style={{ color: metrics.lastActivity && new Date(metrics.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? "var(--success)" : "var(--warning)", fontSize: "22px" }}>
                    {metrics.lastActivity ? "Yes" : "No"}
                  </p>
                  <p className="stat-sub">
                    {metrics.lastActivity && new Date(metrics.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ? "✅ Active"
                      : "⚠️ Inactive"}
                  </p>
                </div>
              </div>
            </div>

            {/* ===== RECOMMENDATIONS ===== */}
            <div className="dashboard-section">
              <h3>
                {metrics.riskLevel === "SECURE" ? "✅ Keep it up!" : "📋 Recommendations"}
              </h3>

              {recommendations.length === 0 ? (
                <p style={{ color: "var(--faint)", margin: 0 }}>No recommendations at this time.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--ink-soft)" }}>
                  {recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: "12px", lineHeight: "1.5", fontSize: "14px" }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ===== ACTION BUTTONS ===== */}
            <div className="inline-actions" style={{ marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => navigate("/profile")}>Change password</Button>
              <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={() => navigate("/my-activity")}>View activity log</Button>
              <Button variant="secondary" style={{ background: "#7c3aed", color: "#fff" }} onClick={() => navigate("/dashboard")}>Manage sessions</Button>
              <Button variant="secondary" onClick={fetchSecurityScore}>Refresh score</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SecurityAudit;