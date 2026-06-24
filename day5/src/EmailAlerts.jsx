import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

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
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div>
            <h2>📧 Email Alert Notifications</h2>
            <p style={styles.subText}>Test sending security alert emails</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>
            <button style={styles.btn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* ===== MESSAGE ===== */}
        {message && (
          <div
            style={{
              ...styles.messageBox,
              background: messageType === "success" ? "#dcfce7" : "#fee2e2",
              borderColor: messageType === "success" ? "#86efac" : "#fca5a5",
              color: messageType === "success" ? "#15803d" : "#991b1b",
            }}
          >
            {message}
          </div>
        )}

        {/* ===== TEST EMAIL ===== */}
        <div style={styles.section}>
          <h3>🧪 Test Email</h3>
          <p style={styles.sectionDesc}>Send a test email to verify notifications are working</p>
          <button
            style={{ ...styles.btn, background: "#0891b2" }}
            onClick={sendTestEmail}
            disabled={loading}
          >
            {loading ? "Sending..." : "📧 Send Test Email"}
          </button>
        </div>

        {/* ===== HIGH RISK ALERT ===== */}
        <div style={styles.section}>
          <h3>⚠️ High Risk Score Alert</h3>
          <p style={styles.sectionDesc}>Email when account risk score increases</p>
          <div style={styles.inputGroup}>
            <div style={styles.inputField}>
              <label>Risk Score (0-100):</label>
              <input
                type="range"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                style={styles.slider}
              />
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{riskScore}</span>
            </div>
            <div style={styles.inputField}>
              <label>Risk Level:</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} style={styles.select}>
                <option value="SECURE">SECURE</option>
                <option value="CAUTION">CAUTION</option>
                <option value="AT_RISK">AT_RISK</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
          <button
            style={{ ...styles.btn, background: "#dc2626" }}
            onClick={sendHighRiskAlert}
            disabled={loading}
          >
            {loading ? "Sending..." : "🚨 Send High Risk Alert"}
          </button>
        </div>

        {/* ===== SUSPICIOUS LOGIN ALERT ===== */}
        <div style={styles.section}>
          <h3>🚨 Suspicious Login Alert</h3>
          <p style={styles.sectionDesc}>Email on new device or location login</p>
          <button
            style={{ ...styles.btn, background: "#ea580c" }}
            onClick={sendSuspiciousLoginAlert}
            disabled={loading}
          >
            {loading ? "Sending..." : "🚨 Send Suspicious Login Alert"}
          </button>
        </div>

        {/* ===== PASSWORD EXPIRING ALERT ===== */}
        <div style={styles.section}>
          <h3>⏰ Password Expiring Alert</h3>
          <p style={styles.sectionDesc}>Email when password is getting old</p>
          <div style={styles.inputGroup}>
            <div style={styles.inputField}>
              <label>Days Old:</label>
              <input
                type="range"
                min="0"
                max="180"
                value={daysOld}
                onChange={(e) => setDaysOld(e.target.value)}
                style={styles.slider}
              />
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{daysOld} days</span>
            </div>
          </div>
          <button
            style={{ ...styles.btn, background: "#d97706" }}
            onClick={sendPasswordExpiringAlert}
            disabled={loading}
          >
            {loading ? "Sending..." : "⏰ Send Password Expiring Alert"}
          </button>
        </div>

        {/* ===== BRUTE FORCE ALERT ===== */}
        <div style={styles.section}>
          <h3>🔴 Brute Force Alert</h3>
          <p style={styles.sectionDesc}>Email on multiple failed login attempts</p>
          <div style={styles.inputGroup}>
            <div style={styles.inputField}>
              <label>Failed Attempts:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={failedAttempts}
                onChange={(e) => setFailedAttempts(e.target.value)}
                style={styles.slider}
              />
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{failedAttempts} attempts</span>
            </div>
          </div>
          <button
            style={{ ...styles.btn, background: "#991b1b" }}
            onClick={sendBruteForceAlert}
            disabled={loading}
          >
            {loading ? "Sending..." : "🔴 Send Brute Force Alert"}
          </button>
        </div>

        {/* ===== ACCOUNT LOCKED ALERT ===== */}
        <div style={styles.section}>
          <h3>🔐 Account Locked Alert</h3>
          <p style={styles.sectionDesc}>Email when account is locked</p>
          <button
            style={{ ...styles.btn, background: "#7c3aed" }}
            onClick={sendAccountLockedAlert}
            disabled={loading}
          >
            {loading ? "Sending..." : "🔐 Send Account Locked Alert"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: {
    maxWidth: "900px",
    margin: "auto",
    padding: "30px",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  subText: {
    color: "#6b7280",
    margin: "4px 0 0",
    fontSize: "14px",
  },
  btn: {
    padding: "10px 16px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    color: "white",
    background: "#374151",
    fontSize: "14px",
    fontWeight: "600",
  },
  messageBox: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "500",
  },
  section: {
    marginBottom: "24px",
    paddingBottom: "20px",
    borderBottom: "1px solid #e5e7eb",
  },
  sectionDesc: {
    color: "#6b7280",
    fontSize: "13px",
    margin: "4px 0 12px",
  },
  inputGroup: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  inputField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  slider: {
    width: "200px",
    cursor: "pointer",
  },
  select: {
    padding: "6px 8px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default EmailAlerts;