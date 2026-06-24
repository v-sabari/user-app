import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function Analytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState("");

  // ✅ Day 67 — Trend chart state
  const [loginTrend, setLoginTrend] = useState([]);
  const [registerTrend, setRegisterTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  // ✅ Day 74 — Inactive users state
  const [inactiveData, setInactiveData] = useState(null);
  const [inactiveLoading, setInactiveLoading] = useState(true);

  const handleLogout = () => { logoutUser(); navigate("/login"); };

  const fetchAnalytics = async () => {
    try {
      const profile = await apiRequest("/auth/me", { method: "GET" });
      if (profile.data.role !== "ADMIN") { navigate("/dashboard"); return; }
      const data = await apiRequest("/analytics/admin", { method: "GET" });
      setAnalytics(data.data);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to fetch analytics");
      if (error.message === "Session expired") navigate("/login");
      if (error.message === "Access denied") navigate("/dashboard");
    }
  };

  // ✅ Day 67 — Fetch trend datasets
  const fetchTrends = async () => {
    setTrendLoading(true);
    try {
      const [loginData, registerData] = await Promise.all([
        apiRequest("/analytics/trend?action=LOGIN&days=7", { method: "GET" }),
        apiRequest("/analytics/trend?action=REGISTER&days=7", { method: "GET" }),
      ]);
      setLoginTrend(loginData.data || []);
      setRegisterTrend(registerData.data || []);
    } catch (err) {
      console.error("Trend fetch error:", err.message);
    } finally {
      setTrendLoading(false);
    }
  };

  // ✅ Day 74 — Fetch inactive users
  const fetchInactiveUsers = async () => {
    setInactiveLoading(true);
    try {
      const data = await apiRequest("/analytics/inactive-users", { method: "GET" });
      setInactiveData(data.data);
    } catch (err) {
      console.error("Inactive users fetch error:", err.message);
    } finally {
      setInactiveLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchTrends();
    fetchInactiveUsers();
  }, []);

  // ================= FORMAT DATE LABEL =================
  const formatDayLabel = (dateStr) => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
    } catch { return dateStr; }
  };

  // ================= VERTICAL BAR CHART =================
  const VerticalBarChart = ({ data, color, emptyMsg }) => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const totalForPeriod = data.reduce((sum, d) => sum + d.count, 0);
    return (
      <div>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
          Total past 7 days: <strong style={{ color: "#111827" }}>{totalForPeriod}</strong>
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "140px" }}>
          {data.map((item) => {
            const heightPct = maxCount > 0 ? Math.max(4, Math.round((item.count / maxCount) * 100)) : 4;
            const isZero = item.count === 0;
            return (
              <div key={item.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: isZero ? "#d1d5db" : "#111827", minHeight: "16px" }}>{item.count}</span>
                <div style={{ width: "100%", height: `${heightPct}%`, background: isZero ? "#e5e7eb" : color, borderRadius: "6px 6px 0 0", transition: "height 0.4s ease", minHeight: "4px" }} />
              </div>
            );
          })}
        </div>
        <div style={{ height: "1px", background: "#e5e7eb", margin: "0 0 6px" }} />
        <div style={{ display: "flex", gap: "8px" }}>
          {data.map((item) => (
            <div key={item.date} style={{ flex: 1, textAlign: "center", fontSize: "10px", color: "#9ca3af", fontWeight: "500", lineHeight: "1.3" }}>
              {formatDayLabel(item.date)}
            </div>
          ))}
        </div>
        {totalForPeriod === 0 && <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", marginTop: "12px" }}>{emptyMsg}</p>}
      </div>
    );
  };

  // ================= BAR HELPERS =================
  const HBar = ({ label, value, max, color, showCount = true }) => {
    const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
    return (
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{label}</span>
          {showCount && <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>{value}</span>}
        </div>
        <div style={{ background: "#e5e7eb", borderRadius: "999px", height: "12px", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: "999px", transition: "width 0.5s ease" }} />
        </div>
      </div>
    );
  };

  const StackedBar = ({ leftLabel, leftValue, rightLabel, rightValue, leftColor, rightColor }) => {
    const total = leftValue + rightValue;
    const leftPct = total > 0 ? Math.round((leftValue / total) * 100) : 50;
    const rightPct = 100 - leftPct;
    return (
      <div>
        <div style={{ display: "flex", borderRadius: "999px", overflow: "hidden", height: "28px" }}>
          <div style={{ width: `${leftPct}%`, background: leftColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "white", minWidth: leftValue > 0 ? "40px" : "0", transition: "width 0.5s ease" }}>
            {leftValue > 0 ? leftValue : ""}
          </div>
          <div style={{ width: `${rightPct}%`, background: rightColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "white", minWidth: rightValue > 0 ? "40px" : "0", transition: "width 0.5s ease" }}>
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

  // ✅ Day 74 — Status badge for inactive users table
  const statusBadge = (status) => {
    const cls = status === "ACTIVE" ? "status-badge status-active"
      : status === "LOCKED" ? "status-badge status-locked"
      : "status-badge status-inactive";
    return <span className={cls}>{status}</span>;
  };

  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Admin Analytics</h2>
            <p className="welcome-text">Real-time user, security, and activity insights.</p>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button type="button" onClick={() => navigate("/audit-logs")}>Audit Logs</button>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        {!analytics ? (
          <p>Loading analytics...</p>
        ) : (
          <>
            {/* ===== STAT CARDS ===== */}
            <div className="analytics-grid">
              <div className="analytics-card"><p>Total Users</p><h3>{analytics.totalUsers}</h3></div>
              <div className="analytics-card"><p>Active Users</p><h3 style={{ color: "#16a34a" }}>{analytics.activeUsers}</h3></div>
              <div className="analytics-card"><p>Inactive Users</p><h3 style={{ color: "#d97706" }}>{analytics.inactiveUsers}</h3></div>
              <div className="analytics-card"><p>Locked Users</p><h3 style={{ color: "#dc2626" }}>{analytics.lockedUsers}</h3></div>
              <div className="analytics-card"><p>Admin Users</p><h3 style={{ color: "#7c3aed" }}>{analytics.adminUsers}</h3></div>
              <div className="analytics-card"><p>Normal Users</p><h3>{analytics.normalUsers}</h3></div>
              <div className="analytics-card"><p>Total Audit Logs</p><h3>{analytics.totalAuditLogs}</h3></div>
              <div className="analytics-card"><p>Successful Actions</p><h3 style={{ color: "#16a34a" }}>{analytics.successfulActions}</h3></div>
              <div className="analytics-card"><p>Failed Actions</p><h3 style={{ color: "#dc2626" }}>{analytics.failedActions}</h3></div>
            </div>

            {/* ===== DAY 74 — INACTIVE ACCOUNTS REPORT ===== */}
            <div className="dashboard-section" style={{ border: "1px solid #fed7aa", borderRadius: "12px", background: "#fffbeb", padding: "20px", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 6px", color: "#92400e" }}>👻 Inactive Accounts Report</h3>
              <p style={{ color: "#78350f", fontSize: "13px", marginBottom: "16px", lineHeight: "1.6" }}>
                Users who have <strong>never successfully logged in</strong> since registration.
              </p>

              {inactiveLoading ? (
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>Loading inactive accounts...</p>
              ) : !inactiveData ? (
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>Could not load inactive accounts.</p>
              ) : (
                <>
                  {/* ===== Summary stats ===== */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                    <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 20px", textAlign: "center", minWidth: "120px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#92400e", textTransform: "uppercase" }}>Never Logged In</p>
                      <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#d97706" }}>{inactiveData.count}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>of {inactiveData.totalUsers} total users</p>
                    </div>
                    <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 20px", textAlign: "center", minWidth: "120px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#92400e", textTransform: "uppercase" }}>Percentage</p>
                      <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: inactiveData.percentage > 20 ? "#dc2626" : "#d97706" }}>
                        {inactiveData.percentage}%
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                        {inactiveData.percentage > 20 ? "⚠️ high" : "✅ normal"}
                      </p>
                    </div>
                  </div>

                  {/* ===== User list ===== */}
                  {inactiveData.users.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                      <p style={{ margin: 0, color: "#15803d", fontWeight: "600" }}>✅ All registered users have logged in at least once!</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {inactiveData.users.map((user) => (
                        <div key={user.id} style={{
                          background: "#fff",
                          border: "1px solid #fde68a",
                          borderLeft: "4px solid #d97706",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}>
                          <div>
                            <p style={{ margin: "0 0 2px", fontWeight: "700", color: "#111827", fontSize: "14px" }}>{user.name}</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{user.email}</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", background: user.role === "ADMIN" ? "#f5f3ff" : "#f9fafb", color: user.role === "ADMIN" ? "#7c3aed" : "#374151", padding: "2px 8px", borderRadius: "999px", border: "1px solid " + (user.role === "ADMIN" ? "#ddd6fe" : "#e5e7eb"), fontWeight: "600" }}>
                              {user.role}
                            </span>
                            {statusBadge(user.status)}
                            <button
                              type="button"
                              onClick={() => navigate("/users")}
                              style={{ width: "auto", minWidth: "100px", marginTop: 0, fontSize: "12px", padding: "5px 10px", background: "#d97706" }}
                            >
                              Manage →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ===== DAY 67 — 7-DAY TREND CHARTS ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div className="dashboard-section">
                <h3 style={{ marginBottom: "4px" }}>📈 Daily Logins — Last 7 Days</h3>
                {trendLoading ? <p style={{ color: "#9ca3af", fontSize: "13px" }}>Loading trend...</p>
                  : <VerticalBarChart data={loginTrend} color="#2563eb" emptyMsg="No logins recorded this week" />}
              </div>
              <div className="dashboard-section">
                <h3 style={{ marginBottom: "4px" }}>👤 Daily Registrations — Last 7 Days</h3>
                {trendLoading ? <p style={{ color: "#9ca3af", fontSize: "13px" }}>Loading trend...</p>
                  : <VerticalBarChart data={registerTrend} color="#16a34a" emptyMsg="No registrations recorded this week" />}
              </div>
            </div>

            {/* ===== EXISTING CHART ROW ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "20px" }}>

              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>👥 User Status Breakdown</h3>
                <HBar label="Active" value={analytics.activeUsers} max={analytics.totalUsers} color="#16a34a" />
                <HBar label="Inactive" value={analytics.inactiveUsers} max={analytics.totalUsers} color="#d97706" />
                <HBar label="Locked" value={analytics.lockedUsers} max={analytics.totalUsers} color="#dc2626" />
                <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9ca3af", textAlign: "right" }}>Total: {analytics.totalUsers} users</p>
              </div>

              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>🔑 Role Distribution</h3>
                <HBar label="USER" value={analytics.normalUsers} max={analytics.totalUsers} color="#2563eb" />
                <HBar label="ADMIN" value={analytics.adminUsers} max={analytics.totalUsers} color="#7c3aed" />
                <div style={{ marginTop: "20px" }}>
                  <StackedBar leftLabel="USER" leftValue={analytics.normalUsers} rightLabel="ADMIN" rightValue={analytics.adminUsers} leftColor="#2563eb" rightColor="#7c3aed" />
                </div>
              </div>

              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>✅ Action Success Rate</h3>
                <HBar label="Successful" value={analytics.successfulActions} max={analytics.totalAuditLogs} color="#16a34a" />
                <HBar label="Failed" value={analytics.failedActions} max={analytics.totalAuditLogs} color="#dc2626" />
                {(() => {
                  const total = analytics.successfulActions + analytics.failedActions;
                  const rate = total > 0 ? ((analytics.successfulActions / total) * 100).toFixed(1) : 0;
                  const color = rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626";
                  return (
                    <div style={{ marginTop: "16px", textAlign: "center", background: color + "12", border: `1px solid ${color}30`, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Success Rate</p>
                      <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: "700", color }}>{rate}%</p>
                    </div>
                  );
                })()}
              </div>

              <div className="dashboard-section">
                <h3 style={{ marginBottom: "20px" }}>📊 Top Actions Frequency</h3>
                {analytics.actionCounts && analytics.actionCounts.length > 0 ? (
                  (() => {
                    const maxCount = analytics.actionCounts[0]?.count || 1;
                    return analytics.actionCounts.slice(0, 8).map((item) => (
                      <HBar key={item.action} label={item.action} value={Number(item.count)} max={Number(maxCount)} color="#0891b2" />
                    ));
                  })()
                ) : <p style={{ color: "#9ca3af" }}>No action data</p>}
              </div>
            </div>

            {/* ===== ACTION SUMMARY TABLE ===== */}
            <div className="dashboard-section">
              <h3>Action Summary</h3>
              {analytics.actionCounts && analytics.actionCounts.length > 0 ? (
                <div className="user-list">
                  {analytics.actionCounts.map((item) => (
                    <div key={item.action} className="user-card">
                      <p><strong>Action:</strong> {item.action}</p>
                      <p><strong>Count:</strong> {item.count}</p>
                    </div>
                  ))}
                </div>
              ) : <p>No action summary found</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;