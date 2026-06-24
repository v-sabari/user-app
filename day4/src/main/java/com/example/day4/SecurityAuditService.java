package com.example.day4;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ✅ Day 76 — Security Audit Service
 * Calculates risk scores and identifies security issues for users
 */
@Service
public class SecurityAuditService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public SecurityAuditService(
            UserRepository userRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // ================= RISK SCORE CALCULATION =================
    /**
     * Calculate comprehensive risk score for a user (0-100)
     * Higher score = higher risk
     */
    public int calculateRiskScore(User user) {
        int score = 0;

        // Factor 1: Account Status (+25 for locked)
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            score += 25;
        }

        // Factor 2: Failed Logins in Last 7 Days (+30 max)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long recentFailedLogins = auditLogRepository
                .countRecentFailedLogins(user.getEmail(), sevenDaysAgo);
        if (recentFailedLogins > 0) {
            // Scale: 1+ = 10pts, 3+ = 20pts, 5+ = 30pts
            score += Math.min(30, recentFailedLogins * 5);
        }

        // Factor 3: Password Age (+20 for 90+ days)
        if (user.getLastPasswordChangedAt() != null) {
            LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
            if (user.getLastPasswordChangedAt().isBefore(ninetyDaysAgo)) {
                score += 20;
            }
        }

        // Factor 4: No Recent Activity (+15 for 30+ days)
        List<AuditLog> recentActivity = auditLogRepository
                .findTop5ByActorEmailOrderByCreatedAtDesc(user.getEmail());
        if (recentActivity.isEmpty()) {
            score += 15;
        } else {
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
            if (recentActivity.get(0).getCreatedAt().isBefore(thirtyDaysAgo)) {
                score += 15;
            }
        }

        // Factor 5: Inactive Status (+10)
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {
            score += 10;
        }

        // Cap at 100
        return Math.min(100, score);
    }

    // ================= RISK LEVEL DETERMINATION =================
    /**
     * Determine risk level based on score
     */
    public String getRiskLevel(int score) {
        if (score <= 25) return "SECURE";
        if (score <= 50) return "CAUTION";
        if (score <= 75) return "AT_RISK";
        return "CRITICAL";
    }

    // ================= GET RISK COLOR =================
    /**
     * Return color code for UI display
     */
    public String getRiskColor(String riskLevel) {
        return switch (riskLevel) {
            case "SECURE" -> "#16a34a";      // Green
            case "CAUTION" -> "#d97706";     // Orange
            case "AT_RISK" -> "#ea580c";     // Red-orange
            case "CRITICAL" -> "#dc2626";    // Red
            default -> "#6b7280";             // Gray
        };
    }

    // ================= GET USER SECURITY METRICS =================
    /**
     * Get detailed security metrics for a single user
     */
    public Map<String, Object> getUserSecurityMetrics(User user) {
        int riskScore = calculateRiskScore(user);
        String riskLevel = getRiskLevel(riskScore);
        String riskColor = getRiskColor(riskLevel);

        // Failed logins in last 7 days
        long failedLoginsLast7Days = auditLogRepository
                .countRecentFailedLogins(user.getEmail(), LocalDateTime.now().minusDays(7));

        // Successful logins in last 7 days
        long successfulLoginsLast7Days = auditLogRepository
                .countByActionAndStatus("LOGIN", "SUCCESS");

        // Total actions
        long totalActions = auditLogRepository.countByActorEmail(user.getEmail());

        // Password age
        LocalDateTime lastPasswordChange = user.getLastPasswordChangedAt();
        long passwordAgeDays = lastPasswordChange != null
                ? java.time.temporal.ChronoUnit.DAYS.between(lastPasswordChange, LocalDateTime.now())
                : -1;

        // Last login
        List<AuditLog> recentLogins = auditLogRepository
                .findRecentSuccessfulLogins(user.getEmail(), org.springframework.data.domain.PageRequest.of(0, 1));
        LocalDateTime lastLogin = recentLogins.isEmpty() ? null : recentLogins.get(0).getCreatedAt();

        // Last activity (any action)
        List<AuditLog> allActivity = auditLogRepository
                .findTop5ByActorEmailOrderByCreatedAtDesc(user.getEmail());
        LocalDateTime lastActivity = allActivity.isEmpty() ? null : allActivity.get(0).getCreatedAt();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("userId", user.getId());
        metrics.put("email", user.getEmail());
        metrics.put("name", user.getName());
        metrics.put("role", user.getRole());
        metrics.put("status", user.getStatus());
        metrics.put("riskScore", riskScore);
        metrics.put("riskLevel", riskLevel);
        metrics.put("riskColor", riskColor);
        metrics.put("failedLoginsLast7Days", failedLoginsLast7Days);
        metrics.put("totalActions", totalActions);
        metrics.put("passwordAgeDays", passwordAgeDays);
        metrics.put("lastPasswordChanged", lastPasswordChange);
        metrics.put("lastLogin", lastLogin);
        metrics.put("lastActivity", lastActivity);

        return metrics;
    }

    // ================= GET ALL USERS' RISK ASSESSMENT =================
    /**
     * Get risk assessment for all users (admin view)
     */
    public List<Map<String, Object>> getAllUsersRiskAssessment() {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .map(this::getUserSecurityMetrics)
                .collect(Collectors.toList());
    }

    // ================= GET HIGH-RISK ACCOUNTS =================
    /**
     * Get only accounts marked as AT_RISK or CRITICAL
     */
    public List<Map<String, Object>> getHighRiskAccounts() {
        return getAllUsersRiskAssessment().stream()
                .filter(m -> {
                    String level = (String) m.get("riskLevel");
                    return "AT_RISK".equals(level) || "CRITICAL".equals(level);
                })
                .sorted((a, b) -> {
                    Integer scoreA = (Integer) a.get("riskScore");
                    Integer scoreB = (Integer) b.get("riskScore");
                    return scoreB.compareTo(scoreA); // Descending
                })
                .collect(Collectors.toList());
    }

    // ================= GET RECOMMENDATIONS =================
    /**
     * Get security recommendations for a user
     */
    public List<String> getSecurityRecommendations(User user) {
        List<String> recommendations = new ArrayList<>();

        // Check failed logins
        long failedLogins = auditLogRepository
                .countRecentFailedLogins(user.getEmail(), LocalDateTime.now().minusDays(7));
        if (failedLogins > 3) {
            recommendations.add("⚠️ Multiple failed login attempts detected. Consider changing your password.");
        }

        // Check password age
        if (user.getLastPasswordChangedAt() != null) {
            LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
            if (user.getLastPasswordChangedAt().isBefore(ninetyDaysAgo)) {
                recommendations.add("🔒 Your password is " + java.time.temporal.ChronoUnit.DAYS
                        .between(user.getLastPasswordChangedAt(), LocalDateTime.now())
                        + " days old. Update it regularly for security.");
            }
        }

        // Check account status
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            recommendations.add("🔐 Your account is locked. Contact an administrator to unlock it.");
        }

        // Check inactivity
        List<AuditLog> recentActivity = auditLogRepository
                .findTop5ByActorEmailOrderByCreatedAtDesc(user.getEmail());
        if (recentActivity.isEmpty() || recentActivity.get(0).getCreatedAt()
                .isBefore(LocalDateTime.now().minusDays(30))) {
            recommendations.add("👤 No recent account activity. Ensure your account is only used by you.");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("✅ Your account appears secure. Keep up the good security practices!");
        }

        return recommendations;
    }

    // ================= EXPORT RISK REPORT =================
    /**
     * Generate CSV export of risk assessment
     */
    public String generateRiskReportCsv() {
        List<Map<String, Object>> allAssessments = getAllUsersRiskAssessment();

        StringBuilder csv = new StringBuilder();
        csv.append("Email,Name,Role,Status,Risk Score,Risk Level,Failed Logins (7d),Total Actions,Password Age (days),Last Login\n");

        for (Map<String, Object> assessment : allAssessments) {
            csv.append("\"").append(escape((String) assessment.get("email"))).append("\",");
            csv.append("\"").append(escape((String) assessment.get("name"))).append("\",");
            csv.append(assessment.get("role")).append(",");
            csv.append(assessment.get("status")).append(",");
            csv.append(assessment.get("riskScore")).append(",");
            csv.append(assessment.get("riskLevel")).append(",");
            csv.append(assessment.get("failedLoginsLast7Days")).append(",");
            csv.append(assessment.get("totalActions")).append(",");
            csv.append(assessment.get("passwordAgeDays")).append(",");
            csv.append(assessment.get("lastLogin") != null ? assessment.get("lastLogin") : "Never").append("\n");
        }

        return csv.toString();
    }

    // ================= CSV ESCAPE HELPER =================
    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}