import { useState } from "react";
import { Link } from "react-router-dom";
import { publicRequest } from "./apiClient";
import { Button, Banner, AuthMark } from "./ui";

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
    <div className="auth-screen">
      <div className="auth-shell">
        <AuthMark />
        <div className="auth-panel">

          <h2>Forgot password</h2>
          <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link.</p>

          {/* ===== SUCCESS STATE ===== */}
          {submitted ? (
            <>
              <Banner tone="success">
                <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "15px" }}>
                  ✅ Check your inbox
                </p>
                <p style={{ margin: 0 }}>{message}</p>
              </Banner>

              <div style={{ marginTop: "16px" }}>
                <Button
                  type="button"
                  variant="secondary"
                  block
                  onClick={() => { setSubmitted(false); setMessage(""); }}
                >
                  Send another link
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="forgot-email">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button type="submit" variant="primary" block disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          {/* ===== ERROR MESSAGE ===== */}
          {error && (
            <div style={{ marginTop: "16px" }}>
              <Banner tone="danger">{error}</Banner>
            </div>
          )}

          <div className="auth-links">
            <Link to="/login">← Back to login</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;