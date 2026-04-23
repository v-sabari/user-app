import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(3);
  const [totalPages, setTotalPages] = useState(0);
  const [sortDirection, setSortDirection] = useState("asc");

  const [profile, setProfile] = useState(null);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getAuthHeaders = (includeContentType = false) => {
    const headers = {};

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleUnauthorized = () => {
    setMessage("Session expired. Please login again.");
    handleLogout();
  };

  const getStatusClass = (status) => {
    if (status === "ACTIVE") return "status-active";
    if (status === "INACTIVE") return "status-inactive";
    return "status-locked";
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to fetch profile");
        return;
      }

      setProfile(data.data);
      setProfileForm({
        name: data.data.name,
        email: data.data.email,
      });

      localStorage.setItem("userEmail", data.data.email);
      localStorage.setItem("role", data.data.role);
    } catch (error) {
      setMessage("Failed to load profile");
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users?search=${encodeURIComponent(
          searchTerm
        )}&page=${page}&size=${size}&sortBy=name&direction=${sortDirection}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to fetch users");
        return;
      }

      setUsers(data.data.content);
      setTotalPages(data.data.totalPages);
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUsers();
  }, [page, sortDirection, searchTerm]);

  const role = profile?.role || localStorage.getItem("role");
  const isAdmin = role === "ADMIN";

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

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Profile update failed");
        return;
      }

      setProfile(data.data);
      setProfileForm({
        name: data.data.name,
        email: data.data.email,
      });

      localStorage.setItem("userEmail", data.data.email);
      localStorage.setItem("role", data.data.role);

      setProfileEditMode(false);
      setMessage(data.message || "Profile updated successfully");
    } catch (error) {
      setMessage("Failed to update profile");
      console.error(error);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Password change failed");
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage(data.message || "Password changed successfully");
    } catch (error) {
      setMessage("Failed to change password");
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    if (!isAdmin) {
      setMessage("Only ADMIN can add or update users");
      return;
    }

    try {
      let url = `${API_BASE_URL}/users`;
      let method = "POST";

      if (editId !== null) {
        url = `${API_BASE_URL}/users/${editId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(true),
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        if (data.errors) {
          setErrors(data.errors);
          return;
        }
        setMessage(data.message || "Request failed");
        return;
      }

      setMessage(
        data.message ||
          (editId !== null
            ? "User updated successfully"
            : "User added successfully")
      );

      setForm({ name: "", email: "" });
      setEditId(null);
      fetchUsers();
    } catch (error) {
      setMessage("Failed to connect to backend");
      console.error(error);
    }
  };

  const handleEdit = (user) => {
    if (!isAdmin) {
      setMessage("Only ADMIN can edit users");
      return;
    }

    setForm({
      name: user.name,
      email: user.email,
    });
    setEditId(user.id);
    setErrors({});
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      setMessage("Only ADMIN can delete users");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Delete failed");
        return;
      }

      setMessage(data.message || "User deleted successfully");

      if (users.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchUsers();
      }
    } catch (error) {
      setMessage("Delete failed");
      console.error(error);
    }
  };

  const handleActivate = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/activate`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Activate failed");
        return;
      }

      setMessage(data.message || "User activated successfully");
      fetchUsers();
    } catch (error) {
      setMessage("Activate failed");
      console.error(error);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/deactivate`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Deactivate failed");
        return;
      }

      setMessage(data.message || "User deactivated successfully");
      fetchUsers();
    } catch (error) {
      setMessage("Deactivate failed");
      console.error(error);
    }
  };

  const handleLock = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/lock`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Lock failed");
        return;
      }

      setMessage(data.message || "User locked successfully");
      fetchUsers();
    } catch (error) {
      setMessage("Lock failed");
      console.error(error);
    }
  };

  const handleUnlock = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/unlock`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Unlock failed");
        return;
      }

      setMessage(data.message || "User unlocked successfully");
      fetchUsers();
    } catch (error) {
      setMessage("Unlock failed");
      console.error(error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Status"];
    const rows = users.map((user) => [user.name, user.email, user.status]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="top-bar">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="welcome-text">
              Manage your profile, security settings, and user accounts.
            </p>
          </div>

          <div className="inline-actions">
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/audit-logs")}
              >
                View Audit Logs
              </button>
            )}

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <div className="dashboard-section">
          <h3>My Profile</h3>

          {profile ? (
            <>
              {!profileEditMode ? (
                <div className="dashboard-meta">
                  <p><strong>Name:</strong> {profile.name}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <p><strong>Role:</strong> {profile.role}</p>

                  <button
                    type="button"
                    onClick={() => setProfileEditMode(true)}
                  >
                    Edit My Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate}>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />

                  <div className="inline-actions">
                    <button type="submit">Save Profile</button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileEditMode(false);
                        setProfileForm({
                          name: profile.name,
                          email: profile.email,
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Security Settings</h3>

          <form onSubmit={handleChangePassword}>
            <input
              type="password"
              name="currentPassword"
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
            />

            <input
              type="password"
              name="newPassword"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
            />

            <button type="submit">Change Password</button>
          </form>
        </div>

        <div className="dashboard-section">
          <h3>User Management</h3>

          {!isAdmin ? (
            <p className="message">
              You are in view-only mode. Only ADMIN can add, edit, delete,
              activate, deactivate, lock, or unlock users.
            </p>
          ) : (
            <>
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

              <div className="dashboard-toolbar">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />

                <select
                  value={sortDirection}
                  onChange={(e) => {
                    setSortDirection(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="asc">Name A-Z</option>
                  <option value="desc">Name Z-A</option>
                </select>

                <button type="button" onClick={downloadCSV}>
                  Download CSV
                </button>
              </div>
            </>
          )}

          <h3 style={{ marginTop: "20px" }}>Users List</h3>

          {users.length > 0 ? (
            <div className="user-list">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`status-badge ${getStatusClass(user.status)}`}>
                      {user.status}
                    </span>
                  </p>

                  {isAdmin && (
                    <div
                      className="user-actions"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "10px",
                        marginTop: "12px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActivate(user.id)}
                      >
                        Activate
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeactivate(user.id)}
                      >
                        Deactivate
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLock(user.id)}
                      >
                        Lock
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUnlock(user.id)}
                      >
                        Unlock
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No matching users found</p>
          )}

          <div className="pagination">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              Prev
            </button>

            <span>
              Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1 || totalPages === 0}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;