import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, StatCard } from "./ui";

/**
 * ✅ Day 76 — Risk Assessment Component (Admin)
 * Admin view of all users' security risk scores
 */
function RiskAssessment() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [riskLevelFilter, setRiskLevelFilter] = useState(""); // "SECURE", "CAUTION", "AT_RISK", "CRITICAL"
  const [sortBy, setSortBy] = useState("riskScore");
  const [direction, setDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const fetchRiskAssessment = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/security-audit/admin", { method: "GET" });
      setAssessments(data.data || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Failed to load risk assessment");
      if (error.message === "Session expired") {
        logoutUser();
        navigate("/login");
      } else if (error.message === "Access denied") {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      navigate("/dashboard");
      return;
    }
    fetchRiskAssessment();
  }, []);

  // ================= APPLY FILTERS & SORTING =================
  useEffect(() => {
    let filtered = [...assessments];

    // Filter by risk level
    if (riskLevelFilter) {
      filtered = filtered.filter((a) => a.riskLevel === riskLevelFilter);
    }

    // Filter by search term (email or name)
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.email.toLowerCase().includes(lower) ||
          a.name.toLowerCase().includes(lower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === "riskScore") {
        aVal = a.riskScore;
        bVal = b.riskScore;
      } else if (sortBy === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === "email") {
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
      } else if (sortBy === "status") {
        aVal = a.status;
        bVal = b.status;
      }

      if (direction === "desc") {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    setFilteredAssessments(filtered);
  }, [assessments, riskLevelFilter, searchTerm, sortBy, direction]);

  // ================= EXPORT CSV =================
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/security-audit/export", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");

      const disposition = res.headers.get("Content-Disposition");
      let filename = "security-risk-report.csv";
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "").trim();
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`✅ Exported successfully as ${filename}`);
    } catch (err) {
      setMessage(`❌ Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const getRiskBadgeStyle = (riskLevel) => {
    switch (riskLevel) {
      case "SECURE":
        return { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" };
      case "CAUTION":
        return { background: "#fed7aa", color: "#92400e", border: "1px solid #fdba74" };
      case "AT_RISK":
        return { background: "#ffdddd", color: "#991b1b", border: "1px solid #fecaca" };
      case "CRITICAL":
        return { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" };
      default:
        return { background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" };
    }
  };

  const getStatusColor = (status) => {
    if (status === "ACTIVE") return "#16a34a";
    if (status === "INACTIVE") return "#d97706";
    if (status === "LOCKED") return "#dc2626";
    return "#6b7280";
  };

  const formatLastLogin = (dateStr) => {
    if (!dateStr) return "Never";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      return `${days}d ago`;
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>Risk assessment</h2>
            <p className="welcome-text">Security risk analysis for all accounts</p>
          </div>
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {message && (
          <p className="message" style={{ color: message.includes("✅") ? "var(--success)" : "var(--danger)" }}>
            {message}
          </p>
        )}

        {/* ===== FILTERS & CONTROLS ===== */}
        <div className="dashboard-toolbar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select value={riskLevelFilter} onChange={(e) => setRiskLevelFilter(e.target.value)}>
            <option value="">All risk levels</option>
            <option value="SECURE">✅ Secure</option>
            <option value="CAUTION">⚠️ Caution</option>
            <option value="AT_RISK">⚠️ At risk</option>
            <option value="CRITICAL">🔴 Critical</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="riskScore">Sort by risk score</option>
            <option value="name">Sort by name</option>
            <option value="email">Sort by email</option>
            <option value="status">Sort by status</option>
          </select>

          <select value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <Button variant="secondary" style={{ background: "var(--success)", color: "#fff" }}
            onClick={handleExportCsv} disabled={exporting || filteredAssessments.length === 0}>
            {exporting ? "Exporting…" : "⬇ Export CSV"}
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm("");
              setRiskLevelFilter("");
              setSortBy("riskScore");
              setDirection("desc");
            }}
          >
            Reset filters
          </Button>
        </div>

        {/* ===== SUMMARY STATS ===== */}
        {!loading && assessments.length > 0 && (
          <div className="stat-grid" style={{ marginBottom: "20px" }}>
            <StatCard label="Secure" value={assessments.filter((a) => a.riskLevel === "SECURE").length} accent="var(--success)" valueColor="var(--success)" />
            <StatCard label="Caution" value={assessments.filter((a) => a.riskLevel === "CAUTION").length} accent="var(--warning)" valueColor="var(--warning)" />
            <StatCard label="At risk" value={assessments.filter((a) => a.riskLevel === "AT_RISK").length} accent="#ea580c" valueColor="#ea580c" />
            <StatCard label="Critical" value={assessments.filter((a) => a.riskLevel === "CRITICAL").length} accent="var(--danger)" valueColor="var(--danger)" />
          </div>
        )}

        {/* ===== TABLE ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>Loading risk assessment...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--faint)" }}>
            <p>
              {searchTerm || riskLevelFilter ? "No users match your filters." : "No users found."}
            </p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Risk score</th>
                  <th>Risk level</th>
                  <th>Status</th>
                  <th>Failed logins</th>
                  <th>Last login</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr
                    key={assessment.userId}
                    style={{ borderLeftColor: assessment.riskColor }}
                    onClick={() => navigate(`/users`)}
                    title="Click to view in user management"
                  >
                    <td>
                      <span style={{ fontWeight: "600", color: "var(--ink)" }}>
                        {assessment.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                        {assessment.email}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "700",
                          color: assessment.riskColor,
                          fontSize: "18px",
                        }}
                      >
                        {assessment.riskScore}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          ...getRiskBadgeStyle(assessment.riskLevel),
                          padding: "4px 8px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "11px",
                          fontWeight: "700",
                          display: "inline-block",
                        }}
                      >
                        {assessment.riskLevel === "SECURE"
                          ? "✅ Secure"
                          : assessment.riskLevel === "CAUTION"
                          ? "⚠️ Caution"
                          : assessment.riskLevel === "AT_RISK"
                          ? "⚠️ At Risk"
                          : "🔴 Critical"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: assessment.status === "ACTIVE" ? "var(--success)" : "var(--danger)",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {assessment.status}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            assessment.failedLoginsLast7Days > 3
                              ? "var(--danger)"
                              : assessment.failedLoginsLast7Days > 0
                              ? "var(--warning)"
                              : "var(--success)",
                          fontWeight: "600",
                        }}
                      >
                        {assessment.failedLoginsLast7Days}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        {formatLastLogin(assessment.lastLogin)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== FOOTER INFO ===== */}
        {!loading && filteredAssessments.length > 0 && (
          <div style={{ padding: "12px 0", fontSize: "13px", color: "var(--muted)", textAlign: "center", borderTop: "1px solid var(--line)" }}>
            <p>
              Showing <strong>{filteredAssessments.length}</strong> of{" "}
              <strong>{assessments.length}</strong> users
              {riskLevelFilter && ` (filtered by ${riskLevelFilter})`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskAssessment;