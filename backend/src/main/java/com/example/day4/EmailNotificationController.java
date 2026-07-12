package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * ✅ Day 80 — Email Notification Controller
 * REST endpoints for sending alert emails
 */
@RestController
@RequestMapping("/email-alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class EmailNotificationController {

    private final EmailService emailService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public EmailNotificationController(
            EmailService emailService,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    // ================= SEND TEST EMAIL =================
    /**
     * POST /email-alerts/test
     * Send test alert email to user
     * Available to: authenticated users
     */
    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();

        boolean sent = emailService.sendAlertEmail(
                user.getEmail(),
                "TEST_EMAIL",
                "This is a test email to verify your alert notifications are working correctly.",
                "INFO"
        );

        // Log the action
        auditLogService.log(
                email,
                user.getRole(),
                "SEND_TEST_ALERT_EMAIL",
                email,
                sent ? "SUCCESS" : "FAILED",
                "User sent test alert email"
        );

        if (!sent) {
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "message", "Failed to send test email"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "Test email sent successfully to " + user.getEmail(),
                        "email", user.getEmail()
                )
        );
    }

    // ================= SEND HIGH RISK ALERT =================
    /**
     * POST /email-alerts/high-risk
     * Send high risk alert email
     * Available to: authenticated users
     */
    @PostMapping("/high-risk")
    public ResponseEntity<?> sendHighRiskAlert(
            @RequestBody Map<String, Object> request,
            Authentication auth
    ) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();
        Integer riskScore = (Integer) request.get("riskScore");
        String riskLevel = (String) request.get("riskLevel");

        if (riskScore == null || riskLevel == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Missing riskScore or riskLevel"));
        }

        boolean sent = emailService.sendHighRiskAlert(user, riskScore, riskLevel);

        auditLogService.log(
                email,
                user.getRole(),
                "SEND_HIGH_RISK_ALERT_EMAIL",
                email,
                sent ? "SUCCESS" : "FAILED",
                "High risk alert sent - Score: " + riskScore
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", sent,
                        "message", sent ? "High risk alert sent" : "Failed to send alert",
                        "riskScore", riskScore
                )
        );
    }

    // ================= SEND SUSPICIOUS LOGIN ALERT =================
    /**
     * POST /email-alerts/suspicious-login
     * Send suspicious login alert email
     * Available to: authenticated users
     */
    @PostMapping("/suspicious-login")
    public ResponseEntity<?> sendSuspiciousLoginAlert(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();
        boolean sent = emailService.sendSuspiciousLoginAlert(user);

        auditLogService.log(
                email,
                user.getRole(),
                "SEND_SUSPICIOUS_LOGIN_ALERT_EMAIL",
                email,
                sent ? "SUCCESS" : "FAILED",
                "Suspicious login alert sent"
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", sent,
                        "message", sent ? "Suspicious login alert sent" : "Failed to send alert"
                )
        );
    }

    // ================= SEND PASSWORD EXPIRING ALERT =================
    /**
     * POST /email-alerts/password-expiring
     * Send password expiring alert email
     * Available to: authenticated users
     */
    @PostMapping("/password-expiring")
    public ResponseEntity<?> sendPasswordExpiringAlert(
            @RequestBody Map<String, Object> request,
            Authentication auth
    ) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();
        Integer daysOld = (Integer) request.get("daysOld");

        if (daysOld == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Missing daysOld"));
        }

        boolean sent = emailService.sendPasswordExpiringAlert(user, daysOld);

        auditLogService.log(
                email,
                user.getRole(),
                "SEND_PASSWORD_EXPIRING_ALERT_EMAIL",
                email,
                sent ? "SUCCESS" : "FAILED",
                "Password expiring alert sent - Age: " + daysOld + " days"
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", sent,
                        "message", sent ? "Password expiring alert sent" : "Failed to send alert",
                        "daysOld", daysOld
                )
        );
    }

    // ================= SEND BRUTE FORCE ALERT =================
    /**
     * POST /email-alerts/brute-force
     * Send brute force alert email
     * Available to: authenticated users
     */
    @PostMapping("/brute-force")
    public ResponseEntity<?> sendBruteForceAlert(
            @RequestBody Map<String, Object> request,
            Authentication auth
    ) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();
        Integer failedAttempts = (Integer) request.get("failedAttempts");

        if (failedAttempts == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Missing failedAttempts"));
        }

        boolean sent = emailService.sendBruteForceAlert(user, failedAttempts);

        auditLogService.log(
                email,
                user.getRole(),
                "SEND_BRUTE_FORCE_ALERT_EMAIL",
                email,
                sent ? "SUCCESS" : "FAILED",
                "Brute force alert sent - Attempts: " + failedAttempts
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", sent,
                        "message", sent ? "Brute force alert sent" : "Failed to send alert",
                        "failedAttempts", failedAttempts
                )
        );
    }

    // ================= SEND ACCOUNT LOCKED ALERT =================
    /**
     * POST /email-alerts/account-locked
     * Send account locked alert email
     * Available to: authenticated users
     */
    @PostMapping("/account-locked")
    public ResponseEntity<?> sendAccountLockedAlert(Authentication auth) {

        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();
        boolean sent = emailService.sendAccountLockedAlert(user);

        auditLogService.log(
                email,
                user.getRole(),
                "SEND_ACCOUNT_LOCKED_ALERT_EMAIL",
                email,
                sent ? "SUCCESS" : "FAILED",
                "Account locked alert sent"
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", sent,
                        "message", sent ? "Account locked alert sent" : "Failed to send alert"
                )
        );
    }
}