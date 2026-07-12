package com.example.day4;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;

    public UserProfileController(
            UserProfileService userProfileService,
            AuditLogService auditLogService,
            AuditLogRepository auditLogRepository
    ) {
        this.userProfileService = userProfileService;
        this.auditLogService = auditLogService;
        this.auditLogRepository = auditLogRepository;
    }

    // ================= GET PROFILE =================
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {

        UserProfileResponse profile =
                userProfileService.getProfile(auth.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched successfully", profile)
        );
    }

    // ================= UPDATE PROFILE (NAME) =================
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth
    ) {

        try {

            UserProfileResponse updated =
                    userProfileService.updateProfile(auth.getName(), request);

            auditLogService.log(
                    auth.getName(), "USER", "UPDATE_PROFILE",
                    auth.getName(), "SUCCESS",
                    "Profile name updated to: " + request.getName()
            );

            return ResponseEntity.ok(
                    ApiResponse.success("Profile updated successfully", updated)
            );

        } catch (IllegalArgumentException ex) {

            auditLogService.log(
                    auth.getName(), "USER", "UPDATE_PROFILE",
                    auth.getName(), "FAILED", ex.getMessage()
            );

            return ResponseEntity.badRequest().body(ErrorResponse.of(ex.getMessage()));
        }
    }

    // ================= UPDATE EMAIL =================
    @PutMapping("/email")
    public ResponseEntity<?> updateEmail(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {

        String newEmail = body == null ? null : body.get("newEmail");
        String confirmPassword = body == null ? null : body.get("confirmPassword");

        if (newEmail == null || newEmail.isBlank())
            return ResponseEntity.badRequest().body(ErrorResponse.of("New email is required"));

        if (confirmPassword == null || confirmPassword.isBlank())
            return ResponseEntity.badRequest().body(ErrorResponse.of("Password confirmation is required"));

        if (!newEmail.contains("@") || !newEmail.contains("."))
            return ResponseEntity.badRequest().body(ErrorResponse.of("Please enter a valid email address"));

        try {

            userProfileService.updateEmail(auth.getName(), newEmail, confirmPassword);

            auditLogService.log(auth.getName(), "USER", "UPDATE_EMAIL",
                    auth.getName(), "SUCCESS",
                    "Email updated to: " + newEmail.trim().toLowerCase());

            return ResponseEntity.ok(ApiResponse.success(
                    "Email updated successfully. Please login again with your new email.", null));

        } catch (IllegalArgumentException ex) {

            auditLogService.log(auth.getName(), "USER", "UPDATE_EMAIL",
                    auth.getName(), "FAILED", "Email update failed: " + ex.getMessage());

            return ResponseEntity.badRequest().body(ErrorResponse.of(ex.getMessage()));
        }
    }

    // ================= CHANGE PASSWORD =================
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication auth
    ) {

        try {

            userProfileService.changePassword(auth.getName(), request);

            auditLogService.log(auth.getName(), "USER", "CHANGE_PASSWORD",
                    auth.getName(), "SUCCESS",
                    "Password changed successfully — all sessions invalidated");

            return ResponseEntity.ok(ApiResponse.success(
                    "Password changed successfully. Please login again.", null));

        } catch (IllegalArgumentException ex) {

            auditLogService.log(auth.getName(), "USER", "CHANGE_PASSWORD",
                    auth.getName(), "FAILED", ex.getMessage());

            return ResponseEntity.badRequest().body(ErrorResponse.of(ex.getMessage()));
        }
    }

    // ================= DELETE ACCOUNT =================
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {

        String confirmPassword = body == null ? null : body.get("confirmPassword");

        if (confirmPassword == null || confirmPassword.isBlank())
            return ResponseEntity.badRequest().body(ErrorResponse.of("Password confirmation is required"));

        try {

            auditLogService.log(auth.getName(), "USER", "DELETE_ACCOUNT",
                    auth.getName(), "SUCCESS", "User self-deleted their account");

            userProfileService.deleteAccount(auth.getName(), confirmPassword);

            return ResponseEntity.ok(ApiResponse.success(
                    "Account deleted successfully. You have been logged out.", null));

        } catch (IllegalArgumentException ex) {

            auditLogService.log(auth.getName(), "USER", "DELETE_ACCOUNT",
                    auth.getName(), "FAILED", "Account deletion failed: " + ex.getMessage());

            return ResponseEntity.badRequest().body(ErrorResponse.of(ex.getMessage()));
        }
    }

    // ================= PERSONAL SECURITY SUMMARY =================
    @GetMapping("/security-summary")
    public ResponseEntity<?> getSecuritySummary(Authentication auth) {

        SecuritySummaryResponse summary =
                userProfileService.getSecuritySummary(auth.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Security summary fetched successfully", summary)
        );
    }

    // ✅ Day 73 — PERSONAL LOGIN STATS =================
    @GetMapping("/login-stats")
    public ResponseEntity<?> getLoginStats(Authentication auth) {

        String email = auth.getName();

        // Total successful logins
        long totalLogins = auditLogRepository.countSuccessfulLoginsByEmail(email);

        // Failed logins in last 7 days
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long recentFailedLogins = auditLogRepository.countRecentFailedLogins(email, sevenDaysAgo);

        // Total actions ever recorded for this user
        long totalActions = auditLogRepository.countByActorEmail(email);

        // Most recent successful login
        List<AuditLog> recentLogins = auditLogRepository.findRecentSuccessfulLogins(
                email, PageRequest.of(0, 1)
        );
        Object lastLoginAt = recentLogins.isEmpty() ? null : recentLogins.get(0).getCreatedAt();

        // ✅ Security health score
        String healthStatus;
        if (recentFailedLogins >= 5) {
            healthStatus = "AT_RISK";
        } else if (recentFailedLogins >= 2) {
            healthStatus = "CAUTION";
        } else {
            healthStatus = "HEALTHY";
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLogins", totalLogins);
        stats.put("recentFailedLogins", recentFailedLogins);
        stats.put("totalActions", totalActions);
        stats.put("lastLoginAt", lastLoginAt);
        stats.put("healthStatus", healthStatus);

        return ResponseEntity.ok(ApiResponse.success("Login stats fetched", stats));
    }

    // ================= MY ACTIVITY =================
    @GetMapping("/my-activity")
    public ResponseEntity<?> getMyActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String status,
            Authentication auth
    ) {

        Page<AuditLog> activity =
                userProfileService.getMyActivity(auth.getName(), page, size, action, status);

        return ResponseEntity.ok(
                ApiResponse.success("Activity fetched successfully", activity)
        );
    }
}