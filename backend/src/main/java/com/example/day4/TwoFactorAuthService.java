package com.example.day4;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * ✅ Day 81 — Two Factor Authentication Service
 * TOTP (Google Authenticator) + SMS + Backup Codes
 */
@Service
public class TwoFactorAuthService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final SmsService smsService;

    public TwoFactorAuthService(
            UserRepository userRepository,
            AuditLogService auditLogService,
            SmsService smsService
    ) {
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.smsService = smsService;
    }

    // ================= GENERATE TOTP SECRET =================
    /**
     * Generate a new TOTP secret for user
     * Returns QR code and secret
     */
    public Map<String, String> generateTotpSecret(String email) {
        try {
            String secret = new DefaultSecretGenerator().generate();

            // Build QR code data
            QrData qrData = new QrData.Builder()
                    .label(email)
                    .secret(secret)
                    .issuer("Your App Name")
                    .digits(6)
                    .period(30)
                    .build();

            // Generate QR code as PNG
            QrGenerator qrGenerator = new ZxingPngQrGenerator();
            byte[] imageData = qrGenerator.generate(qrData);

            // Convert to base64
            String qrCodeBase64 = Base64.getEncoder().encodeToString(imageData);

            return Map.of(
                    "secret", secret,
                    "qrCode", "data:image/png;base64," + qrCodeBase64
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate TOTP secret: " + e.getMessage());
        }
    }

    // ================= VERIFY TOTP CODE =================
    /**
     * Verify TOTP code (from Google Authenticator)
     */
    public boolean verifyTotpCode(String secret, String code) {
        try {
            CodeGenerator codeGenerator = new DefaultCodeGenerator();
            TimeProvider timeProvider = new SystemTimeProvider();

            // Get current code and verify
            String currentCode = codeGenerator.generate(secret, timeProvider.getTime());

            // Allow 30 second window (1 code before and after)
            String previousCode = codeGenerator.generate(secret, timeProvider.getTime() - 30);
            String nextCode = codeGenerator.generate(secret, timeProvider.getTime() + 30);

            return code.equals(currentCode) || code.equals(previousCode) || code.equals(nextCode);
        } catch (Exception e) {
            return false;
        }
    }

    // ================= GENERATE BACKUP CODES =================
    /**
     * Generate 10 backup codes (8 characters each)
     */
    public List<String> generateBackupCodes() {
        List<String> codes = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < 10; i++) {
            StringBuilder code = new StringBuilder();
            for (int j = 0; j < 8; j++) {
                code.append(String.format("%04d", random.nextInt(10000)).charAt(0));
            }
            codes.add(code.toString().toUpperCase());
        }

        return codes;
    }

    // ================= VERIFY BACKUP CODE =================
    /**
     * Verify backup code and mark as used
     */
    public boolean verifyAndConsumeBackupCode(User user, String code) {
        String backupCodes = user.getBackupCodes();
        if (backupCodes == null || backupCodes.isEmpty()) {
            return false;
        }

        List<String> codes = Arrays.asList(backupCodes.split(","));

        if (codes.contains(code.toUpperCase())) {
            // Remove the used code
            codes.remove(code.toUpperCase());
            user.setBackupCodes(String.join(",", codes));
            userRepository.save(user);
            return true;
        }

        return false;
    }

    // ================= SEND SMS CODE =================
    /**
     * Send SMS verification code to user
     */
    public boolean sendSmsVerificationCode(User user) {
        if (user.getPhoneNumber() == null || user.getPhoneNumber().isEmpty()) {
            return false;
        }

        // Generate 6-digit code
        String code = String.format("%06d", new Random().nextInt(1000000));

        // Send via SMS service
        boolean sent = smsService.sendSms(
                user.getPhoneNumber(),
                String.format("Your verification code is: %s. Valid for 5 minutes.", code)
        );

        if (sent) {
            // Store code in cache (implementation detail - use Redis or similar)
            // For now, we'll just return true
            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "SMS_2FA_CODE_SENT",
                    user.getEmail(),
                    "SUCCESS",
                    "SMS verification code sent to " + maskPhoneNumber(user.getPhoneNumber())
            );
        }

        return sent;
    }

    // ================= ENABLE 2FA FOR USER =================
    /**
     * Enable 2FA with TOTP secret and backup codes
     */
    public void enableTwoFactorAuth(User user, String totpSecret, List<String> backupCodes) {
        user.setTotpSecret(totpSecret);
        user.setTwoFactorEnabled(true);
        user.setBackupCodes(String.join(",", backupCodes));
        user.setTwoFactorSetupAt(java.time.LocalDateTime.now());

        userRepository.save(user);

        auditLogService.log(
                user.getEmail(),
                user.getRole(),
                "ENABLE_2FA",
                user.getEmail(),
                "SUCCESS",
                "Two-factor authentication enabled with TOTP"
        );
    }

    // ================= DISABLE 2FA FOR USER =================
    /**
     * Disable 2FA completely
     */
    public void disableTwoFactorAuth(User user) {
        user.setTotpSecret(null);
        user.setTwoFactorEnabled(false);
        user.setBackupCodes(null);
        user.setTwoFactorSetupAt(null);
        user.setSmsVerificationEnabled(false);

        userRepository.save(user);

        auditLogService.log(
                user.getEmail(),
                user.getRole(),
                "DISABLE_2FA",
                user.getEmail(),
                "SUCCESS",
                "Two-factor authentication disabled"
        );
    }

    // ================= GET 2FA STATUS =================
    /**
     * Get user's 2FA status
     */
    public Map<String, Object> get2faStatus(User user) {
        return Map.of(
                "twoFactorEnabled", user.isTwoFactorEnabled(),
                "totpEnabled", user.getTotpSecret() != null,
                "smsEnabled", user.isSmsVerificationEnabled(),
                "phoneNumber", user.getPhoneNumber() != null ? maskPhoneNumber(user.getPhoneNumber()) : null,
                "backupCodesRemaining", user.getBackupCodes() != null ? user.getBackupCodes().split(",").length : 0,
                "setupDate", user.getTwoFactorSetupAt()
        );
    }

    // ================= HELPER: Mask Phone Number =================
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "****";
        }
        return "*".repeat(phoneNumber.length() - 4) + phoneNumber.substring(phoneNumber.length() - 4);
    }
}