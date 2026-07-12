import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import AlertNotification from "./AlertNotification";
import { Button, Banner, StatCard } from "./ui";

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
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>🔴 Critical alerts</h2>
            <p className="welcome-text">Immediate action required — CRITICAL severity threats</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/admin/alerts")}>All alerts</Button>
            <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && <p className="error-message">{message}</p>}

        {/* ===== ALERT BANNER ===== */}
        {!loading && stats && stats.requiresAction && (
          <Banner tone="danger" style={{ marginBottom: "20px", border: "2px solid var(--danger)" }}>
            <p style={{ margin: "0 0 6px", fontWeight: "700", color: "var(--danger-dark)", fontSize: "15px" }}>
              🚨 Critical action required
            </p>
            <p style={{ margin: "0", color: "var(--danger-dark)", fontSize: "13px", lineHeight: "1.5" }}>
              {stats.count} critical alert{stats.count !== 1 ? "s" : ""} requiring immediate attention.
            </p>
          </Banner>
        )}

        {/* ===== STATS ===== */}
        {!loading && stats && (
          <div className="stat-grid" style={{ marginBottom: "20px" }}>
            <StatCard label="Critical alerts" value={stats.count} accent="var(--danger)" valueColor="var(--danger)" />
            <StatCard
              label="Status"
              value={stats.requiresAction ? "⚠️ Action needed" : "✅ Resolved"}
              accent={stats.requiresAction ? "var(--danger)" : "var(--success)"}
              valueColor={stats.requiresAction ? "var(--danger)" : "var(--success)"}
            />
          </div>
        )}

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Loading critical alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", background: "var(--success-soft)", borderRadius: "var(--r-md)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px", color: "var(--success-dark)", fontWeight: "700" }}>
              ✅ No critical alerts
            </p>
            <p style={{ fontSize: "13px", margin: 0, color: "var(--success)" }}>
              All critical threats have been resolved
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>
              Critical threats ({alerts.length})
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
          <div className="inline-actions" style={{ marginTop: "20px" }}>
            <Button variant="danger" onClick={() => navigate("/users")}>Manage users</Button>
            <Button variant="secondary" style={{ background: "#7c3aed", color: "#fff" }} onClick={() => navigate("/security-dashboard")}>Security dashboard</Button>
            <Button variant="secondary" onClick={fetchCriticalAlerts}>Refresh alerts</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CriticalAlerts;