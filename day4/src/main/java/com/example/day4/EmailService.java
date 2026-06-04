package com.example.day4;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetPasswordEmail(
            String toEmail,
            String resetLink
    ) {

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo(toEmail);

        message.setSubject(
                "Password Reset Request"
        );

        message.setText(
                "Hello,\n\n" +
                        "Click the link below to reset your password:\n\n" +
                        resetLink +
                        "\n\nThis link expires in 15 minutes."
        );

        mailSender.send(message);
    }
}