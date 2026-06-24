package com.example.day4;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * ✅ Email Service (Updated Day 80)
 * Handles password reset + security alert emails
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    public EmailService(JavaMailSender mailSender, UserRepository userRepository) {
        this.mailSender = mailSender;
        this.userRepository = userRepository;
    }

    // ================= EXISTING: PASSWORD RESET =================
    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Password Reset Request");
        message.setText(
                "Hello,\n\n" +
                        "Click the link below to reset your password:\n\n" +
                        resetLink +
                        "\n\nThis link expires in 15 minutes."
        );
        mailSender.send(message);
    }

    // ================= DAY 80: SEND ALERT EMAIL =================
    public boolean sendAlertEmail(String recipientEmail, String alertType, String message, String severity) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(recipientEmail);
            helper.setSubject(getSeverityIcon(severity) + " Security Alert: " + alertType);
            helper.setText(buildAlertEmailContent(alertType, message, severity), true);
            helper.setFrom("security-alerts@yourapp.com");

            mailSender.send(mimeMessage);
            return true;
        } catch (MessagingException e) {
            System.err.println("Failed to send alert email: " + e.getMessage());
            return false;
        }
    }

    // ================= DAY 80: HIGH RISK ALERT =================
    public boolean sendHighRiskAlert(User user, int riskScore, String riskLevel) {
        String message = String.format(
                "Your account risk score has increased to %d (%s). Please review your security settings immediately.",
                riskScore, riskLevel
        );
        return sendAlertEmail(user.getEmail(), "HIGH_RISK", message, "CRITICAL");
    }

    // ================= DAY 80: SUSPICIOUS LOGIN ALERT =================
    public boolean sendSuspiciousLoginAlert(User user) {
        String message = "A login was detected from a new device or location. If this wasn't you, change your password immediately.";
        return sendAlertEmail(user.getEmail(), "SUSPICIOUS_LOGIN", message, "HIGH");
    }

    // ================= DAY 80: PASSWORD EXPIRING ALERT =================
    public boolean sendPasswordExpiringAlert(User user, int daysOld) {
        String message = String.format(
                "Your password is %d days old. We recommend changing it every 90 days for security.",
                daysOld
        );
        return sendAlertEmail(user.getEmail(), "PASSWORD_EXPIRING", message, "MEDIUM");
    }

    // ================= DAY 80: BRUTE FORCE ALERT =================
    public boolean sendBruteForceAlert(User user, int failedAttempts) {
        String message = String.format(
                "Detected %d failed login attempts in the last 15 minutes. If this wasn't you, change your password immediately.",
                failedAttempts
        );
        return sendAlertEmail(user.getEmail(), "BRUTE_FORCE", message, "CRITICAL");
    }

    // ================= DAY 80: ACCOUNT LOCKED ALERT =================
    public boolean sendAccountLockedAlert(User user) {
        String message = "Your account has been locked due to multiple failed login attempts. Contact support to unlock it.";
        return sendAlertEmail(user.getEmail(), "ACCOUNT_LOCKED", message, "CRITICAL");
    }

    // ================= BUILD ALERT EMAIL CONTENT =================
    private String buildAlertEmailContent(String alertType, String message, String severity) {
        String severityColor = getSeverityColor(severity);
        String icon = getSeverityIcon(severity);

        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                            background-color: #f3f4f6;
                            margin: 0;
                            padding: 0;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background: white;
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        .header {
                            background-color: %s;
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
                        }
                        .header-icon {
                            font-size: 48px;
                            margin-bottom: 10px;
                        }
                        .header-title {
                            font-size: 24px;
                            font-weight: 700;
                            margin: 0;
                            color: white;
                        }
                        .header-subtitle {
                            font-size: 14px;
                            margin: 8px 0 0;
                            opacity: 0.95;
                        }
                        .content {
                            padding: 30px 20px;
                        }
                        .alert-box {
                            background-color: #f9fafb;
                            border-left: 4px solid %s;
                            padding: 20px;
                            margin-bottom: 20px;
                            border-radius: 4px;
                        }
                        .alert-message {
                            font-size: 15px;
                            line-height: 1.6;
                            color: #374151;
                            margin: 0;
                        }
                        .action-section {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #e5e7eb;
                        }
                        .action-title {
                            font-weight: 600;
                            color: #111827;
                            margin-bottom: 10px;
                        }
                        .action-list {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                        }
                        .action-list li {
                            padding: 8px 0;
                            color: #6b7280;
                            font-size: 14px;
                        }
                        .button {
                            display: inline-block;
                            background-color: %s;
                            color: white;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: 600;
                            margin-top: 15px;
                            font-size: 14px;
                        }
                        .footer {
                            background-color: #f3f4f6;
                            padding: 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #6b7280;
                            border-top: 1px solid #e5e7eb;
                        }
                        .footer-text {
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="header-icon">%s</div>
                            <h1 class="header-title">%s</h1>
                            <p class="header-subtitle">Severity: <strong>%s</strong></p>
                        </div>

                        <div class="content">
                            <div class="alert-box">
                                <p class="alert-message">%s</p>
                            </div>

                            <div class="action-section">
                                <div class="action-title">What you should do:</div>
                                <ul class="action-list">
                                    <li>✓ Review your security settings</li>
                                    <li>✓ Check your recent activity</li>
                                    <li>✓ Change your password if needed</li>
                                    <li>✓ Enable two-factor authentication</li>
                                </ul>
                            </div>

                            <a href="http://localhost:5173/security-alerts" class="button">View All Alerts</a>
                        </div>

                        <div class="footer">
                            <p class="footer-text">This is an automated security alert. Please do not reply to this email.</p>
                            <p class="footer-text">If you didn't authorize this action, please change your password immediately.</p>
                            <p class="footer-text">&copy; 2026 Your Security Team. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, severityColor, severityColor, severityColor, icon, alertType, severity, message);
    }

    // ================= HELPER: Get Severity Color =================
    private String getSeverityColor(String severity) {
        return switch (severity) {
            case "CRITICAL" -> "#dc2626";
            case "HIGH" -> "#ea580c";
            case "MEDIUM" -> "#d97706";
            default -> "#6b7280";
        };
    }

    // ================= HELPER: Get Severity Icon =================
    private String getSeverityIcon(String severity) {
        return switch (severity) {
            case "CRITICAL" -> "🔴";
            case "HIGH" -> "🟠";
            case "MEDIUM" -> "🟡";
            default -> "ℹ️";
        };
    }
}