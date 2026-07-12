import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button } from "./ui";

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
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("desc");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= BUILD QUERIES =================
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
    if (appliedFilters.fromDate) query.append("fromDate", `${appliedFilters.fromDate}T00:00:00`);
    if (appliedFilters.toDate) query.append("toDate", `${appliedFilters.toDate}T23:59:59`);
    return query.toString();
  };

  const buildExportQuery = () => {
    const query = new URLSearchParams({
      action: appliedFilters.action,
      status: appliedFilters.status,
      actorEmail: appliedFilters.actorEmail,
      targetEmail: appliedFilters.targetEmail,
    });
    if (appliedFilters.fromDate) query.append("fromDate", `${appliedFilters.fromDate}T00:00:00`);
    if (appliedFilters.toDate) query.append("toDate", `${appliedFilters.toDate}T23:59:59`);
    return query.toString();
  };

  // ================= FETCH LOGS =================
  const fetchLogs = async () => {
    try {
      const data = await apiRequest(`/audit-logs?${buildQuery()}`, { method: "GET" });
      setLogs(data.data.content);
      setTotalPages(data.data.totalPages);
      setTotalElements(data.data.totalElements || 0);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to fetch audit logs");
      if (error.message === "Session expired") navigate("/login");
    }
  };

  // ================= EXPORT CSV =================
  const handleExportCsv = async () => {
    setExporting(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/audit-logs/export?${buildExportQuery()}`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Export failed");
      const disposition = res.headers.get("Content-Disposition");
      let filename = "audit-logs.csv";
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "").trim();
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
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
    if (role !== "ADMIN") { navigate("/dashboard"); return; }
    fetchLogs();
  }, [page, sortBy, direction, appliedFilters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = { action: "", status: "", actorEmail: "", targetEmail: "", fromDate: "", toDate: "" };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSortBy("createdAt");
    setDirection("desc");
    setPage(0);
  };

  // ✅ Day 71 — Action color coding
  const getActionColor = (action) => {
    if (!action) return "#374151";
    const a = action.toUpperCase();
    if (a.includes("LOGIN")) return "#2563eb";
    if (a.includes("LOGOUT")) return "#6b7280";
    if (a.includes("REGISTER")) return "#16a34a";
    if (a.includes("PASSWORD") || a.includes("RESET")) return "#7c3aed";
    if (a.includes("LOCK")) return "#7c3aed";
    if (a.includes("DELETE") || a.includes("TERMINATE")) return "#dc2626";
    if (a.includes("DEACTIVATE")) return "#d97706";
    if (a.includes("ACTIVATE") || a.includes("UNLOCK")) return "#16a34a";
    if (a.includes("UPDATE") || a.includes("PROFILE") || a.includes("EMAIL")) return "#0891b2";
    if (a.includes("EXPORT")) return "#059669";
    if (a.includes("REFRESH")) return "#9ca3af";
    if (a.includes("BULK")) return "#be185d";
    return "#374151";
  };

  // ✅ Day 71 — Status badge style
  const getStatusStyle = (status) => {
    if (status === "SUCCESS") return { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" };
    if (status === "FAILED") return { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" };
    if (status === "WARNING") return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    if (status === "INFO") return { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd" };
    return { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" };
  };

  // ✅ Day 71 — Format date cleanly
  const formatDateTime = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) {
      const [y, mo, d, h, min, s] = val;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s || 0).padStart(2, "0")}`;
    }
    try {
      return new Date(val).toLocaleString();
    } catch {
      return String(val);
    }
  };

  const filtersActive = Object.values(appliedFilters).some((v) => v !== "");

  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Audit logs</h2>
            <p className="welcome-text">Advanced admin activity history</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        {/* ===== FILTER FORM ===== */}
        <form onSubmit={handleApplyFilters}>
          <input type="text" name="action" placeholder="Filter by action" value={filters.action} onChange={handleFilterChange} />
          <input type="text" name="status" placeholder="Filter by status" value={filters.status} onChange={handleFilterChange} />
          <input type="text" name="actorEmail" placeholder="Filter by actor email" value={filters.actorEmail} onChange={handleFilterChange} />
          <input type="text" name="targetEmail" placeholder="Filter by target email" value={filters.targetEmail} onChange={handleFilterChange} />
          <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
          <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
          <div className="inline-actions">
            <Button type="submit" variant="primary">Apply filters</Button>
            <Button type="button" variant="secondary" onClick={handleClearFilters}>Clear filters</Button>
          </div>
        </form>

        {/* ===== SORT TOOLBAR ===== */}
        <div className="dashboard-toolbar">
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }}>
            <option value="createdAt">Sort by time</option>
            <option value="action">Sort by action</option>
            <option value="status">Sort by status</option>
            <option value="actorEmail">Sort by actor email</option>
            <option value="targetEmail">Sort by target email</option>
          </select>
          <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(0); }}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* ===== HEADER ROW: count + export ===== */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 12px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0 }}>
            Audit log list
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "var(--muted)", fontWeight: "400" }}>
              ({totalElements} {filtersActive ? "filtered" : "total"})
            </span>
          </h3>
          <Button type="button" variant="secondary" style={{ background: exporting ? "var(--faint)" : totalElements === 0 ? "var(--line-strong)" : "var(--success)", color: "#fff" }}
            onClick={handleExportCsv} disabled={exporting || totalElements === 0}>
            {exporting ? "Exporting…" : "⬇ Export CSV"}
          </Button>
        </div>

        {/* ===== ✅ Day 71 — STYLED LOG ENTRIES ===== */}
        {logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--faint)" }}>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>No audit logs found.</p>
            {filtersActive && <p style={{ fontSize: "13px", margin: 0 }}>Try clearing your filters.</p>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {logs.map((log) => {
              const actionColor = getActionColor(log.action);
              const statusStyle = getStatusStyle(log.status);

              return (
                <div key={log.id} style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderLeft: `4px solid ${actionColor}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                  boxShadow: "var(--shadow-xs)",
                }}>
                  {/* ===== TOP ROW: Action badge + Status badge + Timestamp ===== */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap", justifyContent: "space-between" }}>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {/* Action badge */}
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        background: actionColor + "18",
                        color: actionColor,
                        padding: "3px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        border: `1px solid ${actionColor}30`,
                        whiteSpace: "nowrap",
                      }}>
                        {log.action || "UNKNOWN"}
                      </span>

                      {/* Status badge */}
                      <span style={{
                        ...statusStyle,
                        padding: "3px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        whiteSpace: "nowrap",
                      }}>
                        {log.status || "—"}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <span style={{ fontSize: "11px", color: "var(--faint)", fontWeight: "500", whiteSpace: "nowrap" }}>
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>

                  {/* ===== MIDDLE ROW: Actor → Target ===== */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: "var(--ink-soft)", fontWeight: "600" }}>
                      {log.actorEmail || "—"}
                    </span>

                    {/* Role badge */}
                    {log.actorRole && (
                      <span style={{ fontSize: "11px", background: log.actorRole === "ADMIN" ? "#f5f3ff" : "var(--surface-sunken)", color: log.actorRole === "ADMIN" ? "#7c3aed" : "var(--ink-soft)", padding: "1px 8px", borderRadius: "999px", border: "1px solid " + (log.actorRole === "ADMIN" ? "#ddd6fe" : "var(--line)"), fontWeight: "600" }}>
                        {log.actorRole}
                      </span>
                    )}

                    {/* Arrow */}
                    {log.targetEmail && log.targetEmail !== log.actorEmail && (
                      <>
                        <span style={{ color: "var(--line-strong)", fontSize: "13px" }}>→</span>
                        <span style={{ fontSize: "13px", color: "var(--muted)" }}>{log.targetEmail}</span>
                      </>
                    )}
                  </div>

                  {/* ===== DETAILS ===== */}
                  {log.details && (
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: "1.5", borderTop: "1px solid var(--surface-sunken)", paddingTop: "6px" }}>
                      {log.details}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ===== PAGINATION ===== */}
        <div className="pagination">
          <Button variant="secondary" onClick={() => setPage(page - 1)} disabled={page === 0}>Prev</Button>
          <span>Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
          <Button variant="secondary" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1 || totalPages === 0}>Next</Button>
        </div>

      </div>
    </div>
  );
}

export default AuditLogs;