import { useState } from "react";
import { Link } from "react-router-dom";
import { publicRequest } from "./apiClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ✅ Client-side validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const data = await publicRequest("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      setMessage(
        data.message ||
          "If this email is registered, a reset link has been sent."
      );
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className="auth-page">
      <div className="card auth-card">

        <h2>Forgot Password</h2>

        <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
          Enter your email and we'll send you a reset link.
        </p>

        {/* ===== SUCCESS STATE ===== */}
        {submitted ? (
          <>
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: "#dcfce7",
                color: "#15803d",
                border: "1px solid #86efac",
                fontSize: "14px",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "15px" }}>
                ✅ Check your inbox
              </p>
              <p style={{ margin: 0 }}>{message}</p>
            </div>

            <button
              type="button"
              onClick={() => { setSubmitted(false); setMessage(""); }}
              style={{ background: "#6b7280", marginBottom: "4px" }}
            >
              Send Another Link
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              autoComplete="email"
              autoFocus
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
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

        <p className="auth-link">
          <Link to="/login">← Back to Login</Link>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;