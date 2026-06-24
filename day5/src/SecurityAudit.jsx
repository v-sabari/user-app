import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

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
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div>
            <h2>Security Audit</h2>
            <p style={styles.subText}>Your account's security score & recommendations</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button style={{ ...styles.btn, background: "#2563eb" }} onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button style={styles.btn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message && <p style={styles.errorText}>{message}</p>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Loading your security score...</p>
          </div>
        ) : !metrics ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Unable to load security metrics</p>
          </div>
        ) : (
          <>
            {/* ===== MAIN SCORE CARD ===== */}
            <div style={{ ...styles.scoreCard, borderTop: `4px solid ${metrics.riskColor}` }}>
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
                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", textAlign: "center", fontWeight: "500" }}>
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
                  <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#111827", fontWeight: "700" }}>
                    Account Overview
                  </h3>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Email</span>
                    <span style={styles.detailValue}>{metrics.email}</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Role</span>
                    <span style={{ ...styles.detailValue, background: metrics.role === "ADMIN" ? "#f5f3ff" : "#f9fafb", color: metrics.role === "ADMIN" ? "#7c3aed" : "#374151", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                      {metrics.role}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Account Status</span>
                    <span style={{ ...styles.detailValue, color: metrics.status === "ACTIVE" ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                      {metrics.status}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Last Login</span>
                    <span style={styles.detailValue}>{formatLastLogin(metrics.lastLogin)}</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Password Age</span>
                    <span style={{ ...styles.detailValue, color: metrics.passwordAgeDays > 90 ? "#dc2626" : "#111827" }}>
                      {formatDaysAgo(metrics.passwordAgeDays)}
                    </span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Total Actions</span>
                    <span style={styles.detailValue}>{metrics.totalActions}</span>
                  </div>

                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Failed Logins (7 days)</span>
                    <span style={{ ...styles.detailValue, color: metrics.failedLoginsLast7Days > 0 ? "#dc2626" : "#16a34a" }}>
                      {metrics.failedLoginsLast7Days}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== RISK BREAKDOWN ===== */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>Risk Factors</h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                {/* Failed Logins */}
                <div style={{ ...styles.riskFactorCard, borderColor: metrics.failedLoginsLast7Days > 3 ? "#dc2626" : "#16a34a" }}>
                  <p style={styles.riskFactorLabel}>Failed Logins (7d)</p>
                  <p style={{ ...styles.riskFactorValue, color: metrics.failedLoginsLast7Days > 3 ? "#dc2626" : "#16a34a" }}>
                    {metrics.failedLoginsLast7Days}
                  </p>
                  <p style={styles.riskFactorSub}>
                    {metrics.failedLoginsLast7Days === 0
                      ? "✅ Clean"
                      : metrics.failedLoginsLast7Days <= 3
                      ? "⚠️ Watch"
                      : "🔴 Concerning"}
                  </p>
                </div>

                {/* Password Age */}
                <div style={{ ...styles.riskFactorCard, borderColor: metrics.passwordAgeDays > 90 ? "#dc2626" : "#16a34a" }}>
                  <p style={styles.riskFactorLabel}>Password Age</p>
                  <p style={{ ...styles.riskFactorValue, color: metrics.passwordAgeDays > 90 ? "#dc2626" : "#16a34a" }}>
                    {metrics.passwordAgeDays <= 0 ? "New" : `${Math.min(metrics.passwordAgeDays, 365)}d`}
                  </p>
                  <p style={styles.riskFactorSub}>
                    {metrics.passwordAgeDays <= 0
                      ? "✅ Recently changed"
                      : metrics.passwordAgeDays <= 90
                      ? "✅ Current"
                      : "⚠️ Update soon"}
                  </p>
                </div>

                {/* Account Status */}
                <div style={{ ...styles.riskFactorCard, borderColor: metrics.status === "ACTIVE" ? "#16a34a" : "#dc2626" }}>
                  <p style={styles.riskFactorLabel}>Account Status</p>
                  <p style={{ ...styles.riskFactorValue, color: metrics.status === "ACTIVE" ? "#16a34a" : "#dc2626" }}>
                    {metrics.status}
                  </p>
                  <p style={styles.riskFactorSub}>
                    {metrics.status === "ACTIVE" ? "✅ Active" : "🔴 Needs review"}
                  </p>
                </div>

                {/* Activity Level */}
                <div style={{ ...styles.riskFactorCard, borderColor: metrics.lastActivity && new Date(metrics.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? "#16a34a" : "#d97706" }}>
                  <p style={styles.riskFactorLabel}>Recent Activity</p>
                  <p style={{ ...styles.riskFactorValue, color: metrics.lastActivity && new Date(metrics.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? "#16a34a" : "#d97706" }}>
                    {metrics.lastActivity ? "Yes" : "No"}
                  </p>
                  <p style={styles.riskFactorSub}>
                    {metrics.lastActivity && new Date(metrics.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ? "✅ Active"
                      : "⚠️ Inactive"}
                  </p>
                </div>
              </div>
            </div>

            {/* ===== RECOMMENDATIONS ===== */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>
                {metrics.riskLevel === "SECURE" ? "✅ Keep it up!" : "📋 Recommendations"}
              </h3>

              {recommendations.length === 0 ? (
                <p style={{ color: "#9ca3af", margin: 0 }}>No recommendations at this time.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#374151" }}>
                  {recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: "12px", lineHeight: "1.5", fontSize: "14px" }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ===== ACTION BUTTONS ===== */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "20px" }}>
              <button
                style={{ ...styles.btn, background: "#2563eb" }}
                onClick={() => navigate("/profile")}
              >
                Change Password
              </button>
              <button
                style={{ ...styles.btn, background: "#0891b2" }}
                onClick={() => navigate("/my-activity")}
              >
                View Activity Log
              </button>
              <button
                style={{ ...styles.btn, background: "#7c3aed" }}
                onClick={() => navigate("/dashboard")}
              >
                Manage Sessions
              </button>
              <button
                style={{ ...styles.btn, background: "#111827" }}
                onClick={fetchSecurityScore}
              >
                Refresh Score
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: {
    maxWidth: "1100px",
    margin: "auto",
    padding: "30px",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  subText: {
    color: "#6b7280",
    margin: "4px 0 0",
    fontSize: "14px",
  },
  btn: {
    padding: "8px 16px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    color: "white",
    background: "#374151",
    fontSize: "14px",
    fontWeight: "500",
  },
  errorText: {
    color: "#dc2626",
    background: "#fee2e2",
    padding: "12px 16px",
    borderRadius: "8px",
    margin: "0 0 20px",
  },
  scoreCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    background: "#f9fafb",
    marginBottom: "20px",
  },
  sectionCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    background: "#ffffff",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "12px",
    gap: "12px",
  },
  detailLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
  },
  detailValue: {
    fontSize: "14px",
    color: "#111827",
    fontWeight: "500",
  },
  riskFactorCard: {
    border: "2px solid",
    borderRadius: "8px",
    padding: "14px",
    background: "#f9fafb",
    textAlign: "center",
  },
  riskFactorLabel: {
    margin: "0 0 6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  riskFactorValue: {
    margin: "0 0 4px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1",
  },
  riskFactorSub: {
    margin: 0,
    fontSize: "12px",
    color: "#9ca3af",
  },
};

export default SecurityAudit;