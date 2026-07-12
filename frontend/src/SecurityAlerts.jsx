import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import AlertNotification from "./AlertNotification";
import { Button, StatCard } from "./ui";

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
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Security alerts</h2>
            <p className="welcome-text">Real-time notifications about your account security</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && <p className="error-message">{message}</p>}

        {/* ===== STATS ===== */}
        {!loading && (
          <div className="stat-grid" style={{ marginBottom: "20px" }}>
            <StatCard label="Critical" value={criticalCount} accent="var(--danger)" valueColor="var(--danger)" />
            <StatCard label="High" value={highCount} accent="#ea580c" valueColor="#ea580c" />
            <StatCard label="Medium" value={mediumCount} accent="var(--warning)" valueColor="var(--warning)" />
            <StatCard label="Total" value={alerts.length} accent="var(--info)" valueColor="var(--info)" />
          </div>
        )}

        {/* ===== ALERTS LIST ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Loading your security alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>✅ No active alerts</p>
            <p style={{ fontSize: "13px", margin: 0 }}>Your account appears secure</p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "var(--ink)" }}>
              Active alerts ({alerts.length})
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
          <div className="inline-actions" style={{ marginTop: "20px" }}>
            <Button variant="secondary" onClick={() => navigate("/security-audit")}>View security score</Button>
            <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={() => navigate("/my-activity")}>View activity log</Button>
            <Button variant="secondary" style={{ background: "#7c3aed", color: "#fff" }} onClick={() => navigate("/profile")}>Change password</Button>
            <Button variant="secondary" onClick={fetchAlerts}>Refresh alerts</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityAlerts;