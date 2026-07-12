package com.example.day4;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

/**
 * ✅ Day 81 — User Entity Updated with 2FA Fields
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String adminNote;

    @Column(nullable = true)
    private LocalDateTime lastPasswordChangedAt;

    // ✅ Day 81 — 2FA Fields
    @Column(nullable = true)
    private String totpSecret;

    @Column(nullable = false)
    private boolean twoFactorEnabled = false;

    @Column(columnDefinition = "TEXT", nullable = true)
    private String backupCodes;

    @Column(nullable = true)
    private LocalDateTime twoFactorSetupAt;

    @Column(nullable = true)
    private String phoneNumber;

    @Column(nullable = false)
    private boolean smsVerificationEnabled = false;

    // ================= CONSTRUCTORS =================
    public User() {
    }

    public User(
            Long id,
            String name,
            String email,
            String password,
            String role,
            String status
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.status = status;
        this.twoFactorEnabled = false;
        this.smsVerificationEnabled = false;
    }

    // ================= GETTERS & SETTERS =================
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email.toLowerCase();
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public LocalDateTime getLastPasswordChangedAt() {
        return lastPasswordChangedAt;
    }

    public void setLastPasswordChangedAt(LocalDateTime lastPasswordChangedAt) {
        this.lastPasswordChangedAt = lastPasswordChangedAt;
    }

    // ✅ Day 81 — 2FA Getters & Setters
    public String getTotpSecret() {
        return totpSecret;
    }

    public void setTotpSecret(String totpSecret) {
        this.totpSecret = totpSecret;
    }

    public boolean isTwoFactorEnabled() {
        return twoFactorEnabled;
    }

    public void setTwoFactorEnabled(boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled;
    }

    public String getBackupCodes() {
        return backupCodes;
    }

    public void setBackupCodes(String backupCodes) {
        this.backupCodes = backupCodes;
    }

    public LocalDateTime getTwoFactorSetupAt() {
        return twoFactorSetupAt;
    }

    public void setTwoFactorSetupAt(LocalDateTime twoFactorSetupAt) {
        this.twoFactorSetupAt = twoFactorSetupAt;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public boolean isSmsVerificationEnabled() {
        return smsVerificationEnabled;
    }

    public void setSmsVerificationEnabled(boolean smsVerificationEnabled) {
        this.smsVerificationEnabled = smsVerificationEnabled;
    }
}