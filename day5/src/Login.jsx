import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicRequest, apiRequest } from "./apiClient";
import { Button, Banner, AuthMark } from "./ui";

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
    <div className="auth-screen">
      <div className="auth-shell">
        <AuthMark />
        <div className="auth-panel">

          {/* ===== NORMAL LOGIN ===== */}
          {!twoFactorRequired && (
            <>
              <h2>Welcome back</h2>
              <p className="auth-subtitle">Access your account securely</p>

              <form onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" variant="primary" block disabled={loading}>
                  {loading ? "Logging in…" : "Log in"}
                </Button>
              </form>

              {message && (
                <div style={{ marginTop: "16px" }}>
                  <Banner tone={message.toLowerCase().includes("locked") ? "danger" : "warning"}>
                    {message}
                  </Banner>
                </div>
              )}

              <div className="auth-links">
                <Link to="/forgot-password">Forgot password?</Link>
                <span>
                  Don&apos;t have an account? <Link to="/register">Register</Link>
                </span>
              </div>
            </>
          )}

          {/* ✅ Day 81 — 2FA VERIFICATION ===== */}
          {twoFactorRequired && (
            <>
              <h2>🔐 Two-factor authentication</h2>
              <p className="auth-subtitle">Enter your 2FA code to complete login</p>

              <form onSubmit={handleVerify2FA}>
                {/* ===== 2FA TYPE SELECTOR ===== */}
                <div className="pill-toggle">
                  <button
                    type="button"
                    className={twoFactorType === "totp" ? "is-active" : ""}
                    onClick={() => setTwoFactorType("totp")}
                  >
                    📱 Authenticator
                  </button>
                  <button
                    type="button"
                    className={twoFactorType === "backup" ? "is-active" : ""}
                    onClick={() => setTwoFactorType("backup")}
                  >
                    🔑 Backup Code
                  </button>
                </div>

                {/* ===== 2FA CODE INPUT ===== */}
                {twoFactorType === "totp" ? (
                  <div className="auth-field">
                    <label>6-Digit Code</label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength="6"
                      className="code-input"
                      required
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="auth-field">
                    <label>Backup Code</label>
                    <input
                      type="text"
                      placeholder="Enter 8-character backup code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.toUpperCase())}
                      maxLength="8"
                      required
                      autoFocus
                    />
                  </div>
                )}

                <Button type="submit" variant="primary" block disabled={twoFactorLoading}>
                  {twoFactorLoading ? "Verifying…" : "✅ Verify"}
                </Button>
              </form>

              {message && (
                <div style={{ marginTop: "16px" }}>
                  <Banner tone={message.includes("Invalid") ? "danger" : "success"}>
                    {message}
                  </Banner>
                </div>
              )}

              <div className="auth-links">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorRequired(false);
                    setTwoFactorCode("");
                    setMessage("");
                    setTempToken(null);
                  }}
                  style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: 600, fontSize: "13.5px" }}
                >
                  ← Back to login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;