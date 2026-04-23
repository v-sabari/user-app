import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

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
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json();

      setMessage(data.message || "Reset processed");

      if (response.ok && data.success) {
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Reset Password</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="newPassword"
            placeholder="Enter new password"
            value={form.newPassword}
            onChange={handleChange}
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <button type="submit">Reset Password</button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="auth-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;