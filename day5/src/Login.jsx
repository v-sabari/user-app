import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // 🔥 IMPORTANT: shows INACTIVE / LOCKED messages
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("userEmail", form.email);
      localStorage.setItem("role", data.data.role);

      setMessage(data.message || "Login successful");
      navigate("/dashboard");
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
          />

          <button type="submit">Login</button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="auth-link">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p className="auth-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;