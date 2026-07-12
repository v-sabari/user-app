import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, Banner } from "./ui";

/**
 * ✅ Day 80 — Email Alerts Component
 * Test sending alert emails
 */
function EmailAlerts() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [riskScore, setRiskScore] = useState(45);
  const [riskLevel, setRiskLevel] = useState("AT_RISK");
  const [daysOld, setDaysOld] = useState(85);
  const [failedAttempts, setFailedAttempts] = useState(6);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/email-alerts/test", { method: "POST" });
      setMessage(`✅ ${data.message}`);
      setMessageType("success");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const sendHighRiskAlert = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/email-alerts/high-risk", {
        method: "POST",
        body: JSON.stringify({ riskScore: parseInt(riskScore), riskLevel }),
      });
      setMessage(`✅ ${data.message}`);
      setMessageType("success");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const sendSuspiciousLoginAlert = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/email-alerts/suspicious-login", {
        method: "POST",
      });
      setMessage(`✅ ${data.message}`);
      setMessageType("success");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordExpiringAlert = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/email-alerts/password-expiring", {
        method: "POST",
        body: JSON.stringify({ daysOld: parseInt(daysOld) }),
      });
      setMessage(`✅ ${data.message}`);
      setMessageType("success");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const sendBruteForceAlert = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/email-alerts/brute-force", {
        method: "POST",
        body: JSON.stringify({ failedAttempts: parseInt(failedAttempts) }),
      });
      setMessage(`✅ ${data.message}`);
      setMessageType("success");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const sendAccountLockedAlert = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/email-alerts/account-locked", {
        method: "POST",
      });
      setMessage(`✅ ${data.message}`);
      setMessageType("success");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>📧 Email alert notifications</h2>
            <p className="welcome-text">Test sending security alert emails</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* ===== MESSAGE ===== */}
        {message && (
          <Banner tone={messageType === "success" ? "success" : "danger"} style={{ marginBottom: "20px" }}>
            {message}
          </Banner>
        )}

        {/* ===== TEST EMAIL ===== */}
        <div className="dashboard-section">
          <h3>🧪 Test email</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>Send a test email to verify notifications are working</p>
          <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }} onClick={sendTestEmail} disabled={loading}>
            {loading ? "Sending…" : "📧 Send test email"}
          </Button>
        </div>

        {/* ===== HIGH RISK ALERT ===== */}
        <div className="dashboard-section">
          <h3>⚠️ High risk score alert</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>Email when account risk score increases</p>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>Risk score (0–100):</label>
              <input
                type="range"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                style={{ width: "200px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{riskScore}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>Risk level:</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} style={{ width: "auto", marginTop: 0 }}>
                <option value="SECURE">SECURE</option>
                <option value="CAUTION">CAUTION</option>
                <option value="AT_RISK">AT_RISK</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
          <Button variant="danger" onClick={sendHighRiskAlert} disabled={loading}>
            {loading ? "Sending…" : "🚨 Send high risk alert"}
          </Button>
        </div>

        {/* ===== SUSPICIOUS LOGIN ALERT ===== */}
        <div className="dashboard-section">
          <h3>🚨 Suspicious login alert</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>Email on new device or location login</p>
          <Button variant="secondary" style={{ background: "#ea580c", color: "#fff" }} onClick={sendSuspiciousLoginAlert} disabled={loading}>
            {loading ? "Sending…" : "🚨 Send suspicious login alert"}
          </Button>
        </div>

        {/* ===== PASSWORD EXPIRING ALERT ===== */}
        <div className="dashboard-section">
          <h3>⏰ Password expiring alert</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>Email when password is getting old</p>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>Days old:</label>
              <input
                type="range"
                min="0"
                max="180"
                value={daysOld}
                onChange={(e) => setDaysOld(e.target.value)}
                style={{ width: "200px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{daysOld} days</span>
            </div>
          </div>
          <Button variant="secondary" style={{ background: "var(--warning)", color: "#fff" }} onClick={sendPasswordExpiringAlert} disabled={loading}>
            {loading ? "Sending…" : "⏰ Send password expiring alert"}
          </Button>
        </div>

        {/* ===== BRUTE FORCE ALERT ===== */}
        <div className="dashboard-section">
          <h3>🔴 Brute force alert</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>Email on multiple failed login attempts</p>
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--ink-soft)" }}>Failed attempts:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={failedAttempts}
                onChange={(e) => setFailedAttempts(e.target.value)}
                style={{ width: "200px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{failedAttempts} attempts</span>
            </div>
          </div>
          <Button variant="danger" style={{ background: "#991b1b" }} onClick={sendBruteForceAlert} disabled={loading}>
            {loading ? "Sending…" : "🔴 Send brute force alert"}
          </Button>
        </div>

        {/* ===== ACCOUNT LOCKED ALERT ===== */}
        <div className="dashboard-section" style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
          <h3>🔐 Account locked alert</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>Email when account is locked</p>
          <Button variant="secondary" style={{ background: "#7c3aed", color: "#fff" }} onClick={sendAccountLockedAlert} disabled={loading}>
            {loading ? "Sending…" : "🔐 Send account locked alert"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmailAlerts;