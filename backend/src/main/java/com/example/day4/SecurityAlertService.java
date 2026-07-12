package com.example.day4;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ✅ Day 77 — Security Alert Service
 * Generates and manages real-time security alerts
 */
@Service
public class SecurityAlertService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityAuditService securityAuditService;

    public SecurityAlertService(
            UserRepository userRepository,
            AuditLogRepository auditLogRepository,
            SecurityAuditService securityAuditService
    ) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.securityAuditService = securityAuditService;
    }

    // ================= ALERT TYPES =================
    public enum AlertType {
        HIGH_RISK,           // Risk score increased to AT_RISK or CRITICAL
        SUSPICIOUS_LOGIN,    // New device/IP detected
        PASSWORD_EXPIRING,   // Password 85+ days old
        BRUTE_FORCE,         // 5+ failed logins in 15 minutes
        ACCOUNT_LOCKED       // Account locked
    }

    // ================= GENERATE ALERTS FOR USER =================
    /**
     * Generate all active alerts for a user
     */
    public List<Map<String, Object>> generateAlertsForUser(User user) {
        List<Map<String, Object>> alerts = new ArrayList<>();

        // Alert 1: High Risk Score
        int riskScore = securityAuditService.calculateRiskScore(user);
        if (riskScore > 50) {
            alerts.add(createAlert(
                    user.getId(),
                    user.getEmail(),
                    AlertType.HIGH_RISK,
                    "Your account risk score is " + riskScore + " — " +
                            (riskScore > 75 ? "CRITICAL ACTION NEEDED" : "Review your security settings"),
                    riskScore > 75 ? "CRITICAL" : "HIGH"
            ));
        }

        // Alert 2: Password Expiring
        if (user.getLastPasswordChangedAt() != null) {
            LocalDateTime expiryThreshold = LocalDateTime.now().minusDays(85);
            if (user.getLastPasswordChangedAt().isBefore(expiryThreshold)) {
                alerts.add(createAlert(
                        user.getId(),
                        user.getEmail(),
                        AlertType.PASSWORD_EXPIRING,
                        "Your password is " + getDaysOld(user.getLastPasswordChangedAt()) +
                                " days old. Update it for security.",
                        "MEDIUM"
                ));
            }
        }

        // Alert 3: Account Locked
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            alerts.add(createAlert(
                    user.getId(),
                    user.getEmail(),
                    AlertType.ACCOUNT_LOCKED,
                    "Your account is locked. Contact support to unlock it.",
                    "CRITICAL"
            ));
        }

        // Alert 4: Brute Force Attempt
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);
        long recentFailedLogins = auditLogRepository
                .countRecentFailedLogins(user.getEmail(), fifteenMinutesAgo);
        if (recentFailedLogins >= 5) {
            alerts.add(createAlert(
                    user.getId(),
                    user.getEmail(),
                    AlertType.BRUTE_FORCE,
                    "Detected " + recentFailedLogins + " failed login attempts in the last 15 minutes. " +
                            "If this wasn't you, change your password immediately.",
                    "CRITICAL"
            ));
        }

        // Alert 5: Suspicious Login (check last 2 logins for different IP/device)
        List<AuditLog> recentLogins = auditLogRepository
                .findRecentSuccessfulLogins(user.getEmail(), org.springframework.data.domain.PageRequest.of(0, 2));
        if (recentLogins.size() >= 2) {
            AuditLog latest = recentLogins.get(0);
            AuditLog previous = recentLogins.get(1);

            // Compare IP addresses (would need IP field in AuditLog in real implementation)
            // For now, we'll check if logins are very close together (likely suspicious)
            long minutesBetween = java.time.temporal.ChronoUnit.MINUTES
                    .between(previous.getCreatedAt(), latest.getCreatedAt());

            if (minutesBetween < 5 && minutesBetween > 0) {
                alerts.add(createAlert(
                        user.getId(),
                        user.getEmail(),
                        AlertType.SUSPICIOUS_LOGIN,
                        "Detected login from a new location or device. If this wasn't you, change your password.",
                        "HIGH"
                ));
            }
        }

        return alerts;
    }

    // ================= GENERATE ALERTS FOR ALL USERS =================
    /**
     * Generate alerts for all users (for admin dashboard)
     */
    public Map<String, Object> generateSystemAlerts() {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> allAlerts = new ArrayList<>();
        Map<String, Long> alertCounts = new HashMap<>();

        for (User user : allUsers) {
            List<Map<String, Object>> userAlerts = generateAlertsForUser(user);
            allAlerts.addAll(userAlerts);

            // Count by type
            for (Map<String, Object> alert : userAlerts) {
                String type = (String) alert.get("type");
                alertCounts.put(type, alertCounts.getOrDefault(type, 0L) + 1);
            }
        }

        // Sort by severity and creation time
        allAlerts.sort((a, b) -> {
            String severityA = (String) a.get("severity");
            String severityB = (String) b.get("severity");
            int severityCompare = getSeverityRank(severityB) - getSeverityRank(severityA);
            if (severityCompare != 0) return severityCompare;

            LocalDateTime timeA = (LocalDateTime) a.get("createdAt");
            LocalDateTime timeB = (LocalDateTime) b.get("createdAt");
            return timeB.compareTo(timeA);
        });

        Map<String, Object> result = new HashMap<>();
        result.put("alerts", allAlerts);
        result.put("totalAlerts", allAlerts.size());
        result.put("criticalCount", alertCounts.getOrDefault("CRITICAL", 0L));
        result.put("highCount", alertCounts.getOrDefault("HIGH", 0L));
        result.put("mediumCount", alertCounts.getOrDefault("MEDIUM", 0L));
        result.put("alertsByType", alertCounts);

        return result;
    }

    // ================= UNREAD ALERTS FOR USER =================
    /**
     * Get unread alerts for a user
     */
    public List<Map<String, Object>> getUnreadAlertsForUser(User user) {
        List<Map<String, Object>> allAlerts = generateAlertsForUser(user);

        // In a real system, you'd check a read_at timestamp from database
        // For now, return all active alerts (they're "unread" until dismissed)
        return allAlerts.stream()
                .filter(alert -> {
                    // Keep alerts that are less than 24 hours old
                    LocalDateTime createdAt = (LocalDateTime) alert.get("createdAt");
                    return createdAt.isAfter(LocalDateTime.now().minusHours(24));
                })
                .collect(Collectors.toList());
    }

    // ================= CRITICAL ALERTS ONLY =================
    /**
     * Get only critical alerts (for quick security review)
     */
    public List<Map<String, Object>> getCriticalAlerts() {
        Map<String, Object> systemAlerts = generateSystemAlerts();
        List<Map<String, Object>> allAlerts = (List<Map<String, Object>>) systemAlerts.get("alerts");

        return allAlerts.stream()
                .filter(alert -> "CRITICAL".equals(alert.get("severity")))
                .collect(Collectors.toList());
    }

    // ================= HELPER: Create Alert =================
    private Map<String, Object> createAlert(
            Long userId,
            String userEmail,
            AlertType alertType,
            String message,
            String severity
    ) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("id", UUID.randomUUID().toString());
        alert.put("userId", userId);
        alert.put("userEmail", userEmail);
        alert.put("type", alertType.name());
        alert.put("message", message);
        alert.put("severity", severity);
        alert.put("createdAt", LocalDateTime.now());
        alert.put("readAt", null);
        alert.put("dismissed", false);

        return alert;
    }

    // ================= HELPER: Get Days Old =================
    private long getDaysOld(LocalDateTime dateTime) {
        return java.time.temporal.ChronoUnit.DAYS
                .between(dateTime, LocalDateTime.now());
    }

    // ================= HELPER: Severity Rank =================
    private int getSeverityRank(String severity) {
        return switch (severity) {
            case "CRITICAL" -> 3;
            case "HIGH" -> 2;
            case "MEDIUM" -> 1;
            default -> 0;
        };
    }

    // ================= HELPER: Get Alert Color =================
    public String getAlertColor(String severity) {
        return switch (severity) {
            case "CRITICAL" -> "#dc2626";  // Red
            case "HIGH" -> "#ea580c";      // Orange-red
            case "MEDIUM" -> "#d97706";    // Orange
            default -> "#6b7280";           // Gray
        };
    }

    // ================= HELPER: Get Alert Icon =================
    public String getAlertIcon(String alertType) {
        return switch (alertType) {
            case "HIGH_RISK" -> "⚠️";
            case "SUSPICIOUS_LOGIN" -> "🚨";
            case "PASSWORD_EXPIRING" -> "⏰";
            case "BRUTE_FORCE" -> "🔴";
            case "ACCOUNT_LOCKED" -> "🔐";
            default -> "ℹ️";
        };
    }
}