import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import AlertNotification from "./AlertNotification";

/**
 * ✅ Day 78 — Critical Alerts Component
 * Admin view of only CRITICAL severity alerts
 */
function CriticalAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchCriticalAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/alerts/critical", { method: "GET" });
      setAlerts(data.data.alerts || []);
      setStats({
        count: data.data.count,
        requiresAction: data.data.requiresAction,
      });
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to load alerts");
      if (error.message === "Session expired") {
        logoutUser();
        navigate("/login");
      } else if (error.message === "Access denied") {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }
    fetchCriticalAlerts();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div>
            <h2>🔴 Critical Alerts</h2>
            <p style={styles.subText}>Immediate action required — CRITICAL severity threats</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={() => navigate("/admin/alerts")}
            >
              All Alerts
            </button>
            <button
              style={{ ...styles.btn, background: "#0891b2" }}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
            <button style={styles.btn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message && <p style={styles.errorText}>{message}</p>}

        {/* ===== ALERT BANNER ===== */}
        {!loading && stats && stats.requiresAction && (
          <div style={styles.criticalBanner}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#991b1b", fontSize: "15px" }}>
                🚨 Critical Action Required
              </p>
              <p style={{ margin: "0", color: "#7f1d1d", fontSize: "13px", lineHeight: "1.5" }}>
                {stats.count} critical alert{stats.count !== 1 ? "s" : ""} requiring immediate attention.
              </p>
            </div>
          </div>
        )}

        {/* ===== STATS ===== */}
        {!loading && stats && (
          <div style={styles.statsSection}>
            <div style={styles.statBox}>
              <p style={styles.statBoxLabel}>Critical Alerts</p>
              <p style={{ ...styles.statBoxValue, color: "#dc2626" }}>{stats.count}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statBoxLabel}>Status</p>
              <p
                style={{
                  ...styles.statBoxValue,
                  color: stats.requiresAction ? "#dc2626" : "#16a34a",
                }}
              >
                {stats.requiresAction ? "⚠️ ACTION NEEDED" : "✅ RESOLVED"}
              </p>
            </div>
          </div>
        )}

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Loading critical alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", background: "#dcfce7", borderRadius: "8px" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px", color: "#15803d", fontWeight: "700" }}>
              ✅ No Critical Alerts
            </p>
            <p style={{ fontSize: "13px", margin: 0, color: "#16a34a" }}>
              All critical threats have been resolved
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Critical Threats ({alerts.length})
            </h3>
            <div>
              {alerts.map((alert) => (
                <AlertNotification
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => setAlerts(alerts.filter((a) => a.id !== alert.id))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        {!loading && alerts.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "20px" }}>
            <button
              style={{ ...styles.btn, background: "#dc2626" }}
              onClick={() => navigate("/users")}
            >
              Manage Users
            </button>
            <button
              style={{ ...styles.btn, background: "#7c3aed" }}
              onClick={() => navigate("/security-dashboard")}
            >
              Security Dashboard
            </button>
            <button
              style={{ ...styles.btn, background: "#111827" }}
              onClick={fetchCriticalAlerts}
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
  criticalBanner: {
    background: "#fee2e2",
    border: "2px solid #dc2626",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  statBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "14px",
    background: "#f9fafb",
    textAlign: "center",
  },
  statBoxLabel: {
    margin: "0 0 6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statBoxValue: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    lineHeight: "1",
  },
};

export default CriticalAlerts;