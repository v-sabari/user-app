import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

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
    <div style={styles.container}>
      <div style={styles.card}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div>
            <h2>Risk Assessment</h2>
            <p style={styles.subText}>Security risk analysis for all accounts</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button style={{ ...styles.btn, background: "#2563eb" }} onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button style={styles.btn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message && (
          <p style={{ ...styles.message, color: message.includes("✅") ? "#16a34a" : "#dc2626" }}>
            {message}
          </p>
        )}

        {/* ===== FILTERS & CONTROLS ===== */}
        <div style={styles.filterSection}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />

          <select
            value={riskLevelFilter}
            onChange={(e) => setRiskLevelFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Risk Levels</option>
            <option value="SECURE">✅ Secure</option>
            <option value="CAUTION">⚠️ Caution</option>
            <option value="AT_RISK">⚠️ At Risk</option>
            <option value="CRITICAL">🔴 Critical</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
            }}
            style={styles.select}
          >
            <option value="riskScore">Sort by Risk Score</option>
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="status">Sort by Status</option>
          </select>

          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            style={styles.select}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            style={{ ...styles.btn, background: "#16a34a" }}
            onClick={handleExportCsv}
            disabled={exporting || filteredAssessments.length === 0}
          >
            {exporting ? "Exporting..." : "⬇ Export CSV"}
          </button>

          <button
            style={{ ...styles.btn, background: "#111827" }}
            onClick={() => {
              setSearchTerm("");
              setRiskLevelFilter("");
              setSortBy("riskScore");
              setDirection("desc");
            }}
          >
            Reset Filters
          </button>
        </div>

        {/* ===== SUMMARY STATS ===== */}
        {!loading && assessments.length > 0 && (
          <div style={styles.summaryGrid}>
            <div style={{ ...styles.summaryCard, borderTopColor: "#16a34a" }}>
              <p style={styles.summaryLabel}>Secure</p>
              <p style={{ ...styles.summaryValue, color: "#16a34a" }}>
                {assessments.filter((a) => a.riskLevel === "SECURE").length}
              </p>
            </div>
            <div style={{ ...styles.summaryCard, borderTopColor: "#d97706" }}>
              <p style={styles.summaryLabel}>Caution</p>
              <p style={{ ...styles.summaryValue, color: "#d97706" }}>
                {assessments.filter((a) => a.riskLevel === "CAUTION").length}
              </p>
            </div>
            <div style={{ ...styles.summaryCard, borderTopColor: "#ea580c" }}>
              <p style={styles.summaryLabel}>At Risk</p>
              <p style={{ ...styles.summaryValue, color: "#ea580c" }}>
                {assessments.filter((a) => a.riskLevel === "AT_RISK").length}
              </p>
            </div>
            <div style={{ ...styles.summaryCard, borderTopColor: "#dc2626" }}>
              <p style={styles.summaryLabel}>Critical</p>
              <p style={{ ...styles.summaryValue, color: "#dc2626" }}>
                {assessments.filter((a) => a.riskLevel === "CRITICAL").length}
              </p>
            </div>
          </div>
        )}

        {/* ===== TABLE ===== */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>Loading risk assessment...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <p>
              {searchTerm || riskLevelFilter ? "No users match your filters." : "No users found."}
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Name</th>
                  <th style={styles.tableHeader}>Email</th>
                  <th style={styles.tableHeader}>Risk Score</th>
                  <th style={styles.tableHeader}>Risk Level</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Failed Logins</th>
                  <th style={styles.tableHeader}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => (
                  <tr
                    key={assessment.userId}
                    style={{
                      ...styles.tableRow,
                      borderLeftColor: assessment.riskColor,
                    }}
                    onClick={() => navigate(`/users`)}
                    title="Click to view in user management"
                  >
                    <td style={styles.tableCell}>
                      <span style={{ fontWeight: "600", color: "#111827" }}>
                        {assessment.name}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{ fontSize: "13px", color: "#6b7280", fontFamily: "monospace" }}>
                        {assessment.email}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
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
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          ...getRiskBadgeStyle(assessment.riskLevel),
                          padding: "4px 8px",
                          borderRadius: "6px",
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
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          color: assessment.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {assessment.status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span
                        style={{
                          color:
                            assessment.failedLoginsLast7Days > 3
                              ? "#dc2626"
                              : assessment.failedLoginsLast7Days > 0
                              ? "#d97706"
                              : "#16a34a",
                          fontWeight: "600",
                        }}
                      >
                        {assessment.failedLoginsLast7Days}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
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
          <div style={styles.footerInfo}>
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

/* ===== STYLES ===== */
const styles = {
  container: {
    maxWidth: "1400px",
    margin: "auto",
    padding: "30px",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  subText: {
    color: "#6b7280",
    margin: "4px 0 0",
    fontSize: "14px",
  },
  btn: {
    padding: "8px 14px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    color: "white",
    background: "#374151",
    fontSize: "13px",
    fontWeight: "600",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    background: "#f0fdf4",
    border: "1px solid #dcfce7",
  },
  filterSection: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    background: "white",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  summaryCard: {
    borderTop: "3px solid",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "14px",
    background: "#f9fafb",
    textAlign: "center",
  },
  summaryLabel: {
    margin: "0 0 6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "800",
    lineHeight: "1",
  },
  tableWrapper: {
    overflowX: "auto",
    marginBottom: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeaderRow: {
    background: "#f3f4f6",
    borderBottom: "2px solid #e5e7eb",
  },
  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "700",
    color: "#374151",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    borderLeft: "4px solid",
    borderBottom: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "background 0.2s",
    "&:hover": { background: "#f9fafb" },
  },
  tableCell: {
    padding: "12px 16px",
    color: "#374151",
  },
  footerInfo: {
    padding: "12px 0",
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
    borderTop: "1px solid #e5e7eb",
  },
};

export default RiskAssessment;