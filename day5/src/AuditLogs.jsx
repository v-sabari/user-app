import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  const [filters, setFilters] = useState({
    action: "",
    status: "",
    actorEmail: "",
    targetEmail: "",
    fromDate: "",
    toDate: "",
  });

  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("desc");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const getAuthHeaders = () => {
    const headers = {};
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

  const buildQuery = () => {
    const query = new URLSearchParams({
      action: filters.action,
      status: filters.status,
      actorEmail: filters.actorEmail,
      targetEmail: filters.targetEmail,
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });

    if (filters.fromDate) {
      query.append("fromDate", `${filters.fromDate}T00:00:00`);
    }

    if (filters.toDate) {
      query.append("toDate", `${filters.toDate}T23:59:59`);
    }

    return query.toString();
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audit-logs?${buildQuery()}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setMessage("Unauthorized access");
        return;
      }

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to fetch audit logs");
        return;
      }

      setLogs(data.data.content);
      setTotalPages(data.data.totalPages);
      setMessage("");
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

    if (role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }

    fetchLogs();
  }, [page, sortBy, direction]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      status: "",
      actorEmail: "",
      targetEmail: "",
      fromDate: "",
      toDate: "",
    });
    setSortBy("createdAt");
    setDirection("desc");
    setPage(0);
  };

  return (
    <div className="container">
      <div className="card">
        <div className="top-bar">
          <div>
            <h2>Audit Logs</h2>
            <p className="welcome-text">Advanced Admin Activity History</p>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {message && <p className="message">{message}</p>}

        <form onSubmit={handleApplyFilters}>
          <input
            type="text"
            name="action"
            placeholder="Filter by action"
            value={filters.action}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="status"
            placeholder="Filter by status"
            value={filters.status}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="actorEmail"
            placeholder="Filter by actor email"
            value={filters.actorEmail}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="targetEmail"
            placeholder="Filter by target email"
            value={filters.targetEmail}
            onChange={handleFilterChange}
          />

          <input
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleFilterChange}
          />

          <input
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleFilterChange}
          />

          <button type="submit">Apply Filters</button>
          <button type="button" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </form>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(0);
          }}
        >
          <option value="createdAt">Sort by Time</option>
          <option value="action">Sort by Action</option>
          <option value="status">Sort by Status</option>
          <option value="actorEmail">Sort by Actor Email</option>
          <option value="targetEmail">Sort by Target Email</option>
        </select>

        <select
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value);
            setPage(0);
          }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <h3>Audit Log List</h3>

        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="user-card">
              <p><strong>Action:</strong> {log.action}</p>
              <p><strong>Actor:</strong> {log.actorEmail}</p>
              <p><strong>Role:</strong> {log.actorRole}</p>
              <p><strong>Target:</strong> {log.targetEmail}</p>
              <p><strong>Status:</strong> {log.status}</p>
              <p><strong>Details:</strong> {log.details}</p>
              <p><strong>Time:</strong> {log.createdAt}</p>
            </div>
          ))
        ) : (
          <p>No audit logs found</p>
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
  );
}

export default AuditLogs;