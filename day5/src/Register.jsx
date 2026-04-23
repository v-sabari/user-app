import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

function Register() {
  const [form, setForm] = useState({
    name: "",
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Registration failed");
        return;
      }

      setMessage(data.message || "User registered successfully");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Register</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Enter name"
            value={form.name}
            onChange={handleChange}
          />

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

          <button type="submit">Register</button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;