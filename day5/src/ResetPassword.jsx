import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { publicRequest } from "./apiClient";

// ================= PASSWORD STRENGTH =================
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "#dc2626" };
  if (score === 2) return { score: 2, label: "Fair", color: "#d97706" };
  if (score === 3) return { score: 3, label: "Good", color: "#2563eb" };
  return { score: 4, label: "Strong", color: "#16a34a" };
};

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

  const strength = getPasswordStrength(form.newPassword);

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
    <div className="auth-page">
      <div className="card auth-card">

        <h2>Reset Password</h2>

        <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
          Enter your new password below.
        </p>

        {/* ===== SUCCESS STATE ===== */}
        {success ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "15px" }}>
              ✅ Password reset successfully
            </p>
            <p style={{ margin: 0 }}>
              {message} Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* ===== TOKEN (show only if not in URL) ===== */}
            {!tokenFromUrl && (
              <input
                type="text"
                name="token"
                placeholder="Paste reset token from email"
                value={form.token}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            )}

            {/* ===== NEW PASSWORD ===== */}
            <input
              type="password"
              name="newPassword"
              placeholder="New password (min 6 characters)"
              value={form.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
            />

            {/* ===== PASSWORD STRENGTH ===== */}
            {form.newPassword.length > 0 && (
              <div style={{ marginTop: "-8px", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "999px",
                        background: strength.score >= level ? strength.color : "#e5e7eb",
                        transition: "background 0.3s ease",
                      }}
                    />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: strength.color }}>
                  {strength.label} password
                </p>
              </div>
            )}

            {/* ===== CONFIRM PASSWORD ===== */}
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
            />

            {/* ===== MATCH INDICATOR ===== */}
            {form.confirmPassword.length > 0 && (
              <p
                style={{
                  margin: "-8px 0 12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: form.newPassword === form.confirmPassword ? "#16a34a" : "#dc2626",
                }}
              >
                {form.newPassword === form.confirmPassword
                  ? "✅ Passwords match"
                  : "❌ Passwords do not match"}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* ===== ERROR MESSAGE ===== */}
        {error && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {error}
          </div>
        )}

        {!success && (
          <p className="auth-link">
            <Link to="/login">← Back to Login</Link>
          </p>
        )}

      </div>
    </div>
  );
}

export default ResetPassword;