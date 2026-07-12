package com.example.day4;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    // ✅ Reset link base URL — frontend reset password page
    private static final String RESET_BASE_URL =
            "http://localhost:5173/reset-password?token=";

    // ✅ Token validity: 15 minutes
    private static final int TOKEN_EXPIRY_MINUTES = 15;

    public UserService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    // ================= FORGOT PASSWORD =================
    public void forgotPassword(String email) {

        User user = userRepository.findByEmail(
                email.toLowerCase()
        ).orElse(null);

        // ✅ Always return success to prevent email enumeration attacks
        // Do NOT tell the client whether the email exists or not
        if (user == null) {
            return;
        }

        // ✅ Delete any existing reset token for this user
        passwordResetTokenRepository.deleteByUser(user);

        // ✅ Generate new unique token
        String token = UUID.randomUUID().toString();

        LocalDateTime expiry =
                LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES);

        PasswordResetToken resetToken =
                new PasswordResetToken(token, user, expiry);

        passwordResetTokenRepository.save(resetToken);

        // ✅ Build reset link and send email
        String resetLink = RESET_BASE_URL + token;

        emailService.sendResetPasswordEmail(
                user.getEmail(),
                resetLink
        );

        auditLogService.log(
                user.getEmail(),
                user.getRole(),
                "FORGOT_PASSWORD",
                user.getEmail(),
                "SUCCESS",
                "Password reset email sent successfully"
        );
    }

    // ================= RESET PASSWORD =================
    public void resetPassword(
            String token,
            String newPassword,
            String confirmPassword
    ) {

        // ✅ Validate passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException(
                    "New password and confirm password do not match"
            );
        }

        // ✅ Find token
        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByToken(token)
                        .orElse(null);

        if (resetToken == null) {
            throw new IllegalArgumentException(
                    "Invalid or expired reset token"
            );
        }

        // ✅ Check expiry
        if (resetToken.isExpired()) {

            passwordResetTokenRepository.delete(resetToken);

            throw new IllegalArgumentException(
                    "Reset token has expired. Please request a new one."
            );
        }

        User user = resetToken.getUser();

        // ✅ Update password
        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        // ✅ Delete used token
        passwordResetTokenRepository.delete(resetToken);

        auditLogService.log(
                user.getEmail(),
                user.getRole(),
                "RESET_PASSWORD",
                user.getEmail(),
                "SUCCESS",
                "Password reset successfully via email token"
        );
    }
}