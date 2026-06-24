import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

/**
 * ✅ Day 79 — Alert History Component
 * View archived and historical alerts with filtering
 */
function AlertHistory() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchAlertHistory = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/security-alerts/history/my-history", {
        method: "GET",
      });
      setAlerts(data.data.alerts || []);
      setStats({
        total: data.data.totalAlerts,
        active: data.data.activeAlerts,
        archived: data.data.archivedAlerts,
      });
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to load alert history");
      if (error.message === "Session expired") {
        logoutUser();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertHistory();
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
          (a.message && a.message.toLowerCase().includes(lower)) ||
          (a.type && a.type.toLowerCase().includes(lower))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "severity") {
        const severityRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, INFO: 0 };
        return (
          (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
        );
      } else if (sortBy === "type") {
        return (a.type || "").localeCompare(b.type || "");
      }
      return 0;
    });

    setFilteredAlerts(filtered);
  }, [alerts, typeFilter, severityFilter, searchTerm, sortBy]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#ea580c";
      case "MEDIUM":
        return "#d97706";
      case "INFO":
        return "#0891b2";
      default:
        return "#6b7280";
    }
  };

  const formatDateTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString();
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
            <h2>Alert History</h2>
            <p style={styles.subText}>Archive of all past security alerts</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={() => navigate("/security-alerts")}
            >
              Active Alerts
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

        {/* ===== STATS ===== */}
        {!loading && stats && (
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderTopColor: "#0891b2" }}>
              <p style={styles.statLabel}>Total Alerts</p>
              <p style={{ ...styles.statValue, color: "#0891b2" }}>
                {stats.total}
              </p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#dc2626" }}>
              <p style={styles.statLabel}>Active</p>
              <p style={{ ...styles.statValue, color: "#dc2626" }}>
                {stats.active}
              </p>
            </div>
            <div style={{ ...styles.statCard, borderTopColor: "#6b7280" }}>
              <p style={styles.statLabel}>Archived</p>
              <p style={{ ...styles.statValue, color: "#6b7280" }}>
                {stats.archived}
              </p>
            </div>
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div style={styles.filterSection}>
          <input
            type="text"
            placeholder="Search by alert message or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Severity</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="INFO">ℹ️ Info</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Types</option>
            <option value="HIGH_RISK">⚠️ High Risk Score</option>
            <option value="SUSPICIOUS_LOGIN">🚨 Suspicious Login</option>
            <option value="PASSWORD_EXPIRING">⏰ Password Expiring</option>
            <option value="BRUTE_FORCE_ATTEMPT">🔴 Brute Force</option>
            <option value="PASSWORD_CHANGED">✅ Password Changed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.select}
          >
            <option value="date">Sort by Date (Newest)</option>
            <option value="severity">Sort by Severity</option>
            <option value="type">Sort by Type</option>
          </select>

          <button
            style={{ ...styles.btn, background: "#111827" }}
            onClick={() => {
              setSearchTerm("");
              setSeverityFilter("");
              setTypeFilter("");
              setSortBy("date");
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Loading alert history...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>📋 No alerts match your filters</p>
            <p style={{ fontSize: "13px", margin: 0 }}>
              {alerts.length === 0 ? "No alert history yet" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Alert History ({filteredAlerts.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    background: "#ffffff",
                    border: `2px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: "8px",
                    padding: "12px 16px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span
                          style={{
                            background: getSeverityColor(alert.severity),
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {alert.severity}
                        </span>
                        <span
                          style={{
                            background: "#f3f4f6",
                            color: "#374151",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {alert.type}
                        </span>
                        {alert.archived && (
                          <span
                            style={{
                              background: "#e5e7eb",
                              color: "#6b7280",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            📋 Archived
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "14px",
                          color: "#111827",
                          fontWeight: "600",
                        }}
                      >
                        {alert.message}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#9ca3af",
                        }}
                      >
                        {formatDateTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                  {alert.status && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color: "#6b7280",
                        paddingTop: "8px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      Status: <strong>{alert.status}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        {!loading && filteredAlerts.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "20px" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={fetchAlertHistory}
            >
              Refresh History
            </button>
            <button
              style={{ ...styles.btn, background: "#0891b2" }}
              onClick={() => navigate("/security-audit")}
            >
              View Security Score
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
    maxWidth: "1000px",
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
};

export default AlertHistory;