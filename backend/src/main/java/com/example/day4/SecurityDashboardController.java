package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/security-dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class SecurityDashboardController {

    private final AuditLogService auditLogService;

    public SecurityDashboardController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getDashboard() {

        SecurityDashboardResponse response =
                auditLogService.getSecurityDashboard();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Security dashboard fetched successfully",
                        response
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/top-actions")
    public ResponseEntity<?> getTopActions() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Top actions fetched successfully",
                        auditLogService.getTopActions()
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/session-metrics")
    public ResponseEntity<?> getSessionMetrics() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Session metrics fetched successfully",
                        auditLogService.getSessionMetrics()
                )
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/recent-events")
    public ResponseEntity<?> getRecentEvents() {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Recent security events fetched successfully",
                        auditLogService.getRecentSecurityEvents()
                )
        );
    }
}