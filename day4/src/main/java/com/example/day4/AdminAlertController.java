package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ✅ Day 78 — Admin Alerts Controller
 * REST endpoints for admin alert management
 */
@RestController
@RequestMapping("/admin/alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminAlertController {

    private final SecurityAlertService securityAlertService;
    private final AuditLogService auditLogService;

    public AdminAlertController(
            SecurityAlertService securityAlertService,
            AuditLogService auditLogService
    ) {
        this.securityAlertService = securityAlertService;
        this.auditLogService = auditLogService;
    }

    // ================= GET ALL SYSTEM ALERTS =================
    /**
     * GET /admin/alerts/all
     * Returns all system alerts (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<?> getAllAlerts(Authentication auth) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALL_SYSTEM_ALERTS",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed all system alerts"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "All system alerts retrieved successfully",
                        systemAlerts
                )
        );
    }

    // ================= GET CRITICAL ALERTS ONLY =================
    /**
     * GET /admin/alerts/critical
     * Returns only critical alerts (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/critical")
    public ResponseEntity<?> getCriticalAlerts(Authentication auth) {

        List<Map<String, Object>> criticalAlerts = securityAlertService
                .getCriticalAlerts();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_CRITICAL_ALERTS",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed critical alerts (" + criticalAlerts.size() + " found)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Critical alerts retrieved successfully",
                        Map.of(
                                "alerts", criticalAlerts,
                                "count", criticalAlerts.size(),
                                "requiresAction", !criticalAlerts.isEmpty()
                        )
                )
        );
    }

    // ================= GET ALERTS BY SEVERITY =================
    /**
     * GET /admin/alerts/severity/{severity}
     * Returns alerts by severity level (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/severity/{severity}")
    public ResponseEntity<?> getAlertsBySeverity(
            @PathVariable String severity,
            Authentication auth
    ) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();
        List<Map<String, Object>> allAlerts = (List<Map<String, Object>>)
                systemAlerts.get("alerts");

        List<Map<String, Object>> filtered = allAlerts.stream()
                .filter(alert -> severity.equals(alert.get("severity")))
                .toList();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALERTS_BY_SEVERITY",
                "SYSTEM",
                "SUCCESS",
                "Admin filtered alerts by severity: " + severity + " (" + filtered.size() + " found)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alerts retrieved successfully",
                        Map.of(
                                "severity", severity,
                                "alerts", filtered,
                                "count", filtered.size()
                        )
                )
        );
    }

    // ================= GET ALERTS BY TYPE =================
    /**
     * GET /admin/alerts/type/{type}
     * Returns alerts by type (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getAlertsByType(
            @PathVariable String type,
            Authentication auth
    ) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();
        List<Map<String, Object>> allAlerts = (List<Map<String, Object>>)
                systemAlerts.get("alerts");

        List<Map<String, Object>> filtered = allAlerts.stream()
                .filter(alert -> type.equals(alert.get("type")))
                .toList();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALERTS_BY_TYPE",
                "SYSTEM",
                "SUCCESS",
                "Admin filtered alerts by type: " + type + " (" + filtered.size() + " found)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alerts retrieved successfully",
                        Map.of(
                                "type", type,
                                "alerts", filtered,
                                "count", filtered.size()
                        )
                )
        );
    }

    // ================= GET ALERT SUMMARY =================
    /**
     * GET /admin/alerts/summary
     * Returns alert summary statistics (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/summary")
    public ResponseEntity<?> getAlertSummary(Authentication auth) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALERT_SUMMARY",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed alert summary"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert summary retrieved successfully",
                        Map.of(
                                "totalAlerts", systemAlerts.get("totalAlerts"),
                                "criticalCount", systemAlerts.get("criticalCount"),
                                "highCount", systemAlerts.get("highCount"),
                                "mediumCount", systemAlerts.get("mediumCount"),
                                "alertsByType", systemAlerts.get("alertsByType"),
                                "requiresImmediateAction",
                                ((Long) systemAlerts.get("criticalCount")) > 0
                        )
                )
        );
    }

    // ================= ACKNOWLEDGE ALERT (MARK HANDLED) =================
    /**
     * POST /admin/alerts/{alertId}/acknowledge
     * Mark alert as acknowledged/handled (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{alertId}/acknowledge")
    public ResponseEntity<?> acknowledgeAlert(
            @PathVariable String alertId,
            Authentication auth
    ) {

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "ACKNOWLEDGE_ALERT",
                "SYSTEM",
                "SUCCESS",
                "Admin acknowledged alert: " + alertId
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert acknowledged successfully",
                        Map.of("alertId", alertId, "acknowledged", true)
                )
        );
    }

    // ================= GET TOP ALERTED USERS =================
    /**
     * GET /admin/alerts/users/top
     * Returns users with most alerts (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users/top")
    public ResponseEntity<?> getTopAlertedUsers(
            @RequestParam(defaultValue = "10") int limit,
            Authentication auth
    ) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();
        List<Map<String, Object>> allAlerts = (List<Map<String, Object>>)
                systemAlerts.get("alerts");

        // Count alerts per user
        Map<String, Long> userAlertCounts = new java.util.HashMap<>();
        for (Map<String, Object> alert : allAlerts) {
            String email = (String) alert.get("userEmail");
            userAlertCounts.put(email, userAlertCounts.getOrDefault(email, 0L) + 1);
        }

        // Sort and limit
        List<Map<String, Object>> topUsers = userAlertCounts.entrySet()
                .stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(entry -> Map.of(
                        "email", (Object) entry.getKey(),
                        "alertCount", (Object) entry.getValue()
                ))
                .toList();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_TOP_ALERTED_USERS",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed top alerted users"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Top alerted users retrieved successfully",
                        topUsers
                )
        );
    }

    // ================= GET ALERT STATISTICS =================
    /**
     * GET /admin/alerts/stats
     * Returns detailed alert statistics (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<?> getAlertStatistics(Authentication auth) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();
        List<Map<String, Object>> allAlerts = (List<Map<String, Object>>)
                systemAlerts.get("alerts");

        long criticalCount = allAlerts.stream()
                .filter(a -> "CRITICAL".equals(a.get("severity")))
                .count();
        long highCount = allAlerts.stream()
                .filter(a -> "HIGH".equals(a.get("severity")))
                .count();
        long mediumCount = allAlerts.stream()
                .filter(a -> "MEDIUM".equals(a.get("severity")))
                .count();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALERT_STATISTICS",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed alert statistics"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert statistics retrieved successfully",
                        Map.of(
                                "totalAlerts", allAlerts.size(),
                                "criticalCount", criticalCount,
                                "criticalPercentage", allAlerts.isEmpty() ? 0 :
                                        Math.round((criticalCount * 100.0) / allAlerts.size()),
                                "highCount", highCount,
                                "mediumCount", mediumCount,
                                "averagePerUser", allAlerts.isEmpty() ? 0 :
                                        Math.round((allAlerts.size() * 10.0) /
                                                allAlerts.stream()
                                                        .map(a -> a.get("userEmail"))
                                                        .distinct()
                                                        .count()) / 10.0
                        )
                )
        );
    }
}