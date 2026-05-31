import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { publicRequest } from "./apiClient";

function Login() {

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

      // ================= STORE TOKENS =================
      localStorage.setItem(
        "token",
        data.data.accessToken
      );

      localStorage.setItem(
        "refreshToken",
        data.data.refreshToken
      );

      localStorage.setItem(
        "userEmail",
        form.email.trim().toLowerCase()
      );

      localStorage.setItem(
        "role",
        data.data.role
      );

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

      const errorMessage =
        err?.message || "";

      // ================= ACCOUNT LOCKED =================
      if (
        errorMessage.toLowerCase().includes("locked")
      ) {

        setMessage(
          "Your account has been locked due to multiple failed login attempts. Please contact support."
        );

      }

      // ================= ACCOUNT INACTIVE =================
      else if (
        errorMessage.toLowerCase().includes("inactive")
      ) {

        setMessage(
          "Your account is currently inactive. Please contact an administrator."
        );

      }

      // ================= INVALID LOGIN =================
      else {

        setMessage(
          errorMessage || "Invalid email or password"
        );
      }

    } finally {

      setLoading(false);
    }
  };

  // ================= UI =================
  return (

    <div className="auth-page">

      <div className="card auth-card">

        <h2>Login</h2>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          Access your account securely
        </p>

        <form onSubmit={handleSubmit}>

          {/* ===== EMAIL ===== */}
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            required
          />

          {/* ===== PASSWORD ===== */}
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {/* ===== LOGIN BUTTON ===== */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        {/* ===== MESSAGE ===== */}
        {message && (

          <div
            className="message"
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              background:
                message.toLowerCase().includes("locked")
                  ? "#fee2e2"
                  : "#fef3c7",
              color:
                message.toLowerCase().includes("locked")
                  ? "#b91c1c"
                  : "#92400e",
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

        {/* ===== FORGOT PASSWORD ===== */}
        <p className="auth-link">

          <Link to="/forgot-password">
            Forgot Password?
          </Link>

        </p>

        {/* ===== REGISTER ===== */}
        <p className="auth-link">

          Don&apos;t have an account?{" "}

          <Link to="/register">
            Register
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;