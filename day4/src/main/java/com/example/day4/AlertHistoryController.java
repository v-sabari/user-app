package com.example.day4;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ✅ Day 79 — Alert History Controller
 * REST endpoints for alert history and archival
 */
@RestController
@RequestMapping("/security-alerts/history")
@CrossOrigin(origins = "http://localhost:5173")
public class AlertHistoryController {

    private final AlertHistoryService alertHistoryService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public AlertHistoryController(
            AlertHistoryService alertHistoryService,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.alertHistoryService = alertHistoryService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    // ================= GET MY ALERT HISTORY =================
    /**
     * GET /security-alerts/history/my-history
     * Returns personal alert history
     * Available to: authenticated users
     */
    @GetMapping("/my-history")
    public ResponseEntity<?> getMyAlertHistory(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("User not found"));
        }

        User user = optionalUser.get();
        Map<String, Object> history = alertHistoryService
                .getUserAlertHistory(user);

        // Log access
        auditLogService.log(
                email,
                user.getRole(),
                "VIEW_ALERT_HISTORY",
                email,
                "SUCCESS",
                "User viewed their alert history"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert history retrieved successfully",
                        history
                )
        );
    }

    // ================= GET SYSTEM ALERT HISTORY (ADMIN) =================
    /**
     * GET /security-alerts/history/system?days=30
     * Returns system-wide alert history (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/system")
    public ResponseEntity<?> getSystemAlertHistory(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth
    ) {

        Map<String, Object> history = alertHistoryService
                .getSystemAlertHistory(days);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_SYSTEM_ALERT_HISTORY",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed system alert history (last " + days + " days)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "System alert history retrieved successfully",
                        history
                )
        );
    }

    // ================= GET ALERTS BY DATE RANGE (ADMIN) =================
    /**
     * GET /security-alerts/history/range?from=2024-01-01T00:00:00&to=2024-01-31T23:59:59
     * Returns alerts within date range (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/range")
    public ResponseEntity<?> getAlertsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Authentication auth
    ) {

        Map<String, Object> history = alertHistoryService
                .getAlertsByDateRange(from, to);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALERTS_BY_DATE_RANGE",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed alerts from " + from + " to " + to
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alerts retrieved successfully",
                        history
                )
        );
    }

    // ================= GET ALERTS BY TYPE (ADMIN) =================
    /**
     * GET /security-alerts/history/type/{type}
     * Returns all alerts of a specific type (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getAlertsByType(
            @PathVariable String type,
            Authentication auth
    ) {

        List<Map<String, Object>> alerts = alertHistoryService
                .getAlertsByType(type);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALERTS_BY_TYPE",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed alerts of type: " + type + " (" + alerts.size() + " found)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alerts retrieved successfully",
                        Map.of(
                                "type", type,
                                "count", alerts.size(),
                                "alerts", alerts
                        )
                )
        );
    }

    // ================= GET TOP ALERTED USERS (ADMIN) =================
    /**
     * GET /security-alerts/history/users/top?limit=10
     * Returns users with most alerts historically (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users/top")
    public ResponseEntity<?> getTopAlertedUsersHistory(
            @RequestParam(defaultValue = "10") int limit,
            Authentication auth
    ) {

        List<Map<String, Object>> topUsers = alertHistoryService
                .getTopAlertedUsersHistory(limit);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_TOP_ALERTED_USERS_HISTORY",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed top alerted users (top " + limit + ")"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Top alerted users retrieved successfully",
                        topUsers
                )
        );
    }

    // ================= GET ALERT STATISTICS (ADMIN) =================
    /**
     * GET /security-alerts/history/statistics
     * Returns comprehensive alert statistics (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics")
    public ResponseEntity<?> getAlertStatistics(Authentication auth) {

        Map<String, Object> stats = alertHistoryService
                .getAlertStatistics();

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
                        stats
                )
        );
    }

    // ================= EXPORT ALERT HISTORY (ADMIN) =================
    /**
     * GET /security-alerts/history/export?days=30
     * Export alert history as CSV (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/export")
    public ResponseEntity<?> exportAlertHistory(
            @RequestParam(defaultValue = "30") int days,
            Authentication auth
    ) {

        String csvContent = alertHistoryService
                .exportAlertHistoryToCSV(days);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "EXPORT_ALERT_HISTORY",
                "SYSTEM",
                "SUCCESS",
                "Admin exported alert history (last " + days + " days)"
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=alert-history-" + days + "days.csv")
                .contentType(new MediaType("text", "csv"))
                .body(csvContent.getBytes(StandardCharsets.UTF_8));
    }

    // ================= GET USER ALERT HISTORY (ADMIN) =================
    /**
     * GET /security-alerts/history/user/{email}
     * Returns alert history for specific user (admin only)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user/{email}")
    public ResponseEntity<?> getUserAlertHistoryAdmin(
            @PathVariable String email,
            Authentication auth
    ) {

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("User not found"));
        }

        User user = optionalUser.get();
        Map<String, Object> history = alertHistoryService
                .getUserAlertHistory(user);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_USER_ALERT_HISTORY",
                email,
                "SUCCESS",
                "Admin viewed alert history for user: " + email
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "User alert history retrieved successfully",
                        history
                )
        );
    }
}