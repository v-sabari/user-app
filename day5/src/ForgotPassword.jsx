import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message || "Request processed");
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit">Send Reset Link</button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="auth-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;