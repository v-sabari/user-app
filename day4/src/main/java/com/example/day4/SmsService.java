package com.example.day4;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * ✅ Day 81 — SMS Service using Twilio
 * Sends SMS verification codes for 2FA
 */
@Service
public class SmsService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    // Initialize Twilio (called once on app startup)
    private void initTwilio() {
        if (accountSid != null && !accountSid.isEmpty()) {
            Twilio.init(accountSid, authToken);
        }
    }

    // ================= SEND SMS =================
    /**
     * Send SMS message to phone number
     */
    public boolean sendSms(String toPhoneNumber, String message) {
        try {
            // Initialize Twilio with credentials
            initTwilio();

            // Validate phone number
            if (toPhoneNumber == null || toPhoneNumber.isEmpty()) {
                System.err.println("Phone number is required");
                return false;
            }

            // Ensure phone number starts with +
            if (!toPhoneNumber.startsWith("+")) {
                toPhoneNumber = "+91" + toPhoneNumber; // Default to India
            }

            // Send message via Twilio
            Message smsMessage = Message.creator(
                    new PhoneNumber(toPhoneNumber),      // To number
                    new PhoneNumber(twilioPhoneNumber),  // From number
                    message                              // Message text
            ).create();

            System.out.println("SMS sent successfully. SID: " + smsMessage.getSid());
            return true;

        } catch (Exception e) {
            System.err.println("Failed to send SMS: " + e.getMessage());
            return false;
        }
    }

    // ================= SEND VERIFICATION CODE =================
    /**
     * Send verification code SMS
     */
    public boolean sendVerificationCode(String phoneNumber, String code) {
        String message = String.format(
                "Your verification code is: %s\nValid for 5 minutes.\nDo not share this code with anyone.",
                code
        );
        return sendSms(phoneNumber, message);
    }

    // ================= SEND 2FA CODE =================
    /**
     * Send 2FA verification code SMS
     */
    public boolean send2FACode(String phoneNumber, String code) {
        String message = String.format(
                "Your two-factor authentication code is: %s\nValid for 5 minutes.",
                code
        );
        return sendSms(phoneNumber, message);
    }

    // ================= SEND LOGIN ALERT =================
    /**
     * Send suspicious login alert SMS
     */
    public boolean sendLoginAlert(String phoneNumber) {
        String message = "Alert: New login detected on your account. If this wasn't you, change your password immediately.";
        return sendSms(phoneNumber, message);
    }
}