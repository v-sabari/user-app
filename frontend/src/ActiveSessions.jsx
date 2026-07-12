import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button } from "./ui";

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
            <h2>Active sessions</h2>
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
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate("/security-dashboard")}>Security dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* ===== MESSAGES ===== */}
        {message && <p className="message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {/* ===== DAY 70 — TERMINATE ALL CONFIRMATION MODAL ===== */}
        {showTerminateAllModal && (
          <div className="modal-overlay">
            <div className="modal-panel" style={{ borderColor: "#fecaca" }}>
              <h3 style={{ margin: "0 0 10px", color: "var(--danger)", fontSize: "18px" }}>
                🚨 Terminate all sessions
              </h3>

              <p style={{ margin: "0 0 8px", color: "var(--ink-soft)", fontSize: "14px", lineHeight: "1.6" }}>
                This will immediately terminate{" "}
                <strong style={{ color: "var(--danger)" }}>all {sessions.length} active session{sessions.length !== 1 ? "s" : ""}</strong>{" "}
                across <strong>{uniqueUserCount} user{uniqueUserCount !== 1 ? "s" : ""}</strong>, including your own.
              </p>

              <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                All users will be logged out immediately. You will also be redirected to login after this action.
                This is an irreversible security action.
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <Button type="button" variant="secondary" onClick={() => setShowTerminateAllModal(false)}>Cancel</Button>
                <Button type="button" variant="danger" onClick={handleTerminateAll} disabled={terminatingAll}>
                  {terminatingAll ? "Terminating…" : `Terminate all ${sessions.length} sessions`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== ACTION BAR ===== */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <Button type="button" variant="secondary" onClick={fetchSessions} disabled={loading}>
            {loading ? "Loading…" : "🔄 Refresh"}
          </Button>

          {/* ✅ Day 70 — Terminate All button */}
          {sessions.length > 0 && (
            <Button type="button" variant="danger" onClick={() => setShowTerminateAllModal(true)}>
              🚨 Terminate all ({sessions.length})
            </Button>
          )}
        </div>

        {/* ===== LOADING ===== */}
        {loading ? (
          <p>Loading active sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No active sessions found.</p>
        ) : (
          <>
            {/* ===== GROUPED BY USER ===== */}
            {Object.entries(groupedSessions).map(([email, userSessions]) => (
              <div key={email} className="dashboard-section" style={{ marginBottom: "20px" }}>

                {/* User header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: email === currentUserEmail ? "var(--primary)" : "var(--ink-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "700", fontSize: "14px", flexShrink: 0,
                  }}>
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "700", color: "var(--ink)", fontSize: "15px" }}>
                      {email}
                      {email === currentUserEmail && (
                        <span style={{ marginLeft: "8px", fontSize: "12px", background: "var(--primary-soft)", color: "var(--primary)", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                          You
                        </span>
                      )}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                      {userSessions.length} active {userSessions.length === 1 ? "session" : "sessions"}
                    </p>
                  </div>
                </div>

                {/* Session cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {userSessions.map((session) => (
                    <div key={session.id} style={{
                      background: session.suspicious ? "#fff7ed" : "var(--surface)",
                      border: `1px solid ${session.suspicious ? "#fed7aa" : "var(--line)"}`,
                      borderRadius: "12px", padding: "14px 16px",
                      display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", gap: "12px", flexWrap: "wrap",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "16px" }}>{getDeviceIcon(session.deviceType)}</span>
                          <span style={{ fontWeight: "600", color: "var(--ink)", fontSize: "14px" }}>
                            {session.deviceType || "UNKNOWN"}
                          </span>
                          {session.suspicious && (
                            <span style={{ fontSize: "12px", background: "var(--danger-soft)", color: "var(--danger)", padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>
                              ⚠️ Suspicious
                            </span>
                          )}
                          {session.loginType && session.loginType !== "NORMAL" && (
                            <span style={{ fontSize: "12px", background: "var(--warning-soft)", color: "var(--warning-dark)", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                              {session.loginType}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "3px 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                          <strong>IP:</strong> {session.ipAddress || "N/A"}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                          <strong>Started:</strong> {formatDateTime(session.createdAt)}
                        </p>
                        <p style={{ margin: "3px 0", fontSize: "13px", color: "var(--ink-soft)" }}>
                          <strong>Expires:</strong> {formatDateTime(session.expiresAt)}
                        </p>
                      </div>

                      <Button type="button" variant="danger"
                        onClick={() => handleTerminate(session.id, email)}
                        disabled={terminating === session.id}
                        style={{ flexShrink: 0, fontSize: "13px" }}>
                        {terminating === session.id ? "Terminating…" : "Terminate"}
                      </Button>
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