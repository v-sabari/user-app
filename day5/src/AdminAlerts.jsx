import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import AlertNotification from "./AlertNotification";
import { Button, StatCard } from "./ui";

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
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>System alerts</h2>
            <p className="welcome-text">Real-time security alerts across all user accounts</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && <p className="error-message">{message}</p>}

        {/* ===== STATS ===== */}
        {!loading && stats && (
          <div className="stat-grid" style={{ marginBottom: "20px" }}>
            <StatCard label="Critical" value={stats.critical} accent="var(--danger)" valueColor="var(--danger)" />
            <StatCard label="High" value={stats.high} accent="#ea580c" valueColor="#ea580c" />
            <StatCard label="Medium" value={stats.medium} accent="var(--warning)" valueColor="var(--warning)" />
            <StatCard label="Total" value={stats.total} accent="var(--info)" valueColor="var(--info)" />
          </div>
        )}

        {/* ===== FILTERS ===== */}
        <div className="dashboard-toolbar">
          <input
            type="text"
            placeholder="Search by user email or alert message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All severity levels</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All alert types</option>
            <option value="HIGH_RISK">⚠️ High risk score</option>
            <option value="SUSPICIOUS_LOGIN">🚨 Suspicious login</option>
            <option value="PASSWORD_EXPIRING">⏰ Password expiring</option>
            <option value="BRUTE_FORCE">🔴 Brute force</option>
            <option value="ACCOUNT_LOCKED">🔐 Account locked</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="severity">Sort by severity</option>
            <option value="time">Sort by time</option>
            <option value="type">Sort by type</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm("");
              setSeverityFilter("");
              setTypeFilter("");
              setSortBy("severity");
            }}
          >
            Reset filters
          </Button>
        </div>

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Loading system alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>✅ No alerts match your filters</p>
            <p style={{ fontSize: "13px", margin: 0 }}>
              {alerts.length === 0
                ? "System is operating normally"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>
              Active alerts ({filteredAlerts.length})
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
          <div className="inline-actions" style={{ marginTop: "20px" }}>
            <Button variant="danger" onClick={() => setSeverityFilter("CRITICAL")}>Show critical only</Button>
            <Button variant="secondary" onClick={() => navigate("/users")}>Manage users</Button>
            <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={fetchAlerts}>Refresh alerts</Button>
          </div>
        )}

        {/* ===== FOOTER INFO ===== */}
        {!loading && filteredAlerts.length > 0 && (
          <div style={{ padding: "12px 0", fontSize: "13px", color: "var(--muted)", textAlign: "center", borderTop: "1px solid var(--line)", marginTop: "20px" }}>
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

export default AdminAlerts;