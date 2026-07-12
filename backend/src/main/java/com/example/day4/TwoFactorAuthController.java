package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ✅ Day 81 — Two Factor Authentication Controller
 *
 * ✅ Day 89-90 — SECURITY FIX: /2fa/disable previously accepted a password
 * field but never verified it against the user's real password — the
 * original code had a comment literally saying "In production, verify
 * password here" and never did. Fixed using the same passwordEncoder
 * pattern already proven correct in UserProfileService.
 */
@RestController
@RequestMapping("/2fa")
@CrossOrigin(origins = "http://localhost:5173")
public class TwoFactorAuthController {

    private final TwoFactorAuthService twoFactorAuthService;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final SmsService smsService;
    private final PasswordEncoder passwordEncoder;

    public TwoFactorAuthController(
            TwoFactorAuthService twoFactorAuthService,
            UserRepository userRepository,
            AuditLogService auditLogService,
            SmsService smsService,
            PasswordEncoder passwordEncoder
    ) {
        this.twoFactorAuthService = twoFactorAuthService;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.smsService = smsService;
        this.passwordEncoder = passwordEncoder;
    }

    // ================= GET 2FA STATUS =================
    @GetMapping("/status")
    public ResponseEntity<?> get2FAStatus(Authentication auth) {
        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();
        Map<String, Object> status = twoFactorAuthService.get2faStatus(user);

        auditLogService.log(
                email,
                user.getRole(),
                "VIEW_2FA_STATUS",
                email,
                "SUCCESS",
                "User viewed 2FA status"
        );

        return ResponseEntity.ok(
                Map.of("success", true, "data", status)
        );
    }

    // ================= GENERATE TOTP SECRET =================
    @PostMapping("/totp/generate")
    public ResponseEntity<?> generateTotpSecret(Authentication auth) {
        String email = auth.getName();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "User not found"));
        }

        User user = optionalUser.get();

        try {
            Map<String, String> totpData = twoFactorAuthService.generateTotpSecret(email);

            auditLogService.log(
                    email,
                    user.getRole(),
                    "GENERATE_TOTP_SECRET",
                    email,
                    "SUCCESS",
                    "TOTP secret generated for setup"
            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "data", totpData
                    )
            );
        } catch (Exception e) {
            auditLogService.log(
                    email,
                    user.getRole(),
                    "GENERATE_TOTP_SECRET",
                    email,
                    "FAILED",
                    "Error: " + e.getMessage()
            );

            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "message", "Failed to generate TOTP secret"));
        }
    }

    // ================= VERIFY & ENABLE TOTP =================
    @PostMapping("/totp/enable")
    public ResponseEntity<?> enableTotpAuth(
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
        String totpSecret = (String) request.get("totpSecret");
        String totpCode = (String) request.get("totpCode");

        if (totpSecret == null || totpCode == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Missing totpSecret or totpCode"));
        }

        if (!twoFactorAuthService.verifyTotpCode(totpSecret, totpCode)) {
            auditLogService.log(
                    email,
                    user.getRole(),
                    "ENABLE_TOTP",
                    email,
                    "FAILED",
                    "Invalid TOTP code provided"
            );

            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Invalid TOTP code"));
        }

        List<String> backupCodes = twoFactorAuthService.generateBackupCodes();

        twoFactorAuthService.enableTwoFactorAuth(user, totpSecret, backupCodes);

        auditLogService.log(
                email,
                user.getRole(),
                "ENABLE_TOTP",
                email,
                "SUCCESS",
                "Two-factor authentication enabled with TOTP"
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "2FA enabled successfully",
                        "backupCodes", backupCodes
                )
        );
    }

    // ================= VERIFY TOTP CODE (FOR LOGIN) =================
    @PostMapping("/totp/verify")
    public ResponseEntity<?> verifyTotpCode(
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
        String code = (String) request.get("code");

        if (code == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Code is required"));
        }

        boolean isValid = twoFactorAuthService.verifyTotpCode(user.getTotpSecret(), code);

        auditLogService.log(
                email,
                user.getRole(),
                "VERIFY_TOTP",
                email,
                isValid ? "SUCCESS" : "FAILED",
                "TOTP verification " + (isValid ? "successful" : "failed")
        );

        return ResponseEntity.ok(
                Map.of("success", isValid, "message", isValid ? "Verified" : "Invalid code")
        );
    }

    // ================= VERIFY BACKUP CODE =================
    @PostMapping("/backup/verify")
    public ResponseEntity<?> verifyBackupCode(
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
        String code = (String) request.get("code");

        if (code == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Code is required"));
        }

        boolean isValid = twoFactorAuthService.verifyAndConsumeBackupCode(user, code);

        auditLogService.log(
                email,
                user.getRole(),
                "VERIFY_BACKUP_CODE",
                email,
                isValid ? "SUCCESS" : "FAILED",
                "Backup code verification " + (isValid ? "successful" : "failed")
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", isValid,
                        "message", isValid ? "Backup code verified" : "Invalid backup code"
                )
        );
    }

    // ================= SETUP SMS =================
    @PostMapping("/sms/setup")
    public ResponseEntity<?> setupSms(
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
        String phoneNumber = (String) request.get("phoneNumber");

        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Phone number is required"));
        }

        user.setPhoneNumber(phoneNumber);
        userRepository.save(user);

        boolean sent = smsService.sendVerificationCode(phoneNumber, String.format("%06d", (int)(Math.random() * 1000000)));

        auditLogService.log(
                email,
                user.getRole(),
                "SETUP_SMS_2FA",
                email,
                sent ? "SUCCESS" : "FAILED",
                "SMS 2FA setup initiated for " + maskPhone(phoneNumber)
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", sent,
                        "message", sent ? "Verification code sent" : "Failed to send code",
                        "phoneNumber", maskPhone(phoneNumber)
                )
        );
    }

    // ================= DISABLE 2FA =================
    /**
     * ✅ Day 89-90 — SECURITY FIX: now actually verifies the submitted
     * password against the user's real stored password using
     * passwordEncoder.matches() — the same pattern UserProfileService
     * already uses correctly for changePassword/updateEmail/deleteAccount.
     * Previously this only checked a password field was present, not that
     * it was correct, meaning a stolen session token alone was enough to
     * strip 2FA protection from an account.
     */
    @PostMapping("/disable")
    public ResponseEntity<?> disableTwoFactorAuth(
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
        String password = (String) request.get("password");

        if (password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Password is required for confirmation"));
        }

        // ✅ Day 89-90 — Real verification, mirrors UserProfileService exactly
        if (!passwordEncoder.matches(password, user.getPassword())) {

            auditLogService.log(
                    email,
                    user.getRole(),
                    "DISABLE_2FA",
                    email,
                    "FAILED",
                    "Incorrect password provided — 2FA disable blocked"
            );

            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Incorrect password. 2FA disable cancelled."));
        }

        twoFactorAuthService.disableTwoFactorAuth(user);

        auditLogService.log(
                email,
                user.getRole(),
                "DISABLE_2FA",
                email,
                "SUCCESS",
                "Two-factor authentication disabled"
        );

        return ResponseEntity.ok(
                Map.of("success", true, "message", "2FA disabled successfully")
        );
    }

    // ================= HELPER: Mask Phone Number =================
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "****";
        }
        return "*".repeat(phone.length() - 4) + phone.substring(phone.length() - 4);
    }
}