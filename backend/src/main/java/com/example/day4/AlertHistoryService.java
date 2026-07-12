package com.example.day4;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ✅ Day 79 — Alert History Service
 * Manages alert archival and historical data retrieval
 */
@Service
public class AlertHistoryService {

    private final SecurityAlertService securityAlertService;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AlertHistoryService(
            SecurityAlertService securityAlertService,
            AuditLogRepository auditLogRepository,
            UserRepository userRepository
    ) {
        this.securityAlertService = securityAlertService;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    // ================= ARCHIVE ALERT =================
    /**
     * Archive an alert (mark as handled/dismissed)
     */
    public Map<String, Object> archiveAlert(String alertId, String reason) {
        Map<String, Object> archived = new HashMap<>();
        archived.put("alertId", alertId);
        archived.put("archivedAt", LocalDateTime.now());
        archived.put("reason", reason);
        archived.put("status", "ARCHIVED");

        return archived;
    }

    // ================= GET USER ALERT HISTORY =================
    /**
     * Get all historical alerts for a specific user
     */
    public Map<String, Object> getUserAlertHistory(User user) {
        List<Map<String, Object>> currentAlerts = securityAlertService
                .generateAlertsForUser(user);

        // Get past failed logins (from audit log)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<AuditLog> failedLogins = auditLogRepository
                .findByActorEmailOrderByCreatedAtDesc(user.getEmail(),
                        org.springframework.data.domain.PageRequest.of(0, 100))
                .getContent()
                .stream()
                .filter(log -> "LOGIN".equals(log.getAction()) && "FAILED".equals(log.getStatus()))
                .filter(log -> log.getCreatedAt().isAfter(thirtyDaysAgo))
                .collect(Collectors.toList());

        // Create historical alert records from failed logins
        List<Map<String, Object>> historicalAlerts = failedLogins.stream()
                .map(log -> {
                    Map<String, Object> alertMap = new HashMap<>();
                    alertMap.put("id", UUID.randomUUID().toString());
                    alertMap.put("type", "BRUTE_FORCE_ATTEMPT");
                    alertMap.put("severity", "MEDIUM");
                    alertMap.put("message", "Failed login attempt from " + log.getDetails());
                    alertMap.put("createdAt", log.getCreatedAt());
                    alertMap.put("status", "ARCHIVED");
                    alertMap.put("archived", true);
                    return alertMap;
                })
                .collect(Collectors.toList());

        // Get password change history
        if (user.getLastPasswordChangedAt() != null) {
            Map<String, Object> passwordAlert = new HashMap<>();
            passwordAlert.put("id", UUID.randomUUID().toString());
            passwordAlert.put("type", "PASSWORD_CHANGED");
            passwordAlert.put("severity", "INFO");
            passwordAlert.put("message", "Password changed successfully");
            passwordAlert.put("createdAt", user.getLastPasswordChangedAt());
            passwordAlert.put("status", "RESOLVED");
            passwordAlert.put("archived", true);
            historicalAlerts.add(passwordAlert);
        }

        // Combine and sort
        List<Map<String, Object>> allAlerts = new ArrayList<>();
        allAlerts.addAll(currentAlerts);
        allAlerts.addAll(historicalAlerts);
        allAlerts.sort((a, b) -> {
            Object dateAObj = a.get("createdAt");
            Object dateBObj = b.get("createdAt");
            if (dateAObj instanceof LocalDateTime && dateBObj instanceof LocalDateTime) {
                LocalDateTime dateA = (LocalDateTime) dateAObj;
                LocalDateTime dateB = (LocalDateTime) dateBObj;
                return dateB.compareTo(dateA);
            }
            return 0;
        });

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("email", user.getEmail());
        result.put("totalAlerts", allAlerts.size());
        result.put("activeAlerts", (int) currentAlerts.stream()
                .filter(a -> a.get("archived") == null || !(boolean) a.get("archived"))
                .count());
        result.put("archivedAlerts", historicalAlerts.size());
        result.put("alerts", allAlerts);

        return result;
    }

    // ================= GET SYSTEM ALERT HISTORY =================
    /**
     * Get historical alerts across all users (admin view)
     */
    public Map<String, Object> getSystemAlertHistory(int days) {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> allHistoricalAlerts = new ArrayList<>();
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);

        for (User user : allUsers) {
            Map<String, Object> userHistory = getUserAlertHistory(user);
            List<Map<String, Object>> userAlerts = (List<Map<String, Object>>)
                    userHistory.get("alerts");

            // Filter by date
            userAlerts.stream()
                    .filter(alert -> {
                        Object dateObj = alert.get("createdAt");
                        if (dateObj instanceof LocalDateTime) {
                            LocalDateTime alertDate = (LocalDateTime) dateObj;
                            return alertDate.isAfter(cutoffDate);
                        }
                        return false;
                    })
                    .forEach(allHistoricalAlerts::add);
        }

        // Sort by date descending
        allHistoricalAlerts.sort((a, b) -> {
            Object dateAObj = a.get("createdAt");
            Object dateBObj = b.get("createdAt");
            if (dateAObj instanceof LocalDateTime && dateBObj instanceof LocalDateTime) {
                LocalDateTime dateA = (LocalDateTime) dateAObj;
                LocalDateTime dateB = (LocalDateTime) dateBObj;
                return dateB.compareTo(dateA);
            }
            return 0;
        });

        // Count by severity
        Map<String, Long> severityCounts = new HashMap<>();
        for (Map<String, Object> alert : allHistoricalAlerts) {
            String severity = (String) alert.get("severity");
            severityCounts.put(severity, severityCounts.getOrDefault(severity, 0L) + 1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("days", days);
        result.put("totalAlerts", allHistoricalAlerts.size());
        result.put("alertsBySeverity", severityCounts);
        result.put("alerts", allHistoricalAlerts);

        return result;
    }

    // ================= GET ALERTS BY DATE RANGE =================
    /**
     * Get alerts within a specific date range
     */
    public Map<String, Object> getAlertsByDateRange(
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> filteredAlerts = new ArrayList<>();

        for (User user : allUsers) {
            Map<String, Object> userHistory = getUserAlertHistory(user);
            List<Map<String, Object>> userAlerts = (List<Map<String, Object>>)
                    userHistory.get("alerts");

            userAlerts.stream()
                    .filter(alert -> {
                        Object dateObj = alert.get("createdAt");
                        if (dateObj instanceof LocalDateTime) {
                            LocalDateTime alertDate = (LocalDateTime) dateObj;
                            return !alertDate.isBefore(fromDate) && !alertDate.isAfter(toDate);
                        }
                        return false;
                    })
                    .forEach(filteredAlerts::add);
        }

        filteredAlerts.sort((a, b) -> {
            Object dateAObj = a.get("createdAt");
            Object dateBObj = b.get("createdAt");
            if (dateAObj instanceof LocalDateTime && dateBObj instanceof LocalDateTime) {
                LocalDateTime dateA = (LocalDateTime) dateAObj;
                LocalDateTime dateB = (LocalDateTime) dateBObj;
                return dateB.compareTo(dateA);
            }
            return 0;
        });

        Map<String, Object> result = new HashMap<>();
        result.put("fromDate", fromDate);
        result.put("toDate", toDate);
        result.put("totalAlerts", filteredAlerts.size());
        result.put("alerts", filteredAlerts);

        return result;
    }

    // ================= GET ALERTS BY TYPE =================
    /**
     * Get all historical alerts of a specific type
     */
    public List<Map<String, Object>> getAlertsByType(String alertType) {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> typeAlerts = new ArrayList<>();

        for (User user : allUsers) {
            Map<String, Object> userHistory = getUserAlertHistory(user);
            List<Map<String, Object>> userAlerts = (List<Map<String, Object>>)
                    userHistory.get("alerts");

            userAlerts.stream()
                    .filter(alert -> alertType.equals(alert.get("type")))
                    .forEach(typeAlerts::add);
        }

        typeAlerts.sort((a, b) -> {
            Object dateAObj = a.get("createdAt");
            Object dateBObj = b.get("createdAt");
            if (dateAObj instanceof LocalDateTime && dateBObj instanceof LocalDateTime) {
                LocalDateTime dateA = (LocalDateTime) dateAObj;
                LocalDateTime dateB = (LocalDateTime) dateBObj;
                return dateB.compareTo(dateA);
            }
            return 0;
        });

        return typeAlerts;
    }

    // ================= GET USER WITH MOST ALERTS =================
    /**
     * Get users ranked by alert frequency (last 30 days)
     */
    public List<Map<String, Object>> getTopAlertedUsersHistory(int limit) {
        List<User> allUsers = userRepository.findAll();
        Map<String, Integer> userAlertCounts = new HashMap<>();

        for (User user : allUsers) {
            Map<String, Object> userHistory = getUserAlertHistory(user);
            Integer activeCount = (Integer) userHistory.get("activeAlerts");
            if (activeCount > 0) {
                userAlertCounts.put(user.getEmail(), activeCount);
            }
        }

        return userAlertCounts.entrySet()
                .stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("email", entry.getKey());
                    map.put("alertCount", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // ================= GENERATE ALERT STATISTICS =================
    /**
     * Generate comprehensive alert statistics
     */
    public Map<String, Object> getAlertStatistics() {
        Map<String, Object> systemHistory = getSystemAlertHistory(90);
        List<Map<String, Object>> allAlerts = (List<Map<String, Object>>)
                systemHistory.get("alerts");

        long criticalCount = 0;
        long highCount = 0;
        long mediumCount = 0;
        Map<String, Long> dailyCounts = new HashMap<>();

        for (Map<String, Object> alert : allAlerts) {
            String severity = (String) alert.get("severity");
            if ("CRITICAL".equals(severity)) {
                criticalCount++;
            } else if ("HIGH".equals(severity)) {
                highCount++;
            } else if ("MEDIUM".equals(severity)) {
                mediumCount++;
            }

            Object dateObj = alert.get("createdAt");
            if (dateObj instanceof LocalDateTime) {
                LocalDateTime date = (LocalDateTime) dateObj;
                String dateKey = date.toLocalDate().toString();
                dailyCounts.put(dateKey, dailyCounts.getOrDefault(dateKey, 0L) + 1);
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAlerts", allAlerts.size());
        stats.put("criticalCount", criticalCount);
        stats.put("highCount", highCount);
        stats.put("mediumCount", mediumCount);
        stats.put("averageAlertsPerDay", allAlerts.isEmpty() ? 0 :
                Math.round((allAlerts.size() * 100.0) / 90) / 100.0);
        stats.put("dailyCounts", dailyCounts);
        stats.put("trend", calculateTrend(dailyCounts));

        return stats;
    }

    // ================= HELPER: Calculate trend =================
    private String calculateTrend(Map<String, Long> dailyCounts) {
        if (dailyCounts.isEmpty()) return "STABLE";

        List<Long> values = new ArrayList<>(dailyCounts.values());
        if (values.size() < 2) return "INSUFFICIENT_DATA";

        Long first = values.get(0);
        Long last = values.get(values.size() - 1);

        if (last > first * 1.2) return "INCREASING";
        if (last < first * 0.8) return "DECREASING";
        return "STABLE";
    }

    // ================= EXPORT ALERT HISTORY =================
    /**
     * Generate CSV export of alert history
     */
    public String exportAlertHistoryToCSV(int days) {
        Map<String, Object> history = getSystemAlertHistory(days);
        List<Map<String, Object>> alerts = (List<Map<String, Object>>)
                history.get("alerts");

        StringBuilder csv = new StringBuilder();
        csv.append("DateTime,UserEmail,AlertType,Severity,Message,Status\n");

        for (Map<String, Object> alert : alerts) {
            csv.append("\"").append(alert.get("createdAt")).append("\",");
            csv.append("\"").append(alert.get("userEmail") != null ? alert.get("userEmail") : "SYSTEM").append("\",");
            csv.append(alert.get("type")).append(",");
            csv.append(alert.get("severity")).append(",");
            csv.append("\"").append(escape((String) alert.get("message"))).append("\",");
            csv.append(alert.get("status")).append("\n");
        }

        return csv.toString();
    }

    // ================= HELPER: CSV escape =================
    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}