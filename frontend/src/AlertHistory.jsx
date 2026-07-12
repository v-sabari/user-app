import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, StatCard } from "./ui";

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
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Alert history</h2>
            <p className="welcome-text">Archive of all past security alerts</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/security-alerts")}>Active alerts</Button>
            <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && <p className="error-message">{message}</p>}

        {/* ===== STATS ===== */}
        {!loading && stats && (
          <div className="stat-grid" style={{ marginBottom: "20px" }}>
            <StatCard label="Total alerts" value={stats.total} accent="var(--info)" valueColor="var(--info)" />
            <StatCard label="Active" value={stats.active} accent="var(--danger)" valueColor="var(--danger)" />
            <StatCard label="Archived" value={stats.archived} accent="var(--muted)" valueColor="var(--muted)" />
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div className="dashboard-toolbar">
          <input
            type="text"
            placeholder="Search by alert message or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All severity</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="INFO">ℹ️ Info</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="HIGH_RISK">⚠️ High risk score</option>
            <option value="SUSPICIOUS_LOGIN">🚨 Suspicious login</option>
            <option value="PASSWORD_EXPIRING">⏰ Password expiring</option>
            <option value="BRUTE_FORCE_ATTEMPT">🔴 Brute force</option>
            <option value="PASSWORD_CHANGED">✅ Password changed</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Sort by date (newest)</option>
            <option value="severity">Sort by severity</option>
            <option value="type">Sort by type</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm("");
              setSeverityFilter("");
              setTypeFilter("");
              setSortBy("date");
            }}
          >
            Reset filters
          </Button>
        </div>

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Loading alert history...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>📋 No alerts match your filters</p>
            <p style={{ fontSize: "13px", margin: 0 }}>
              {alerts.length === 0 ? "No alert history yet" : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>
              Alert history ({filteredAlerts.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    background: "var(--surface)",
                    border: `2px solid ${getSeverityColor(alert.severity)}`,
                    borderRadius: "var(--r-md)",
                    padding: "12px 16px",
                    boxShadow: "var(--shadow-xs)",
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
                            borderRadius: "var(--r-sm)",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {alert.severity}
                        </span>
                        <span
                          style={{
                            background: "var(--surface-sunken)",
                            color: "var(--ink-soft)",
                            padding: "2px 8px",
                            borderRadius: "var(--r-sm)",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {alert.type}
                        </span>
                        {alert.archived && (
                          <span
                            style={{
                              background: "var(--line)",
                              color: "var(--muted)",
                              padding: "2px 8px",
                              borderRadius: "var(--r-sm)",
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
                          color: "var(--ink)",
                          fontWeight: "600",
                        }}
                      >
                        {alert.message}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "var(--faint)",
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
                        color: "var(--muted)",
                        paddingTop: "8px",
                        borderTop: "1px solid var(--line)",
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
          <div className="inline-actions" style={{ marginTop: "20px" }}>
            <Button variant="secondary" onClick={fetchAlertHistory}>Refresh history</Button>
            <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={() => navigate("/security-audit")}>View security score</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertHistory;