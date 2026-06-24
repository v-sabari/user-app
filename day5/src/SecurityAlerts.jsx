import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import AlertNotification from "./AlertNotification";

/**
 * ✅ Day 77 — Security Alerts Component
 * Displays all personal security alerts
 */
function SecurityAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/security-alerts/my-alerts", { method: "GET" });
      setAlerts(data.data || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to load alerts");
      if (error.message === "Session expired") {
        logoutUser();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = (alertId) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
  };

  const handleRead = (alertId) => {
    setAlerts(
      alerts.map((a) => (a.id === alertId ? { ...a, readAt: new Date() } : a))
    );
  };

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;
  const mediumCount = alerts.filter((a) => a.severity === "MEDIUM").length;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div>
            <h2>Security Alerts</h2>
            <p style={styles.subText}>Real-time notifications about your account security</p>
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

        {/* ===== STATS ===== */}
        {!loading && (
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderTopColor: "#dc2626" }}>
              <p style={styles.statLabel}>Critical</p>
              <p style={{ ...styles.statValue, color: "#dc2626" }}>{criticalCount}</p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#ea580c" }}>
              <p style={styles.statLabel}>High</p>
              <p style={{ ...styles.statValue, color: "#ea580c" }}>{highCount}</p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#d97706" }}>
              <p style={styles.statLabel}>Medium</p>
              <p style={{ ...styles.statValue, color: "#d97706" }}>{mediumCount}</p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#0891b2" }}>
              <p style={styles.statLabel}>Total</p>
              <p style={{ ...styles.statValue, color: "#0891b2" }}>{alerts.length}</p>
            </div>
          </div>
        )}

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Loading your security alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>✅ No active alerts</p>
            <p style={{ fontSize: "13px", margin: 0 }}>Your account appears secure</p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Active Alerts ({alerts.length})
            </h3>
            <div>
              {alerts.map((alert) => (
                <AlertNotification
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismiss}
                  onRead={handleRead}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        {!loading && alerts.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "20px" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={() => navigate("/security-audit")}
            >
              View Security Score
            </button>
            <button
              style={{ ...styles.btn, background: "#0891b2" }}
              onClick={() => navigate("/my-activity")}
            >
              View Activity Log
            </button>
            <button
              style={{ ...styles.btn, background: "#7c3aed" }}
              onClick={() => navigate("/profile")}
            >
              Change Password
            </button>
            <button
              style={{ ...styles.btn, background: "#111827" }}
              onClick={fetchAlerts}
            >
              Refresh Alerts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: {
    maxWidth: "900px",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  statCard: {
    borderTop: "3px solid",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "14px",
    background: "#f9fafb",
    textAlign: "center",
  },
  statLabel: {
    margin: "0 0 6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
    lineHeight: "1",
  },
};

export default SecurityAlerts;