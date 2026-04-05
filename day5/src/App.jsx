import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
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

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    try {
      let url = `${API_BASE_URL}/users`;
      let method = "POST";

      if (editId !== null) {
        url = `${API_BASE_URL}/users/${editId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          setErrors(errorData);
          return;
        }
        throw new Error("Request failed");
      }

      await response.json();
      setMessage(editId !== null ? "User updated successfully" : "User added successfully");

      setForm({ name: "", email: "" });
      setEditId(null);

      fetchUsers();
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  const handleEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
    });
    setEditId(user.id);
    setErrors({});
    setMessage("");
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setMessage("User deleted successfully");
      fetchUsers();
    } catch (error) {
      setMessage("Delete failed");
      console.error(error);
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
          {errors.name && <p className="error-message">{errors.name}</p>}

          <input
            type="email"
            name="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <p className="error-message">{errors.email}</p>}

          <button type="submit">
            {editId !== null ? "Update User" : "Add User"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <h3>Users List</h3>

        {users.map((user) => (
          <div key={user.id} className="user-card">
            <p>{user.name}</p>
            <p>{user.email}</p>

            <button type="button" onClick={() => handleEdit(user)}>
              Edit
            </button>

            <button
              type="button"
              className="delete-btn"
              onClick={() => handleDelete(user.id)}
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