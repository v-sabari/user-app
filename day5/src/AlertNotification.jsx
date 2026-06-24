import { useEffect, useState } from "react";
import { apiRequest } from "./apiClient";

/**
 * ✅ Day 77 — Alert Notification Component
 * Displays individual security alert
 */
function AlertNotification({ alert, onDismiss, onRead }) {
  const [isRead, setIsRead] = useState(false);

  const handleDismiss = async () => {
    try {
      await apiRequest("/security-alerts/dismiss", {
        method: "POST",
        body: JSON.stringify({ alertId: alert.id }),
      });
      setIsRead(true);
      if (onDismiss) onDismiss(alert.id);
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  const handleRead = async () => {
    try {
      await apiRequest("/security-alerts/read", {
        method: "POST",
        body: JSON.stringify({ alertId: alert.id }),
      });
      setIsRead(true);
      if (onRead) onRead(alert.id);
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const severityStyles = {
    CRITICAL: {
      background: "#fee2e2",
      border: "1px solid #fca5a5",
      color: "#dc2626",
      icon: "🔴",
    },
    HIGH: {
      background: "#ffedd5",
      border: "1px solid #fed7aa",
      color: "#ea580c",
      icon: "⚠️",
    },
    MEDIUM: {
      background: "#fef3c7",
      border: "1px solid #fde68a",
      color: "#d97706",
      icon: "⏰",
    },
  };

  const style = severityStyles[alert.severity] || severityStyles.MEDIUM;

  return (
    <div
      style={{
        background: style.background,
        border: style.border,
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "10px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", gap: "12px", flex: 1 }}>
        <span style={{ fontSize: "18px", minWidth: "20px" }}>{style.icon}</span>
        <div>
          <p
            style={{
              margin: "0 0 4px",
              fontWeight: "700",
              color: style.color,
              fontSize: "14px",
            }}
          >
            {alert.type.replace(/_/g, " ")}
          </p>
          <p
            style={{
              margin: "0 0 8px",
              color: "#374151",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            {alert.message}
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleRead}
              style={{
                background: "transparent",
                border: `1px solid ${style.color}`,
                color: style.color,
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Mark as read
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: "transparent",
                border: "1px solid #d1d5db",
                color: "#6b7280",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "#9ca3af",
          fontSize: "18px",
          cursor: "pointer",
          padding: "0",
          minWidth: "24px",
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default AlertNotification;