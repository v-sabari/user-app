import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function AuditLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    action: "",
    status: "",
    actorEmail: "",
    targetEmail: "",
    fromDate: "",
    toDate: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("desc");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const buildQuery = () => {
    const query = new URLSearchParams({
      action: appliedFilters.action,
      status: appliedFilters.status,
      actorEmail: appliedFilters.actorEmail,
      targetEmail: appliedFilters.targetEmail,
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });

    if (appliedFilters.fromDate) {
      query.append("fromDate", `${appliedFilters.fromDate}T00:00:00`);
    }

    if (appliedFilters.toDate) {
      query.append("toDate", `${appliedFilters.toDate}T23:59:59`);
    }

    return query.toString();
  };

  // ✅ Day 52 — Build export query (same filters, no pagination)
  const buildExportQuery = () => {
    const query = new URLSearchParams({
      action: appliedFilters.action,
      status: appliedFilters.status,
      actorEmail: appliedFilters.actorEmail,
      targetEmail: appliedFilters.targetEmail,
    });

    if (appliedFilters.fromDate) {
      query.append("fromDate", `${appliedFilters.fromDate}T00:00:00`);
    }

    if (appliedFilters.toDate) {
      query.append("toDate", `${appliedFilters.toDate}T23:59:59`);
    }

    return query.toString();
  };

  const fetchLogs = async () => {
    try {
      const data = await apiRequest(`/audit-logs?${buildQuery()}`, {
        method: "GET",
      });

      setLogs(data.data.content);
      setTotalPages(data.data.totalPages);
      setTotalElements(data.data.totalElements || 0);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to fetch audit logs");

      if (error.message === "Session expired") {
        navigate("/login");
      }
    }
  };

  // ✅ Day 52 — Export CSV with active filters
  const handleExportCsv = async () => {
    setExporting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8080/audit-logs/export?${buildExportQuery()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Export failed");
      }

      // ✅ Get filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition");
      let filename = "audit-logs.csv";
      if (disposition && disposition.includes("filename=")) {
        filename = disposition
          .split("filename=")[1]
          .replace(/"/g, "")
          .trim();
      }

      // ✅ Trigger browser download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`Exported successfully as ${filename}`);
    } catch (err) {
      setMessage(err.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }

    fetchLogs();
  }, [page, sortBy, direction, appliedFilters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      action: "",
      status: "",
      actorEmail: "",
      targetEmail: "",
      fromDate: "",
      toDate: "",
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
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

          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
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

          <div className="inline-actions">
            <button type="submit">Apply Filters</button>
            <button type="button" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </form>

        <div className="dashboard-toolbar">
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
        </div>

        {/* ===== DAY 52 — EXPORT CSV BUTTON ===== */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "16px 0 8px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h3 style={{ margin: 0 }}>
            Audit Log List
            <span
              style={{
                marginLeft: "10px",
                fontSize: "14px",
                color: "#6b7280",
                fontWeight: "400",
              }}
            >
              ({totalElements} total)
            </span>
          </h3>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting || totalElements === 0}
            style={{
              width: "auto",
              minWidth: "160px",
              marginTop: 0,
              background: exporting
                ? "#9ca3af"
                : totalElements === 0
                ? "#d1d5db"
                : "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {exporting ? "Exporting..." : "⬇ Export CSV"}
          </button>
        </div>

        {logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="user-card">
              <p>
                <strong>Action:</strong> {log.action}
              </p>
              <p>
                <strong>Actor:</strong> {log.actorEmail}
              </p>
              <p>
                <strong>Role:</strong> {log.actorRole}
              </p>
              <p>
                <strong>Target:</strong> {log.targetEmail}
              </p>
              <p>
                <strong>Status:</strong> {log.status}
              </p>
              <p>
                <strong>Details:</strong> {log.details}
              </p>
              <p>
                <strong>Time:</strong> {log.createdAt}
              </p>
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