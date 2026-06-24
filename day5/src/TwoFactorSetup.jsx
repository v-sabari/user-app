import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

/**
 * ✅ Day 81 — Two Factor Authentication Setup
 * TOTP + SMS + Backup Codes
 */
function TwoFactorSetup() {
  const navigate = useNavigate();

  const [step, setStep] = useState("method"); // method | totp-setup | totp-verify | sms-setup
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // TOTP state
  const [totpSecret, setTotpSecret] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);

  // SMS state
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= GENERATE TOTP =================
  const generateTotpSecret = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/2fa/totp/generate", { method: "POST" });
      setTotpSecret(data.data.secret);
      setQrCode(data.data.qrCode);
      setMessage("✅ QR code generated. Scan it with Google Authenticator.");
      setMessageType("success");
      setStep("totp-verify");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY & ENABLE TOTP =================
  const verifyAndEnableTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setMessage("❌ Please enter a valid 6-digit code");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/2fa/totp/enable", {
        method: "POST",
        body: JSON.stringify({ totpSecret, totpCode }),
      });

      setBackupCodes(data.backupCodes);
      setMessage("✅ 2FA enabled successfully! Save your backup codes.");
      setMessageType("success");
      setStep("backup-codes");
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ================= SETUP SMS =================
  const setupSms = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setMessage("❌ Please enter a valid phone number");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/2fa/sms/setup", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });

      setMessage(`✅ Verification code sent to ${data.phoneNumber}`);
      setMessageType("success");
      setStep("sms-verify");
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
            <h2>🔐 Two-Factor Authentication</h2>
            <p style={styles.subText}>Secure your account with 2FA</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              style={{ ...styles.btn, background: "#2563eb" }}
              onClick={() => navigate("/profile")}
            >
              Back to Profile
            </button>
            <button style={styles.btn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

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

        {/* ===== STEP 1: CHOOSE METHOD ===== */}
        {step === "method" && (
          <div style={styles.section}>
            <h3>Choose Your 2FA Method</h3>
            <p style={styles.sectionDesc}>Select how you want to secure your account</p>

            <div style={styles.methodGrid}>
              {/* TOTP */}
              <div style={styles.methodCard}>
                <div style={styles.methodIcon}>📱</div>
                <h4>Google Authenticator</h4>
                <p>Use an authenticator app for codes</p>
                <button
                  style={{ ...styles.btn, background: "#2563eb" }}
                  onClick={generateTotpSecret}
                  disabled={loading}
                >
                  {loading ? "Setting up..." : "Setup TOTP →"}
                </button>
              </div>

              {/* SMS */}
              <div style={styles.methodCard}>
                <div style={styles.methodIcon}>📲</div>
                <h4>SMS Text Message</h4>
                <p>Receive codes via SMS</p>
                <button
                  style={{ ...styles.btn, background: "#16a34a" }}
                  onClick={() => setStep("sms-setup")}
                  disabled={loading}
                >
                  Setup SMS →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: TOTP SETUP ===== */}
        {step === "totp-verify" && qrCode && (
          <div style={styles.section}>
            <h3>Scan QR Code</h3>
            <p style={styles.sectionDesc}>
              Scan this QR code with Google Authenticator or Authy
            </p>

            <div style={styles.qrContainer}>
              <img src={qrCode} alt="TOTP QR Code" style={styles.qrImage} />
            </div>

            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
              📝 Manual entry key: <code>{totpSecret}</code>
            </p>

            <h4 style={{ marginTop: "20px" }}>Enter the 6-digit code:</h4>
            <input
              type="text"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength="6"
              style={styles.codeInput}
            />

            <button
              style={{ ...styles.btn, background: "#2563eb", marginTop: "12px" }}
              onClick={verifyAndEnableTotp}
              disabled={loading || totpCode.length !== 6}
            >
              {loading ? "Verifying..." : "✅ Verify & Enable"}
            </button>
          </div>
        )}

        {/* ===== STEP 3: BACKUP CODES ===== */}
        {step === "backup-codes" && (
          <div style={styles.section}>
            <h3>🔑 Save Your Backup Codes</h3>
            <p style={styles.sectionDesc}>
              Save these codes in a safe place. Use them if you lose access to your authenticator app.
            </p>

            <div style={styles.codesBox}>
              {backupCodes.map((code, i) => (
                <div key={i} style={styles.codeLine}>
                  <span>{i + 1}.</span>
                  <code>{code}</code>
                </div>
              ))}
            </div>

            <button
              style={{ ...styles.btn, background: "#16a34a" }}
              onClick={() => {
                const text = backupCodes.join("\n");
                navigator.clipboard.writeText(text);
                setMessage("✅ Codes copied to clipboard");
                setMessageType("success");
              }}
            >
              📋 Copy All Codes
            </button>

            <button
              style={{ ...styles.btn, background: "#2563eb", marginLeft: "8px" }}
              onClick={() => {
                const element = document.createElement("a");
                element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(backupCodes.join("\n")));
                element.setAttribute("download", "backup-codes.txt");
                element.style.display = "none";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              ⬇️ Download Codes
            </button>

            <button
              style={{ ...styles.btn, background: "#059669", marginTop: "20px" }}
              onClick={() => navigate("/profile")}
            >
              ✅ Done - Back to Profile
            </button>
          </div>
        )}

        {/* ===== STEP 4: SMS SETUP ===== */}
        {step === "sms-setup" && (
          <div style={styles.section}>
            <h3>📲 Setup SMS Verification</h3>
            <p style={styles.sectionDesc}>Enter your phone number to receive verification codes via SMS</p>

            <input
              type="tel"
              placeholder="Enter phone number (e.g., +91-9999999999)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={styles.input}
            />

            <button
              style={{ ...styles.btn, background: "#16a34a" }}
              onClick={setupSms}
              disabled={loading}
            >
              {loading ? "Sending..." : "📤 Send Verification Code"}
            </button>

            <button
              style={{ ...styles.btn, background: "#6b7280", marginTop: "12px" }}
              onClick={() => setStep("method")}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: {
    maxWidth: "700px",
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
  },
  section: {
    marginBottom: "24px",
  },
  sectionDesc: {
    color: "#6b7280",
    fontSize: "13px",
    margin: "4px 0 16px",
  },
  methodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  methodCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
  },
  methodIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  qrContainer: {
    textAlign: "center",
    padding: "20px",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  qrImage: {
    width: "280px",
    height: "280px",
    border: "1px solid #e5e7eb",
  },
  codeInput: {
    width: "100%",
    padding: "12px",
    fontSize: "24px",
    textAlign: "center",
    border: "2px solid #2563eb",
    borderRadius: "8px",
    letterSpacing: "8px",
  },
  codesBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  codeLine: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    fontFamily: "monospace",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  },
};

export default TwoFactorSetup;