package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionService userSessionService;

    public UserProfileService(
            UserRepository userRepository,
            UserSessionRepository userSessionRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            UserSessionService userSessionService
    ) {
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSessionService = userSessionService;
    }

    // ================= GET PROFILE =================
    public UserProfileResponse getProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }

    // ================= UPDATE PROFILE (NAME ONLY) =================
    public UserProfileResponse updateProfile(
            String email,
            UpdateProfileRequest request
    ) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        user.setName(request.getName());
        User saved = userRepository.save(user);

        return new UserProfileResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getStatus()
        );
    }

    // ================= UPDATE EMAIL (Day 69) =================
    public void updateEmail(String currentEmail, String newEmail, String confirmPassword) {

        // ✅ Normalize email
        String normalizedNew = newEmail.trim().toLowerCase();

        // ✅ Cannot set to same email
        if (normalizedNew.equals(currentEmail.toLowerCase())) {
            throw new IllegalArgumentException(
                    "New email is the same as your current email"
            );
        }

        // ✅ Check email not already taken
        if (userRepository.existsByEmail(normalizedNew)) {
            throw new IllegalArgumentException(
                    "This email address is already in use by another account"
            );
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        // ✅ Verify password before changing email
        if (!passwordEncoder.matches(confirmPassword, user.getPassword())) {
            throw new IllegalArgumentException(
                    "Incorrect password. Email update cancelled."
            );
        }

        user.setEmail(normalizedNew);
        userRepository.save(user);

        // ✅ Invalidate all sessions — JWT identity has changed
        userSessionService.invalidateAllSessions(currentEmail);
        userSessionService.invalidateAllSessions(normalizedNew);
    }

    // ================= CHANGE PASSWORD =================
    public void changePassword(String email, ChangePasswordRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        userSessionService.invalidateAllSessions(email);
    }

    // ================= DELETE ACCOUNT =================
    public void deleteAccount(String email, String confirmPassword) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        if (!passwordEncoder.matches(confirmPassword, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password. Account deletion cancelled.");
        }

        userSessionService.invalidateAllSessions(email);
        userRepository.delete(user);
    }

    // ================= PERSONAL SECURITY SUMMARY =================
    public SecuritySummaryResponse getSecuritySummary(String email) {

        List<UserSession> allSessions =
                userSessionRepository.findByUserEmail(email);

        int totalSessions = allSessions.size();

        int activeSessions = (int) allSessions.stream()
                .filter(UserSession::isActive)
                .count();

        int suspiciousSessions = (int) allSessions.stream()
                .filter(s -> s.isActive() && s.isSuspicious())
                .count();

        List<String> devicesUsed = allSessions.stream()
                .map(UserSession::getDeviceType)
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .collect(Collectors.toList());

        LocalDateTime lastLoginTime = allSessions.stream()
                .map(UserSession::getCreatedAt)
                .filter(t -> t != null)
                .max(Comparator.naturalOrder())
                .orElse(null);

        List<String> recentActions = auditLogRepository
                .findTop5ByActorEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(AuditLog::getAction)
                .collect(Collectors.toList());

        String riskLevel;
        if (suspiciousSessions >= 2) {
            riskLevel = "HIGH";
        } else if (suspiciousSessions >= 1) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        return new SecuritySummaryResponse(
                totalSessions,
                activeSessions,
                suspiciousSessions,
                devicesUsed,
                lastLoginTime,
                recentActions,
                riskLevel
        );
    }

    // ================= MY ACTIVITY =================
    public Page<AuditLog> getMyActivity(
            String email,
            int page,
            int size,
            String action,
            String status
    ) {

        Pageable pageable = PageRequest.of(
                page, size, Sort.by("createdAt").descending()
        );

        String safeAction = action == null ? "" : action.trim();
        String safeStatus = status == null ? "" : status.trim();

        if (!safeAction.isEmpty() || !safeStatus.isEmpty()) {
            return auditLogRepository.findByActorEmailWithFilters(
                    email, safeAction, safeStatus, pageable
            );
        }

        return auditLogRepository.findByActorEmailOrderByCreatedAtDesc(email, pageable);
    }
}