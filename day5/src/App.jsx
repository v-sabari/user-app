import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8080/users");
      const data = await response.json();
      setUsers(data);
    } catch {
      setMessage("Failed to connect to backend");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let url = "http://localhost:8080/users";
      let method = "POST";

      if (editIndex !== null) {
        url = `http://localhost:8080/users/${editIndex}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.text();
      setMessage(result);

      setForm({ name: "", email: "" });
      setEditIndex(null);

      fetchUsers();
    } catch {
      setMessage("Failed to connect to backend");
    }
  };

  const handleEdit = (user, index) => {
    setForm({
      name: user.name,
      email: user.email,
    });
    setEditIndex(index);
    setMessage("");
  };

  const handleDelete = async (index) => {
    try {
      const response = await fetch(
        `http://localhost:8080/users/${index}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.text();
      setMessage(result);

      fetchUsers();
    } catch {
      setMessage("Delete failed");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>User Management</h2>

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

          <button type="submit">
            {editIndex !== null ? "Update User" : "Add User"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <h3>Users List</h3>

        {users.map((user, index) => (
          <div key={index} className="user-card">
            <p>{user.name}</p>
            <p>{user.email}</p>

            <button onClick={() => handleEdit(user, index)}>
              Edit
            </button>

            <button
              className="delete-btn"
              onClick={() => handleDelete(index)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;