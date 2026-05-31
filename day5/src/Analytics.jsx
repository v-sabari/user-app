import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function Analytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState("");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchAnalytics = async () => {
    try {
      const profile = await apiRequest("/auth/me", { method: "GET" });

      if (profile.data.role !== "ADMIN") {
        navigate("/dashboard");
        return;
      }

      const data = await apiRequest("/analytics/admin", { method: "GET" });
      setAnalytics(data.data);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to fetch analytics");
      if (error.message === "Session expired") navigate("/login");
      if (error.message === "Access denied") navigate("/dashboard");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ================= BAR HELPERS =================

  // Single horizontal bar with label, value, color
  const HBar = ({ label, value, max, color, showCount = true }) => {
    const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
    return (
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{label}</span>
          {showCount && (
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>{value}</span>
          )}
        </div>
        <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "12px", overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              background: color,
              height: "100%",
              borderRadius: "999px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>
    );
  };

  // Stacked two-segment bar
  const StackedBar = ({ leftLabel, leftValue, rightLabel, rightValue, leftColor, rightColor }) => {
    const total = leftValue + rightValue;
    const leftPct = total > 0 ? Math.round((leftValue / total) * 100) : 50;
    const rightPct = 100 - leftPct;
    return (
      <div>
        <div style={{ display: "flex", borderRadius: "999px", overflow: "hidden", height: "28px" }}>
          <div
            style={{
              width: `${leftPct}%`,
              background: leftColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "700",
              color: "white",
              minWidth: leftValue > 0 ? "40px" : "0",
              transition: "width 0.5s ease",
            }}
          >
            {leftValue > 0 ? leftValue : ""}
          </div>
          <div
            style={{
              width: `${rightPct}%`,
              background: rightColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "700",
              color: "white",
              minWidth: rightValue > 0 ? "40px" : "0",
              transition: "width 0.5s ease",
            }}
          >
            {rightValue > 0 ? rightValue : ""}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: leftColor }} />
            <span style={{ fontSize: "12px", color: "#6b7280" }}>{leftLabel} ({leftPct}%)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>{rightLabel} ({rightPct}%)</span>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: rightColor }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Admin Analytics</h2>
            <p className="welcome-text">
              Real-time user, security, and activity insights.
            </p>
          </div>

          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button type="button" onClick={() => navigate("/audit-logs")}>
              Audit Logs
            </button>

            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        {!analytics ? (
          <p>Loading analytics...</p>
        ) : (
          <>
            {/* ===== STAT CARDS ===== */}
            <div className="analytics-grid">
              <div className="analytics-card">
                <p>Total Users</p>
                <h3>{analytics.totalUsers}</h3>
              </div>

              <div className="analytics-card">
                <p>Active Users</p>
                <h3 style={{ color: "#16a34a" }}>{analytics.activeUsers}</h3>
              </div>

              <div className="analytics-card">
                <p>Inactive Users</p>
                <h3 style={{ color: "#d97706" }}>{analytics.inactiveUsers}</h3>
              </div>

              <div className="analytics-card">
                <p>Locked Users</p>
                <h3 style={{ color: "#dc2626" }}>{analytics.lockedUsers}</h3>
              </div>

              <div className="analytics-card">
                <p>Admin Users</p>
                <h3 style={{ color: "#7c3aed" }}>{analytics.adminUsers}</h3>
              </div>

              <div className="analytics-card">
                <p>Normal Users</p>
                <h3>{analytics.normalUsers}</h3>
              </div>

              <div className="analytics-card">
                <p>Total Audit Logs</p>
                <h3>{analytics.totalAuditLogs}</h3>
              </div>

              <div className="analytics-card">
                <p>Successful Actions</p>
                <h3 style={{ color: "#16a34a" }}>{analytics.successfulActions}</h3>
              </div>

              <div className="analytics-card">
                <p>Failed Actions</p>
                <h3 style={{ color: "#dc2626" }}>{analytics.failedActions}</h3>
              </div>
            </div>

            {/* ===== CHART ROW ===== */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
                marginBottom: "20px",
              }}
            >

              {/* ===== CHART 1: USER STATUS BREAKDOWN ===== */}
              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>👥 User Status Breakdown</h3>
                <HBar
                  label="Active"
                  value={analytics.activeUsers}
                  max={analytics.totalUsers}
                  color="#16a34a"
                />
                <HBar
                  label="Inactive"
                  value={analytics.inactiveUsers}
                  max={analytics.totalUsers}
                  color="#d97706"
                />
                <HBar
                  label="Locked"
                  value={analytics.lockedUsers}
                  max={analytics.totalUsers}
                  color="#dc2626"
                />
                <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9ca3af", textAlign: "right" }}>
                  Total: {analytics.totalUsers} users
                </p>
              </div>

              {/* ===== CHART 2: ROLE SPLIT ===== */}
              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>🔑 Role Distribution</h3>
                <HBar
                  label="USER"
                  value={analytics.normalUsers}
                  max={analytics.totalUsers}
                  color="#2563eb"
                />
                <HBar
                  label="ADMIN"
                  value={analytics.adminUsers}
                  max={analytics.totalUsers}
                  color="#7c3aed"
                />
                <div style={{ marginTop: "20px" }}>
                  <StackedBar
                    leftLabel="USER"
                    leftValue={analytics.normalUsers}
                    rightLabel="ADMIN"
                    rightValue={analytics.adminUsers}
                    leftColor="#2563eb"
                    rightColor="#7c3aed"
                  />
                </div>
              </div>

              {/* ===== CHART 3: ACTION SUCCESS RATE ===== */}
              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>✅ Action Success Rate</h3>
                <HBar
                  label="Successful"
                  value={analytics.successfulActions}
                  max={analytics.totalAuditLogs}
                  color="#16a34a"
                />
                <HBar
                  label="Failed"
                  value={analytics.failedActions}
                  max={analytics.totalAuditLogs}
                  color="#dc2626"
                />

                {/* ===== Success rate % ===== */}
                {(() => {
                  const total = analytics.successfulActions + analytics.failedActions;
                  const rate = total > 0
                    ? ((analytics.successfulActions / total) * 100).toFixed(1)
                    : 0;
                  const color = rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626";
                  return (
                    <div
                      style={{
                        marginTop: "16px",
                        textAlign: "center",
                        background: color + "12",
                        border: `1px solid ${color}30`,
                        borderRadius: "10px",
                        padding: "10px",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Success Rate</p>
                      <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color }}>{rate}%</p>
                    </div>
                  );
                })()}
              </div>

              {/* ===== CHART 4: TOP ACTIONS FREQUENCY ===== */}
              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>📊 Top Actions Frequency</h3>
                {analytics.actionCounts && analytics.actionCounts.length > 0 ? (
                  (() => {
                    const maxCount = analytics.actionCounts[0]?.count || 1;
                    return analytics.actionCounts.slice(0, 8).map((item) => (
                      <HBar
                        key={item.action}
                        label={item.action}
                        value={Number(item.count)}
                        max={Number(maxCount)}
                        color="#0891b2"
                      />
                    ));
                  })()
                ) : (
                  <p style={{ color: "#9ca3af" }}>No action data</p>
                )}
              </div>
            </div>

            {/* ===== ACTION SUMMARY TABLE ===== */}
            <div className="dashboard-section">
              <h3>Action Summary</h3>

              {analytics.actionCounts && analytics.actionCounts.length > 0 ? (
                <div className="user-list">
                  {analytics.actionCounts.map((item) => (
                    <div key={item.action} className="user-card">
                      <p>
                        <strong>Action:</strong> {item.action}
                      </p>
                      <p>
                        <strong>Count:</strong> {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No action summary found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;