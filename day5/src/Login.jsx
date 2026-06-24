import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicRequest, apiRequest } from "./apiClient";

/**
 * ✅ Day 81 — Updated Login with 2FA Support
 * After password, user can enter TOTP or backup code if 2FA enabled
 */
function Login() {

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState(null);

  // 2FA state
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorType, setTwoFactorType] = useState("totp"); // totp or backup
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const navigate = useNavigate();

  // ================= INPUT CHANGE =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= LOGIN =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await publicRequest(
        "/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email.trim().toLowerCase(),
            password: form.password,
          }),
        }
      );

      // ✅ Day 81 — Check if 2FA required
      if (data.data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTempToken(data.data.tempToken);
        setMessage("Enter your 2FA code to continue");
        return;
      }

      // ================= STORE TOKENS =================
      localStorage.setItem("token", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("userEmail", form.email.trim().toLowerCase());
      localStorage.setItem("role", data.data.role);

      // ================= SECURITY ALERT FLAGS =================
      localStorage.setItem(
        "loginAlert",
        data.data.suspicious
          ? "suspicious"
          : data.data.newDevice
          ? "newDevice"
          : "none"
      );

      navigate("/dashboard");

    } catch (err) {
      const errorMessage = err?.message || "";

      if (errorMessage.toLowerCase().includes("locked")) {
        setMessage("Your account has been locked due to multiple failed login attempts. Please contact support.");
      } else if (errorMessage.toLowerCase().includes("inactive")) {
        setMessage("Your account is currently inactive. Please contact an administrator.");
      } else {
        setMessage(errorMessage || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY 2FA CODE =================
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFactorLoading(true);

    try {
      const endpoint = twoFactorType === "totp" ? "/2fa/totp/verify" : "/2fa/backup/verify";

      const data = await publicRequest(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tempToken}`,
          },
          body: JSON.stringify({ code: twoFactorCode }),
        }
      );

      if (!data.success) {
        setMessage("Invalid 2FA code. Please try again.");
        setTwoFactorCode("");
        return;
      }

      // ================= STORE TOKENS =================
      localStorage.setItem("token", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("userEmail", form.email.trim().toLowerCase());
      localStorage.setItem("role", data.data.role);

      navigate("/dashboard");

    } catch (err) {
      setMessage(err.message || "2FA verification failed");
      setTwoFactorCode("");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="auth-page">
      <div className="card auth-card">

        {/* ===== NORMAL LOGIN ===== */}
        {!twoFactorRequired && (
          <>
            <h2>Login</h2>
            <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
              Access your account securely
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {message && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  background:
                    message.toLowerCase().includes("locked") ? "#fee2e2" : "#fef3c7",
                  color:
                    message.toLowerCase().includes("locked") ? "#b91c1c" : "#92400e",
                  border:
                    message.toLowerCase().includes("locked")
                      ? "1px solid #fca5a5"
                      : "1px solid #fde68a",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {message}
              </div>
            )}

            <p className="auth-link">
              <Link to="/forgot-password">Forgot Password?</Link>
            </p>

            <p className="auth-link">
              Don&apos;t have an account?{" "}
              <Link to="/register">Register</Link>
            </p>
          </>
        )}

        {/* ✅ Day 81 — 2FA VERIFICATION ===== */}
        {twoFactorRequired && (
          <>
            <h2>🔐 Two-Factor Authentication</h2>
            <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
              Enter your 2FA code to complete login
            </p>

            <form onSubmit={handleVerify2FA}>
              {/* ===== 2FA TYPE SELECTOR ===== */}
              <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setTwoFactorType("totp")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: twoFactorType === "totp" ? "2px solid #2563eb" : "1px solid #d1d5db",
                    background: twoFactorType === "totp" ? "#eff6ff" : "#f9fafb",
                    color: twoFactorType === "totp" ? "#2563eb" : "#6b7280",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  📱 Authenticator
                </button>
                <button
                  type="button"
                  onClick={() => setTwoFactorType("backup")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: twoFactorType === "backup" ? "2px solid #2563eb" : "1px solid #d1d5db",
                    background: twoFactorType === "backup" ? "#eff6ff" : "#f9fafb",
                    color: twoFactorType === "backup" ? "#2563eb" : "#6b7280",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🔑 Backup Code
                </button>
              </div>

              {/* ===== 2FA CODE INPUT ===== */}
              {twoFactorType === "totp" ? (
                <>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength="6"
                    style={{
                      fontSize: "24px",
                      textAlign: "center",
                      letterSpacing: "8px",
                      fontWeight: "600",
                      padding: "12px",
                    }}
                    required
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                    Backup Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 8-character backup code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                    maxLength="8"
                    required
                    autoFocus
                  />
                </>
              )}

              <button type="submit" disabled={twoFactorLoading} style={{ marginTop: "16px" }}>
                {twoFactorLoading ? "Verifying..." : "✅ Verify"}
              </button>
            </form>

            {message && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: message.includes("Invalid") ? "#fee2e2" : "#dcfce7",
                  color: message.includes("Invalid") ? "#b91c1c" : "#15803d",
                  border: message.includes("Invalid") ? "1px solid #fca5a5" : "1px solid #86efac",
                  fontSize: "14px",
                }}
              >
                {message}
              </div>
            )}

            <p
              style={{
                marginTop: "20px",
                textAlign: "center",
                fontSize: "13px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setTwoFactorRequired(false);
                  setTwoFactorCode("");
                  setMessage("");
                  setTempToken(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "13px",
                }}
              >
                ← Back to Login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;