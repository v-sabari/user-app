import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

function MyActivity() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= LOGOUT =================
  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= FETCH ACTIVITY =================
  const fetchActivity = async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page,
        size,
      });

      const data = await apiRequest(
        `/profile/my-activity?${query}`,
        { method: "GET" }
      );

      setActivities(data.data.content || []);
      setTotalPages(data.data.totalPages || 0);
      setTotalElements(data.data.totalElements || 0);
    } catch (err) {
      if (err.message === "Session expired") {
        logoutUser();
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [page]);

  // ================= STATUS HELPERS =================
  const getStatusBadgeClass = (status) => {
    if (status === "SUCCESS" || status === "INFO") return "status-badge status-active";
    if (status === "WARNING") return "status-badge status-inactive";
    if (status === "FAILED") return "status-badge status-locked";
    return "status-badge";
  };

  // ================= ACTION COLOR =================
  const getActionColor = (action) => {
    if (action === "LOGIN") return "#2563eb";
    if (action === "LOGOUT" || action === "LOGOUT_ALL") return "#6b7280";
    if (action === "CHANGE_PASSWORD" || action === "ADMIN_RESET_PASSWORD") return "#7c3aed";
    if (action === "UPDATE_PROFILE") return "#0891b2";
    if (action === "REGISTER") return "#16a34a";
    if (action === "REFRESH_TOKEN") return "#9ca3af";
    if (action === "SESSION_LOGOUT") return "#d97706";
    if (action === "REFRESH_TOKEN_REUSE") return "#dc2626";
    return "#374151";
  };

  // ================= DATE FORMATTER =================
  const formatDateTime = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) {
      const [y, mo, d, h, min, s] = val;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(
        2,
        "0"
      )} ${String(h).padStart(2, "0")}:${String(min).padStart(
        2,
        "0"
      )}:${String(s || 0).padStart(2, "0")}`;
    }
    return new Date(val).toLocaleString();
  };

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>My Activity</h2>
            <p className="welcome-text">
              Your complete personal activity history —{" "}
              {totalElements} total {totalElements === 1 ? "entry" : "entries"}.
            </p>
          </div>

          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button type="button" onClick={() => navigate("/profile")}>
              My Profile
            </button>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && <p className="error-message">{error}</p>}

        {/* ===== LOADING ===== */}
        {loading ? (
          <p>Loading your activity...</p>
        ) : activities.length === 0 ? (
          <p>No activity found.</p>
        ) : (
          <>
            {/* ===== ACTIVITY LIST ===== */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {activities.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                  }}
                >
                  {/* ===== LEFT: Action + Status + Details ===== */}
                  <div style={{ flex: 1, minWidth: "200px" }}>

                    {/* Action + Status row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Action badge */}
                      <span
                        style={{
                          fontFamily: "monospace",
                          background: getActionColor(item.action) + "18",
                          color: getActionColor(item.action),
                          padding: "3px 12px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "700",
                          border: `1px solid ${getActionColor(item.action)}30`,
                        }}
                      >
                        {item.action}
                      </span>

                      {/* Status badge */}
                      <span className={getStatusBadgeClass(item.status)}>
                        {item.status}
                      </span>
                    </div>

                    {/* Details */}
                    {item.details && (
                      <p
                        style={{
                          margin: "0",
                          color: "#6b7280",
                          fontSize: "13px",
                          lineHeight: "1.5",
                        }}
                      >
                        {item.details}
                      </p>
                    )}
                  </div>

                  {/* ===== RIGHT: Timestamp ===== */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p
                      style={{
                        margin: "0",
                        color: "#9ca3af",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== PAGINATION ===== */}
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
          </>
        )}

      </div>
    </div>
  );
}

export default MyActivity;