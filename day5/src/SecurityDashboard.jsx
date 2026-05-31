import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function SecurityDashboard() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [dashboard, setDashboard] = useState(null);
  const [topActions, setTopActions] = useState([]);
  const [sessionMetrics, setSessionMetrics] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ================= NEW FEATURE STATE =================
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ================= LOGOUT =================
  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= FETCH ALL =================
  const fetchAll = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        dashboardRes,
        topActionsRes,
        sessionMetricsRes,
        recentEventsRes,
      ] = await Promise.all([
        apiRequest("/security-dashboard", {
          method: "GET",
        }),

        apiRequest("/security-dashboard/top-actions", {
          method: "GET",
        }),

        apiRequest("/security-dashboard/session-metrics", {
          method: "GET",
        }),

        apiRequest("/security-dashboard/recent-events", {
          method: "GET",
        }),
      ]);

      setDashboard(dashboardRes.data);
      setTopActions(topActionsRes.data || []);
      setSessionMetrics(sessionMetricsRes.data);
      setRecentEvents(recentEventsRes.data || []);

      setLastUpdated(new Date());
    } catch (err) {
      if (err.message === "Session expired") {
        logoutUser();
        navigate("/login");
        return;
      }

      if (err.message === "Access denied") {
        navigate("/dashboard");
        return;
      }

      setError(err.message || "Failed to load security dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }

    fetchAll();
  }, []);

  // ================= AUTO REFRESH FEATURE =================
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAll(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // ================= DATE FORMATTER =================
  const formatDateTime = (val) => {
    if (!val) return "N/A";

    if (Array.isArray(val)) {
      const [y, mo, d, h, min] = val;

      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(
        2,
        "0"
      )} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }

    return new Date(val).toLocaleString();
  };

  // ================= STATUS COLORS =================
  const getStatusColor = (status) => {
    if (status === "SUCCESS" || status === "INFO") {
      return "#16a34a";
    }

    if (status === "WARNING") {
      return "#d97706";
    }

    if (status === "FAILED") {
      return "#dc2626";
    }

    return "#6b7280";
  };

  const getStatusBg = (status) => {
    if (status === "SUCCESS" || status === "INFO") {
      return "#dcfce7";
    }

    if (status === "WARNING") {
      return "#fef3c7";
    }

    if (status === "FAILED") {
      return "#fee2e2";
    }

    return "#f3f4f6";
  };

  // ================= LOGIN SUCCESS RATE =================
  const loginSuccessRate = useMemo(() => {
    if (!dashboard) return "N/A";

    const total =
      Number(dashboard.successfulLogins || 0) +
      Number(dashboard.failedLogins || 0);

    if (total === 0) return "N/A";

    return (
      (
        (Number(dashboard.successfulLogins || 0) / total) *
        100
      ).toFixed(1) + "%"
    );
  }, [dashboard]);

  // ================= EXPORT CSV FEATURE =================
  const exportEventsCSV = () => {
    if (recentEvents.length === 0) {
      alert("No events available");
      return;
    }

    const headers = [
      "Action",
      "Status",
      "Actor",
      "Target",
      "Details",
      "Created At",
    ];

    const rows = recentEvents.map((event) => [
      event.action,
      event.status,
      event.actorEmail,
      event.targetEmail || "",
      event.details || "",
      formatDateTime(event.createdAt),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((col) => `"${col}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "security-events.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Security Dashboard</h2>

            <p className="welcome-text">
              Real-time login activity, session threats and analytics.
            </p>

            {lastUpdated && (
              <p
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Last Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="inline-actions">

            {/* ===== AUTO REFRESH TOGGLE ===== */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh
                ? "Auto Refresh ON"
                : "Auto Refresh OFF"}
            </button>

            {/* ===== EXPORT CSV ===== */}
            <button
              type="button"
              onClick={exportEventsCSV}
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigate("/audit-logs")}
            >
              Audit Logs
            </button>

            <button
              type="button"
              onClick={() => navigate("/analytics")}
            >
              Analytics
            </button>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ===== SUSPICIOUS LOGIN ALERT ===== */}
        {dashboard?.suspiciousLogins > 0 && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #facc15",
              color: "#92400e",
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontWeight: "600",
            }}
          >
            ⚠️ Warning: {dashboard.suspiciousLogins} suspicious login attempts detected.
          </div>
        )}

        {/* ===== ERROR ===== */}
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {/* ===== LOADING ===== */}
        {loading ? (
          <p>Loading security dashboard...</p>
        ) : (
          <>
            {/* ===== OVERVIEW ===== */}
            <div className="dashboard-section">
              <h3>Overview</h3>

              <div className="analytics-grid">

                <div className="analytics-card">
                  <p>Total Audit Logs</p>
                  <h3>{dashboard?.totalLogs ?? 0}</h3>
                </div>

                <div className="analytics-card">
                  <p>Successful Logins</p>
                  <h3 style={{ color: "#16a34a" }}>
                    {dashboard?.successfulLogins ?? 0}
                  </h3>
                </div>

                <div className="analytics-card">
                  <p>Failed Logins</p>
                  <h3 style={{ color: "#dc2626" }}>
                    {dashboard?.failedLogins ?? 0}
                  </h3>
                </div>

                <div className="analytics-card">
                  <p>Suspicious Logins</p>
                  <h3 style={{ color: "#d97706" }}>
                    {dashboard?.suspiciousLogins ?? 0}
                  </h3>
                </div>

                <div className="analytics-card">
                  <p>Password Changes</p>
                  <h3>{dashboard?.passwordChanges ?? 0}</h3>
                </div>

                <div className="analytics-card">
                  <p>Active Sessions</p>
                  <h3 style={{ color: "#2563eb" }}>
                    {dashboard?.activeSessions ?? 0}
                  </h3>
                </div>

                <div className="analytics-card">
                  <p>Login Success Rate</p>
                  <h3>
                    {loginSuccessRate}
                  </h3>
                </div>

              </div>
            </div>

            {/* ===== SESSION METRICS ===== */}
            <div className="dashboard-section">
              <h3>Session Metrics</h3>

              {sessionMetrics ? (
                <div className="analytics-grid">

                  <div className="analytics-card">
                    <p>Total Sessions</p>
                    <h3>
                      {sessionMetrics.totalActiveSessions}
                    </h3>
                  </div>

                  <div className="analytics-card">
                    <p>Suspicious Sessions</p>
                    <h3 style={{ color: "#d97706" }}>
                      {sessionMetrics.suspiciousSessions}
                    </h3>
                  </div>

                  <div className="analytics-card">
                    <p>Mobile Sessions</p>
                    <h3>
                      {sessionMetrics.mobileSessions}
                    </h3>
                  </div>

                  <div className="analytics-card">
                    <p>Desktop Sessions</p>
                    <h3>
                      {sessionMetrics.desktopSessions}
                    </h3>
                  </div>

                </div>
              ) : (
                <p>No session data available</p>
              )}
            </div>

            {/* ===== TOP ACTIONS ===== */}
            <div className="dashboard-section">
              <h3>Top Actions</h3>

              {topActions.length === 0 ? (
                <p>No action data available</p>
              ) : (
                <div className="user-list">
                  {topActions.map((item, index) => {

                    const maxCount =
                      topActions[0]?.count || 1;

                    const barWidth = Math.max(
                      6,
                      Math.round(
                        (Number(item.count) /
                          Number(maxCount)) *
                          100
                      )
                    );

                    return (
                      <div
                        key={item.action}
                        className="user-card"
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px",
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            <strong>
                              #{index + 1}
                            </strong>{" "}

                            <span
                              style={{
                                fontFamily: "monospace",
                                background: "#f3f4f6",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {item.action}
                            </span>
                          </p>

                          <strong>
                            {item.count}
                          </strong>
                        </div>

                        {/* ===== BAR ===== */}
                        <div
                          style={{
                            background: "#e5e7eb",
                            borderRadius: "999px",
                            height: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${barWidth}%`,
                              background: "#2563eb",
                              height: "100%",
                              transition: "0.3s",
                            }}
                          />
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ===== RECENT EVENTS ===== */}
            <div className="dashboard-section">

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3>Recent Security Events</h3>

                {refreshing && (
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#2563eb",
                    }}
                  >
                    Refreshing...
                  </span>
                )}
              </div>

              {recentEvents.length === 0 ? (
                <p>No recent events found</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "14px 16px",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >

                        <div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "8px",
                            }}
                          >

                            <span
                              style={{
                                fontFamily: "monospace",
                                background: "#f3f4f6",
                                padding: "2px 10px",
                                borderRadius: "6px",
                                fontWeight: "700",
                              }}
                            >
                              {event.action}
                            </span>

                            <span
                              style={{
                                background: getStatusBg(
                                  event.status
                                ),
                                color: getStatusColor(
                                  event.status
                                ),
                                padding: "2px 10px",
                                borderRadius: "999px",
                                fontWeight: "700",
                                fontSize: "12px",
                              }}
                            >
                              {event.status}
                            </span>

                          </div>

                          <p>
                            <strong>Actor:</strong>{" "}
                            {event.actorEmail}
                          </p>

                          {event.targetEmail &&
                            event.targetEmail !==
                              event.actorEmail && (
                              <p>
                                <strong>Target:</strong>{" "}
                                {event.targetEmail}
                              </p>
                            )}

                          {event.details && (
                            <p
                              style={{
                                color: "#6b7280",
                              }}
                            >
                              {event.details}
                            </p>
                          )}

                        </div>

                        <small
                          style={{
                            color: "#9ca3af",
                          }}
                        >
                          {formatDateTime(
                            event.createdAt
                          )}
                        </small>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===== REFRESH BUTTON ===== */}
            <div
              style={{
                textAlign: "center",
                marginTop: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => fetchAll()}
                style={{
                  width: "auto",
                  minWidth: "220px",
                }}
              >
                Refresh Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SecurityDashboard;