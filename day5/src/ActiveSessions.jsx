import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function ActiveSessions() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [terminating, setTerminating] = useState(null);

  // ✅ Day 70 — Terminate All state
  const [showTerminateAllModal, setShowTerminateAllModal] = useState(false);
  const [terminatingAll, setTerminatingAll] = useState(false);

  // ================= LOGOUT =================
  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= FETCH ALL ACTIVE SESSIONS =================
  const fetchSessions = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/admin/sessions", { method: "GET" });
      setSessions(data.data || []);
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
      setError(err.message || "Failed to load sessions");
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
    fetchSessions();
  }, []);

  // ================= TERMINATE ONE SESSION =================
  const handleTerminate = async (id, userEmail) => {
    if (!window.confirm(`Terminate session for ${userEmail}?`)) return;

    setTerminating(id);
    setMessage("");
    setError("");

    try {
      await apiRequest(`/admin/sessions/${id}`, { method: "DELETE" });
      setMessage(`Session for ${userEmail} terminated successfully`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message || "Failed to terminate session");
    } finally {
      setTerminating(null);
    }
  };

  // ✅ Day 70 — Terminate ALL sessions
  const handleTerminateAll = async () => {
    setTerminatingAll(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/admin/sessions", { method: "DELETE" });
      const count = data.data || sessions.length;
      setMessage(`✅ All ${count} active sessions have been terminated`);
      setSessions([]);
      setShowTerminateAllModal(false);

      // ✅ If admin terminated their own session too, redirect to login
      setTimeout(() => {
        logoutUser();
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.message || "Failed to terminate all sessions");
      setShowTerminateAllModal(false);
    } finally {
      setTerminatingAll(false);
    }
  };

  // ================= DATE FORMATTER =================
  const formatDateTime = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) {
      const [y, mo, d, h, min] = val;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    return new Date(val).toLocaleString();
  };

  // ================= DEVICE ICON =================
  const getDeviceIcon = (deviceType) => {
    if (deviceType === "MOBILE") return "📱";
    if (deviceType === "DESKTOP") return "🖥️";
    return "❓";
  };

  // ================= GROUP BY USER =================
  const groupedSessions = sessions.reduce((acc, session) => {
    const email = session.userEmail;
    if (!acc[email]) acc[email] = [];
    acc[email].push(session);
    return acc;
  }, {});

  const currentUserEmail = localStorage.getItem("userEmail");
  const uniqueUserCount = Object.keys(groupedSessions).length;

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Active Sessions</h2>
            <p className="welcome-text">
              All currently active user sessions system-wide —{" "}
              <strong>{sessions.length}</strong> active{" "}
              {sessions.length === 1 ? "session" : "sessions"}
              {uniqueUserCount > 0 && (
                <> across <strong>{uniqueUserCount}</strong> {uniqueUserCount === 1 ? "user" : "users"}</>
              )}.
            </p>
          </div>

          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button type="button" onClick={() => navigate("/security-dashboard")}>Security Dashboard</button>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ===== MESSAGES ===== */}
        {message && <p className="message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* ===== DAY 70 — TERMINATE ALL CONFIRMATION MODAL ===== */}
        {showTerminateAllModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px",
          }}>
            <div style={{
              background: "#fff", borderRadius: "16px", padding: "28px",
              maxWidth: "440px", width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              border: "1px solid #fecaca",
            }}>
              <h3 style={{ margin: "0 0 10px", color: "#dc2626", fontSize: "18px" }}>
                🚨 Terminate All Sessions
              </h3>

              <p style={{ margin: "0 0 8px", color: "#374151", fontSize: "14px", lineHeight: "1.6" }}>
                This will immediately terminate{" "}
                <strong style={{ color: "#dc2626" }}>all {sessions.length} active session{sessions.length !== 1 ? "s" : ""}</strong>{" "}
                across <strong>{uniqueUserCount} user{uniqueUserCount !== 1 ? "s" : ""}</strong>, including your own.
              </p>

              <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: "13px", lineHeight: "1.5" }}>
                All users will be logged out immediately. You will also be redirected to login after this action.
                This is an irreversible security action.
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button"
                  onClick={() => setShowTerminateAllModal(false)}
                  style={{ width: "auto", minWidth: "100px", marginTop: 0, background: "#6b7280" }}>
                  Cancel
                </button>
                <button type="button"
                  onClick={handleTerminateAll}
                  disabled={terminatingAll}
                  style={{ width: "auto", minWidth: "180px", marginTop: 0, background: terminatingAll ? "#9ca3af" : "#dc2626" }}>
                  {terminatingAll ? "Terminating..." : `Terminate All ${sessions.length} Sessions`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ACTION BAR ===== */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" style={{ width: "auto", minWidth: "140px" }}
            onClick={fetchSessions} disabled={loading}>
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>

          {/* ✅ Day 70 — Terminate All button */}
          {sessions.length > 0 && (
            <button type="button"
              onClick={() => setShowTerminateAllModal(true)}
              style={{
                width: "auto", minWidth: "180px", marginTop: 0,
                background: "#dc2626", display: "flex", alignItems: "center", gap: "6px",
              }}>
              🚨 Terminate All ({sessions.length})
            </button>
          )}
        </div>

        {/* ===== LOADING ===== */}
        {loading ? (
          <p>Loading active sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No active sessions found.</p>
        ) : (
          <>
            {/* ===== GROUPED BY USER ===== */}
            {Object.entries(groupedSessions).map(([email, userSessions]) => (
              <div key={email} className="dashboard-section" style={{ marginBottom: "20px" }}>

                {/* User header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: email === currentUserEmail ? "#2563eb" : "#374151",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "700", fontSize: "14px", flexShrink: 0,
                  }}>
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "700", color: "#111827", fontSize: "15px" }}>
                      {email}
                      {email === currentUserEmail && (
                        <span style={{ marginLeft: "8px", fontSize: "12px", background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                          You
                        </span>
                      )}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                      {userSessions.length} active {userSessions.length === 1 ? "session" : "sessions"}
                    </p>
                  </div>
                </div>

                {/* Session cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {userSessions.map((session) => (
                    <div key={session.id} style={{
                      background: session.suspicious ? "#fff7ed" : "#ffffff",
                      border: `1px solid ${session.suspicious ? "#fed7aa" : "#e5e7eb"}`,
                      borderRadius: "12px", padding: "14px 16px",
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", gap: "12px", flexWrap: "wrap",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "16px" }}>{getDeviceIcon(session.deviceType)}</span>
                          <span style={{ fontWeight: "600", color: "#111827", fontSize: "14px" }}>
                            {session.deviceType || "UNKNOWN"}
                          </span>
                          {session.suspicious && (
                            <span style={{ fontSize: "12px", background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                              ⚠️ Suspicious
                            </span>
                          )}
                          {session.loginType && session.loginType !== "NORMAL" && (
                            <span style={{ fontSize: "12px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                              {session.loginType}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "3px 0", fontSize: "13px", color: "#4b5563" }}>
                          <strong>IP:</strong> {session.ipAddress || "N/A"}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: "13px", color: "#4b5563" }}>
                          <strong>Started:</strong> {formatDateTime(session.createdAt)}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: "13px", color: "#4b5563" }}>
                          <strong>Expires:</strong> {formatDateTime(session.expiresAt)}
                        </p>
                      </div>

                      <button type="button"
                        onClick={() => handleTerminate(session.id, email)}
                        disabled={terminating === session.id}
                        style={{
                          width: "auto", minWidth: "120px", marginTop: 0,
                          background: terminating === session.id ? "#9ca3af" : "#dc2626",
                          flexShrink: 0, fontSize: "13px", padding: "8px 14px",
                        }}>
                        {terminating === session.id ? "Terminating..." : "Terminate"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default ActiveSessions;