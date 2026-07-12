import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, Banner } from "./ui";

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
    <div className="container">
      <div className="card" style={{ maxWidth: "700px" }}>
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>🔐 Two-factor authentication</h2>
            <p className="welcome-text">Secure your account with 2FA</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/profile")}>Back to profile</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && (
          <Banner tone={messageType === "success" ? "success" : "danger"} style={{ marginBottom: "20px" }}>
            {message}
          </Banner>
        )}

        {/* ===== STEP 1: CHOOSE METHOD ===== */}
        {step === "method" && (
          <div style={{ marginBottom: "24px" }}>
            <h3>Choose your 2FA method</h3>
            <p className="welcome-text" style={{ marginBottom: "16px" }}>Select how you want to secure your account</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {/* TOTP */}
              <div className="stat-card" style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📱</div>
                <h4 style={{ margin: "0 0 6px" }}>Google Authenticator</h4>
                <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "13px" }}>Use an authenticator app for codes</p>
                <Button variant="primary" onClick={generateTotpSecret} disabled={loading}>
                  {loading ? "Setting up…" : "Setup TOTP →"}
                </Button>
              </div>

              {/* SMS */}
              <div className="stat-card" style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📲</div>
                <h4 style={{ margin: "0 0 6px" }}>SMS text message</h4>
                <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "13px" }}>Receive codes via SMS</p>
                <Button variant="secondary" style={{ background: "var(--success)", color: "#fff" }} onClick={() => setStep("sms-setup")} disabled={loading}>
                  Setup SMS →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: TOTP SETUP ===== */}
        {step === "totp-verify" && qrCode && (
          <div style={{ marginBottom: "24px" }}>
            <h3>Scan QR code</h3>
            <p className="welcome-text" style={{ marginBottom: "16px" }}>
              Scan this QR code with Google Authenticator or Authy
            </p>

            <div style={{ textAlign: "center", padding: "20px", background: "var(--surface-sunken)", borderRadius: "var(--r-lg)" }}>
              <img src={qrCode} alt="TOTP QR Code" style={{ width: "280px", height: "280px", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }} />
            </div>

            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "12px" }}>
              📝 Manual entry key: <code style={{ fontFamily: "var(--font-mono)" }}>{totpSecret}</code>
            </p>

            <h4 style={{ marginTop: "20px" }}>Enter the 6-digit code:</h4>
            <input
              type="text"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength="6"
              className="code-input"
              style={{ borderColor: "var(--primary)", borderWidth: "2px" }}
            />

            <div style={{ marginTop: "12px" }}>
              <Button variant="primary" onClick={verifyAndEnableTotp} disabled={loading || totpCode.length !== 6}>
                {loading ? "Verifying…" : "✅ Verify & enable"}
              </Button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: BACKUP CODES ===== */}
        {step === "backup-codes" && (
          <div style={{ marginBottom: "24px" }}>
            <h3>🔑 Save your backup codes</h3>
            <p className="welcome-text" style={{ marginBottom: "16px" }}>
              Save these codes in a safe place. Use them if you lose access to your authenticator app.
            </p>

            <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "16px", marginBottom: "16px", maxHeight: "300px", overflowY: "auto" }}>
              {backupCodes.map((code, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                  <span>{i + 1}.</span>
                  <code>{code}</code>
                </div>
              ))}
            </div>

            <div className="inline-actions">
              <Button
                variant="secondary"
                style={{ background: "var(--success)", color: "#fff" }}
                onClick={() => {
                  const text = backupCodes.join("\n");
                  navigator.clipboard.writeText(text);
                  setMessage("✅ Codes copied to clipboard");
                  setMessageType("success");
                }}
              >
                📋 Copy all codes
              </Button>

              <Button
                variant="primary"
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
                ⬇️ Download codes
              </Button>
            </div>

            <div style={{ marginTop: "20px" }}>
              <Button variant="secondary" style={{ background: "#059669", color: "#fff" }} onClick={() => navigate("/profile")}>
                ✅ Done — back to profile
              </Button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: SMS SETUP ===== */}
        {step === "sms-setup" && (
          <div style={{ marginBottom: "24px" }}>
            <h3>📲 Setup SMS verification</h3>
            <p className="welcome-text" style={{ marginBottom: "16px" }}>Enter your phone number to receive verification codes via SMS</p>

            <input
              type="tel"
              placeholder="Enter phone number (e.g., +91-9999999999)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <div className="inline-actions" style={{ marginTop: "4px" }}>
              <Button variant="secondary" style={{ background: "var(--success)", color: "#fff" }} onClick={setupSms} disabled={loading}>
                {loading ? "Sending…" : "📤 Send verification code"}
              </Button>
              <Button variant="secondary" onClick={() => setStep("method")}>← Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TwoFactorSetup;