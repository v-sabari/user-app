import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const strength = getPasswordStrength(form.password);

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
    <div className="auth-page">
      <div className="card auth-card">

        <h2>Create Account</h2>

        <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "14px" }}>
          Join and get started in seconds
        </p>

        <form onSubmit={handleSubmit}>

          {/* ===== NAME ===== */}
          <input
            type="text"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={50}
            autoComplete="name"
          />

          {/* ===== EMAIL ===== */}
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          {/* ===== PASSWORD ===== */}
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {/* ===== DAY 60 — PASSWORD STRENGTH INDICATOR ===== */}
          {form.password.length > 0 && (
            <div style={{ marginTop: "-8px", marginBottom: "12px" }}>

              {/* Strength bar */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  marginBottom: "5px",
                }}
              >
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: "4px",
                      borderRadius: "999px",
                      background:
                        strength.score >= level
                          ? strength.color
                          : "#e5e7eb",
                      transition: "background 0.3s ease",
                    }}
                  />
                ))}
              </div>

              {/* Strength label */}
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  fontWeight: "600",
                  color: strength.color,
                }}
              >
                {strength.label} password
              </p>
            </div>
          )}

          {/* ===== CONFIRM PASSWORD ===== */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {/* ✅ Confirm match indicator */}
          {form.confirmPassword.length > 0 && (
            <p
              style={{
                margin: "-8px 0 12px",
                fontSize: "12px",
                fontWeight: "600",
                color:
                  form.password === form.confirmPassword
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {form.password === form.confirmPassword
                ? "✅ Passwords match"
                : "❌ Passwords do not match"}
            </p>
          )}

          {/* ===== REGISTER BUTTON ===== */}
          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* ===== SUCCESS MESSAGE ===== */}
        {message && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              background: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {message}
          </div>
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
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Register;