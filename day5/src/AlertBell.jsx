import { useEffect, useState } from "react";
import { apiRequest } from "./apiClient";

/**
 * ✅ Day 77 — Alert Bell Component
 * Displays notification bell in header with alert count
 */
function AlertBell({ onClick }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertCount();
    // Poll for alerts every 30 seconds
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlertCount = async () => {
    try {
      const data = await apiRequest("/security-alerts/count", { method: "GET" });
      setUnreadCount(data.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch alert count:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "18px",
        transition: "background 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => (e.target.style.background = "var(--surface-sunken)")}
      onMouseLeave={(e) => (e.target.style.background = "transparent")}
      title="View security alerts"
    >
      🔔
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            background: unreadCount > 5 ? "var(--danger)" : "var(--warning)",
            color: "white",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: "700",
            minWidth: "20px",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default AlertBell;