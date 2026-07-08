import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { publicRequest } from "./apiClient";
import { Button, Banner, AuthMark, PasswordStrengthMeter, MatchHint } from "./ui";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [form, setForm] = useState({
    token: tokenFromUrl,
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ================= INPUT CHANGE =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ✅ Client-side validation
    if (!form.token.trim()) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await publicRequest("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: form.token.trim(),
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });

      setMessage(
        data.message ||
          "Password reset successfully. Please login with your new password."
      );
      setSuccess(true);

      // ✅ Auto-redirect to login after 2.5 seconds
      setTimeout(() => navigate("/login"), 2500);

    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <AuthMark />
        <div className="auth-panel">

          <h2>Reset password</h2>
          <p className="auth-subtitle">Enter your new password below.</p>

          {/* ===== SUCCESS STATE ===== */}
          {success ? (
            <Banner tone="success">
              <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "15px" }}>
                ✅ Password reset successfully
              </p>
              <p style={{ margin: 0 }}>
                {message} Redirecting to login...
              </p>
            </Banner>
          ) : (
            <form onSubmit={handleSubmit}>

              {/* ===== TOKEN (show only if not in URL) ===== */}
              {!tokenFromUrl && (
                <div className="auth-field">
                  <label htmlFor="reset-token">Reset token</label>
                  <input
                    id="reset-token"
                    type="text"
                    name="token"
                    placeholder="Paste reset token from email"
                    value={form.token}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                  />
                </div>
              )}

              {/* ===== NEW PASSWORD ===== */}
              <div className="auth-field">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  type="password"
                  name="newPassword"
                  placeholder="Min 6 characters"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <PasswordStrengthMeter password={form.newPassword} />

              {/* ===== CONFIRM PASSWORD ===== */}
              <div className="auth-field">
                <label htmlFor="reset-confirm">Confirm new password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {form.confirmPassword.length > 0 && (
                <MatchHint matches={form.newPassword === form.confirmPassword} />
              )}

              <Button type="submit" variant="primary" block disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          )}

          {/* ===== ERROR MESSAGE ===== */}
          {error && (
            <div style={{ marginTop: "16px" }}>
              <Banner tone="danger">{error}</Banner>
            </div>
          )}

          {!success && (
            <div className="auth-links">
              <Link to="/login">← Back to login</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;