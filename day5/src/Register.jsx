import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicRequest } from "./apiClient";
import { Button, Banner, AuthMark, PasswordStrengthMeter, MatchHint } from "./ui";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= INPUT CHANGE =================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // ✅ Client-side validation
    if (form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await publicRequest("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      setMessage("Account created successfully! Redirecting to login...");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });

      setTimeout(() => navigate("/login"), 1500);

    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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

          <h2>Create your account</h2>
          <p className="auth-subtitle">Join and get started in seconds</p>

          <form onSubmit={handleSubmit}>

            {/* ===== NAME ===== */}
            <div className="auth-field">
              <label htmlFor="reg-name">Full name</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={50}
                autoComplete="name"
              />
            </div>

            {/* ===== EMAIL ===== */}
            <div className="auth-field">
              <label htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            {/* ===== PASSWORD ===== */}
            <div className="auth-field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <PasswordStrengthMeter password={form.password} />

            {/* ===== CONFIRM PASSWORD ===== */}
            <div className="auth-field">
              <label htmlFor="reg-confirm">Confirm password</label>
              <input
                id="reg-confirm"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {form.confirmPassword.length > 0 && (
              <MatchHint matches={form.password === form.confirmPassword} />
            )}

            {/* ===== REGISTER BUTTON ===== */}
            <Button type="submit" variant="primary" block disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>

          </form>

          {/* ===== SUCCESS MESSAGE ===== */}
          {message && (
            <div style={{ marginTop: "16px" }}>
              <Banner tone="success">{message}</Banner>
            </div>
          )}

          {/* ===== ERROR MESSAGE ===== */}
          {error && (
            <div style={{ marginTop: "16px" }}>
              <Banner tone="danger">{error}</Banner>
            </div>
          )}

          <div className="auth-links">
            <span>
              Already have an account? <Link to="/login">Log in</Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;