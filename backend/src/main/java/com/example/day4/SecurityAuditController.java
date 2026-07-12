package com.example.day4;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ✅ Day 76 — Security Audit Controller
 * REST endpoints for security audit & risk assessment
 */
@RestController
@RequestMapping("/security-audit")
@CrossOrigin(origins = "http://localhost:5173")
public class SecurityAuditController {

    private final SecurityAuditService securityAuditService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public SecurityAuditController(
            SecurityAuditService securityAuditService,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.securityAuditService = securityAuditService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    // ================= GET MY ACCOUNT SECURITY SCORE =================
    /**
     * GET /security-audit/my-account
     * Returns personal security score and recommendations
     * Available to: authenticated users
     */
    @GetMapping("/my-account")
    public ResponseEntity<?> getMySecurityScore(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("User not found"));
        }

        User user = optionalUser.get();

        // Get security metrics
        Map<String, Object> metrics = securityAuditService
                .getUserSecurityMetrics(user);

        // Get recommendations
        List<String> recommendations = securityAuditService
                .getSecurityRecommendations(user);

        // Build response
        Map<String, Object> response = Map.ofEntries(
                Map.entry("metrics", metrics),
                Map.entry("recommendations", recommendations)
        );

        // Log access
        auditLogService.log(
                email,
                user.getRole(),
                "VIEW_SECURITY_SCORE",
                email,
                "SUCCESS",
                "User viewed their security score"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Security score retrieved successfully",
                        response
                )
        );
    }

    // ================= GET ALL USERS' RISK ASSESSMENT (ADMIN) =================
    /**
     * GET /security-audit/admin
     * Returns risk assessment for all users
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<?> getAllUsersRiskAssessment(Authentication auth) {

        List<Map<String, Object>> assessments = securityAuditService
                .getAllUsersRiskAssessment();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_ALL_RISK_ASSESSMENT",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed all users' risk assessment"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Risk assessment retrieved successfully",
                        assessments
                )
        );
    }

    // ================= GET HIGH-RISK ACCOUNTS (ADMIN) =================
    /**
     * GET /security-audit/risky-accounts
     * Returns only AT_RISK or CRITICAL accounts
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/risky-accounts")
    public ResponseEntity<?> getHighRiskAccounts(Authentication auth) {

        List<Map<String, Object>> riskyAccounts = securityAuditService
                .getHighRiskAccounts();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "VIEW_RISKY_ACCOUNTS",
                "SYSTEM",
                "SUCCESS",
                "Admin viewed high-risk accounts (" + riskyAccounts.size() + " found)"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "High-risk accounts retrieved successfully",
                        riskyAccounts
                )
        );
    }

    // ================= EXPORT RISK REPORT (ADMIN) =================
    /**
     * GET /security-audit/export
     * Export risk assessment as CSV
     * Available to: admins only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/export")
    public ResponseEntity<?> exportRiskReport(Authentication auth) {

        String csvContent = securityAuditService.generateRiskReportCsv();

        // Log access
        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "EXPORT_RISK_REPORT",
                "SYSTEM",
                "SUCCESS",
                "Admin exported security risk report"
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=security-risk-report.csv")
                .contentType(new MediaType("text", "csv"))
                .body(csvContent.getBytes(StandardCharsets.UTF_8));
    }

}