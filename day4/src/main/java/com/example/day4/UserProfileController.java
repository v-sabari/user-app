package com.example.day4;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final AuditLogService auditLogService;

    public UserProfileController(
            UserProfileService userProfileService,
            AuditLogService auditLogService
    ) {
        this.userProfileService = userProfileService;
        this.auditLogService = auditLogService;
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

    // ================= CHANGE PASSWORD =================
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication auth
    ) {

        try {

            userProfileService.changePassword(auth.getName(), request);

            auditLogService.log(
                    auth.getName(), "USER", "CHANGE_PASSWORD",
                    auth.getName(), "SUCCESS",
                    "Password changed successfully — all sessions invalidated"
            );

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Password changed successfully. Please login again.", null
                    )
            );

        } catch (IllegalArgumentException ex) {

            auditLogService.log(
                    auth.getName(), "USER", "CHANGE_PASSWORD",
                    auth.getName(), "FAILED", ex.getMessage()
            );

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

        if (confirmPassword == null || confirmPassword.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Password confirmation is required"));
        }

        try {

            auditLogService.log(
                    auth.getName(), "USER", "DELETE_ACCOUNT",
                    auth.getName(), "SUCCESS",
                    "User self-deleted their account"
            );

            userProfileService.deleteAccount(auth.getName(), confirmPassword);

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Account deleted successfully. You have been logged out.", null
                    )
            );

        } catch (IllegalArgumentException ex) {

            auditLogService.log(
                    auth.getName(), "USER", "DELETE_ACCOUNT",
                    auth.getName(), "FAILED",
                    "Account deletion failed: " + ex.getMessage()
            );

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

    // ================= MY ACTIVITY — Day 65: action + status filter params =================
    @GetMapping("/my-activity")
    public ResponseEntity<?> getMyActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String status,
            Authentication auth
    ) {

        Page<AuditLog> activity =
                userProfileService.getMyActivity(
                        auth.getName(), page, size, action, status
                );

        return ResponseEntity.ok(
                ApiResponse.success("Activity fetched successfully", activity)
        );
    }
}