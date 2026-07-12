package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ✅ Day 77 — Security Alert Controller
 * REST endpoints for security alerts
 */
@RestController
@RequestMapping("/security-alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class SecurityAlertController {

    private final SecurityAlertService securityAlertService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public SecurityAlertController(
            SecurityAlertService securityAlertService,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.securityAlertService = securityAlertService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    // ================= GET MY ALERTS =================
    /**
     * GET /security-alerts/my-alerts
     * Returns personal alerts for authenticated user
     * Available to: authenticated users
     */
    @GetMapping("/my-alerts")
    public ResponseEntity<?> getMyAlerts(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("User not found"));
        }

        User user = optionalUser.get();

        // Get unread alerts
        List<Map<String, Object>> unreadAlerts = securityAlertService
                .getUnreadAlertsForUser(user);

        // Log access
        auditLogService.log(
                email,
                user.getRole(),
                "VIEW_SECURITY_ALERTS",
                email,
                "SUCCESS",
                "User viewed their security alerts (" + unreadAlerts.size() + " alerts)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Security alerts retrieved successfully",
                        unreadAlerts
                )
        );
    }

    // ================= GET ALL ALERTS (ADMIN) =================
    /**
     * GET /security-alerts/admin/all
     * Returns all system alerts (admin view)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllAlerts(Authentication auth) {

        Map<String, Object> systemAlerts = securityAlertService
                .generateSystemAlerts();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALL_SECURITY_ALERTS",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed all system security alerts"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "System alerts retrieved successfully",
                        systemAlerts
                )
        );
    }

    // ================= GET CRITICAL ALERTS (ADMIN) =================
    /**
     * GET /security-alerts/admin/critical
     * Returns only critical alerts (admin view)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/critical")
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
                        criticalAlerts
                )
        );
    }

    // ================= GET ALERTS FOR SPECIFIC USER (ADMIN) =================
    /**
     * GET /security-alerts/admin/user/{email}
     * Returns alerts for a specific user (admin view)
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/user/{email}")
    public ResponseEntity<?> getUserAlerts(
            @PathVariable String email,
            Authentication auth
    ) {

        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("User not found"));
        }

        User user = optionalUser.get();
        List<Map<String, Object>> userAlerts = securityAlertService
                .generateAlertsForUser(user);

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_USER_ALERTS",
                email,
                "SUCCESS",
                "Admin viewed alerts for user " + email + " (" + userAlerts.size() + " alerts)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "User alerts retrieved successfully",
                        userAlerts
                )
        );
    }

    // ================= DISMISS ALERT =================
    /**
     * POST /security-alerts/dismiss
     * Mark alert as dismissed
     * Available to: authenticated users
     */
    @PostMapping("/dismiss")
    public ResponseEntity<?> dismissAlert(
            @RequestBody Map<String, String> request,
            Authentication auth
    ) {

        String alertId = request.get("alertId");
        String email = auth.getName();

        // Log access
        auditLogService.log(
                email,
                "USER",
                "DISMISS_ALERT",
                email,
                "SUCCESS",
                "User dismissed alert: " + alertId
        );

        // Return success (in real system, would update database)
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert dismissed successfully",
                        Map.of("alertId", alertId, "dismissed", true)
                )
        );
    }

    // ================= MARK ALERT AS READ =================
    /**
     * POST /security-alerts/read
     * Mark alert as read
     * Available to: authenticated users
     */
    @PostMapping("/read")
    public ResponseEntity<?> markAlertAsRead(
            @RequestBody Map<String, String> request,
            Authentication auth
    ) {

        String alertId = request.get("alertId");
        String email = auth.getName();

        // Log access
        auditLogService.log(
                email,
                "USER",
                "READ_ALERT",
                email,
                "SUCCESS",
                "User read alert: " + alertId
        );

        // Return success (in real system, would update database)
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert marked as read",
                        Map.of("alertId", alertId, "read", true)
                )
        );
    }

    // ================= GET ALERT COUNT =================
    /**
     * GET /security-alerts/count
     * Returns count of unread alerts for user
     * Available to: authenticated users
     */
    @GetMapping("/count")
    public ResponseEntity<?> getAlertCount(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("User not found"));
        }

        User user = optionalUser.get();
        List<Map<String, Object>> alerts = securityAlertService
                .getUnreadAlertsForUser(user);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Alert count retrieved successfully",
                        Map.of("unreadCount", alerts.size())
                )
        );
    }
}