import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import AlertNotification from "./AlertNotification";

/**
 * ✅ Day 78 — Admin Alerts Dashboard
 * Admin view of all system alerts with filtering and sorting
 */
function AdminAlerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [severityFilter, setSeverityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("severity");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/admin/alerts/all", { method: "GET" });
      setAlerts(data.data.alerts || []);
      setStats({
        total: data.data.totalAlerts,
        critical: data.data.criticalCount,
        high: data.data.highCount,
        medium: data.data.mediumCount,
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
    fetchAlerts();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...alerts];

    if (severityFilter) {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.userEmail.toLowerCase().includes(lower) ||
          a.message.toLowerCase().includes(lower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "severity") {
        const severityRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
        return (
          (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
        );
      } else if (sortBy === "time") {
        return (
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      } else if (sortBy === "type") {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

    setFilteredAlerts(filtered);
  }, [alerts, severityFilter, typeFilter, searchTerm, sortBy]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#ea580c";
      case "MEDIUM":
        return "#d97706";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div>
            <h2>System Alerts</h2>
            <p style={styles.subText}>Real-time security alerts across all user accounts</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
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

        {/* ===== STATS ===== */}
        {!loading && stats && (
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderTopColor: "#dc2626" }}>
              <p style={styles.statLabel}>Critical</p>
              <p style={{ ...styles.statValue, color: "#dc2626" }}>
                {stats.critical}
              </p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#ea580c" }}>
              <p style={styles.statLabel}>High</p>
              <p style={{ ...styles.statValue, color: "#ea580c" }}>
                {stats.high}
              </p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#d97706" }}>
              <p style={styles.statLabel}>Medium</p>
              <p style={{ ...styles.statValue, color: "#d97706" }}>
                {stats.medium}
              </p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#0891b2" }}>
              <p style={styles.statLabel}>Total</p>
              <p style={{ ...styles.statValue, color: "#0891b2" }}>
                {stats.total}
              </p>
            </div>
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div style={styles.filterSection}>
          <input
            type="text"
            placeholder="Search by user email or alert message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Severity Levels</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Alert Types</option>
            <option value="HIGH_RISK">⚠️ High Risk Score</option>
            <option value="SUSPICIOUS_LOGIN">🚨 Suspicious Login</option>
            <option value="PASSWORD_EXPIRING">⏰ Password Expiring</option>
            <option value="BRUTE_FORCE">🔴 Brute Force</option>
            <option value="ACCOUNT_LOCKED">🔐 Account Locked</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="severity">Sort by Severity</option>
            <option value="time">Sort by Time</option>
            <option value="type">Sort by Type</option>
          </select>

          <button
            style={{ ...styles.btn, background: "#111827" }}
            onClick={() => {
              setSearchTerm("");
              setSeverityFilter("");
              setTypeFilter("");
              setSortBy("severity");
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Loading system alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>✅ No alerts match your filters</p>
            <p style={{ fontSize: "13px", margin: 0 }}>
              {alerts.length === 0
                ? "System is operating normally"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Active Alerts ({filteredAlerts.length})
            </h3>
            <div>
              {filteredAlerts.map((alert) => (
                <AlertNotification
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => setFilteredAlerts(filteredAlerts.filter((a) => a.id !== alert.id))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        {!loading && filteredAlerts.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "20px" }}>
            <button
              style={{ ...styles.btn, background: "#dc2626" }}
              onClick={() => setSeverityFilter("CRITICAL")}
            >
              Show Critical Only
            </button>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={() => navigate("/users")}
            >
              Manage Users
            </button>
            <button
              style={{ ...styles.btn, background: "#0891b2" }}
              onClick={fetchAlerts}
            >
              Refresh Alerts
            </button>
          </div>
        )}

        {/* ===== FOOTER INFO ===== */}
        {!loading && filteredAlerts.length > 0 && (
          <div style={styles.footerInfo}>
            <p>
              Showing <strong>{filteredAlerts.length}</strong> of{" "}
              <strong>{alerts.length}</strong> alerts
              {severityFilter && ` (${severityFilter})`}
            </p>
          </div>
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
  filterSection: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    background: "white",
  },
  footerInfo: {
    padding: "12px 0",
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    borderTop: "1px solid #e5e7eb",
    marginTop: "20px",
  },
};

export default AdminAlerts;