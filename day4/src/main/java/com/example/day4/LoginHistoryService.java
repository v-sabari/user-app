package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * ✅ Day 82 — Login History Service
 * Tracks and analyzes user login patterns
 */
@Service
public class LoginHistoryService {

    private final LoginHistoryRepository loginHistoryRepository;

    public LoginHistoryService(LoginHistoryRepository loginHistoryRepository) {
        this.loginHistoryRepository = loginHistoryRepository;
    }

    // ================= LOG LOGIN =================
    /**
     * Record a login attempt
     */
    public LoginHistory logLogin(
            String userEmail,
            String ipAddress,
            String userAgent,
            String deviceType,
            String browser,
            String operatingSystem,
            String status,
            String failureReason
    ) {
        LoginHistory history = new LoginHistory();

        history.setUserEmail(userEmail);
        history.setIpAddress(ipAddress);
        history.setUserAgent(userAgent);
        history.setDeviceType(deviceType);
        history.setBrowser(browser);
        history.setOperatingSystem(operatingSystem);

        history.setStatus(status);
        history.setFailureReason(failureReason);

        history.setLoginTime(LocalDateTime.now());
        history.setSuspicious(false);

        return loginHistoryRepository.save(history);
    }

    // ================= LOG LOGOUT =================
    /**
     * Record logout time
     */
    public void logLogout(String userEmail) {
        Pageable pageable = PageRequest.of(0, 1);
        List<LoginHistory> result = loginHistoryRepository
                .getLastSuccessfulLogin(userEmail, pageable);

        if (!result.isEmpty()) {
            LoginHistory history = result.get(0);
            history.setLogoutTime(LocalDateTime.now());
            loginHistoryRepository.save(history);
        }
    }

    // ================= GET USER LOGIN HISTORY =================
    /**
     * Paginated login history for a user
     */
    public Page<LoginHistory> getUserLoginHistory(
            String userEmail,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return loginHistoryRepository
                .findByUserEmailOrderByLoginTimeDesc(userEmail, pageable);
    }

    // ================= GET RECENT LOGINS =================
    /**
     * Get last N logins for a user
     */
    public List<LoginHistory> getRecentLogins(String userEmail, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return loginHistoryRepository
                .getLastSuccessfulLogin(userEmail, pageable);
    }

    // ================= GET LOGIN STATS =================
    /**
     * Get login statistics for a user
     */
    public LoginStatsResponse getLoginStats(String userEmail) {
        long totalLogins = loginHistoryRepository.countByUserEmail(userEmail);
        long successfulLogins = loginHistoryRepository.countSuccessfulLogins(userEmail);
        long failedLogins = loginHistoryRepository.countFailedLogins(userEmail);

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long failedLast24 = loginHistoryRepository.countRecentFailedLogins(userEmail, since);

        long suspiciousLogins = loginHistoryRepository.countSuspiciousLogins(userEmail);

        // Get last successful login
        Pageable pageable = PageRequest.of(0, 1);
        List<LoginHistory> lastLogins = loginHistoryRepository
                .getLastSuccessfulLogin(userEmail, pageable);

        LocalDateTime lastLoginTime = null;
        if (!lastLogins.isEmpty()) {
            lastLoginTime = lastLogins.get(0).getLoginTime();
        }

        return new LoginStatsResponse(
                totalLogins,
                successfulLogins,
                failedLogins,
                failedLast24,
                suspiciousLogins,
                lastLoginTime
        );
    }

    // ================= DETECT SUSPICIOUS LOGIN =================
    /**
     * Analyze login and detect suspicious patterns
     */
    public void detectSuspiciousLogin(
            LoginHistory history,
            List<LoginHistory> previousLogins
    ) {
        // Check for new IP
        boolean newIp = previousLogins.stream()
                .noneMatch(l -> l.getIpAddress().equals(history.getIpAddress()));

        // Check for new device
        boolean newDevice = previousLogins.stream()
                .noneMatch(l -> l.getDeviceType().equals(history.getDeviceType()));

        // Check for unusual time
        boolean unusualTime = false;
        if (!previousLogins.isEmpty()) {
            LocalDateTime lastLogin = previousLogins.get(0).getLoginTime();
            if (lastLogin != null) {
                long hoursDiff = java.time.temporal.ChronoUnit.HOURS
                        .between(lastLogin, history.getLoginTime());
                unusualTime = hoursDiff < 1; // Login within 1 hour of previous
            }
        }

        if (newIp || newDevice || unusualTime) {
            history.setSuspicious(true);

            StringBuilder reason = new StringBuilder();
            if (newIp) reason.append("New IP detected. ");
            if (newDevice) reason.append("New device detected. ");
            if (unusualTime) reason.append("Unusual login time. ");

            history.setSuspicionReason(reason.toString().trim());
        }

        loginHistoryRepository.save(history);
    }

    // ================= GET DEVICE LOGINS =================
    /**
     * Get logins from a specific device type
     */
    public List<LoginHistory> getDeviceLogins(String userEmail, String deviceType) {
        return loginHistoryRepository
                .findByUserEmailAndDeviceType(userEmail, deviceType);
    }

    // ================= GET IP LOGINS =================
    /**
     * Get logins from a specific IP address
     */
    public List<LoginHistory> getIpLogins(String userEmail, String ipAddress) {
        return loginHistoryRepository
                .findByUserEmailAndIpAddress(userEmail, ipAddress);
    }

    // ================= ADMIN: ALL LOGIN HISTORY =================
    /**
     * Admin view: all logins system-wide
     */
    public Page<LoginHistory> getAllLoginHistory(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return loginHistoryRepository.findAllByOrderByLoginTimeDesc(pageable);
    }

    // ================= ADMIN: FILTER BY EMAIL =================
    /**
     * Admin search: find logins by user email
     */
    public Page<LoginHistory> searchByEmail(String userEmail, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return loginHistoryRepository
                .findByUserEmailContainingIgnoreCaseOrderByLoginTimeDesc(userEmail, pageable);
    }

    // ================= ADMIN: FILTER BY STATUS =================
    /**
     * Admin filter: successful or failed logins
     */
    public Page<LoginHistory> filterByStatus(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return loginHistoryRepository
                .findByStatusOrderByLoginTimeDesc(status, pageable);
    }

    // ================= ADMIN: SUSPICIOUS LOGINS =================
    /**
     * Admin view: all suspicious logins
     */
    public Page<LoginHistory> getSuspiciousLogins(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return loginHistoryRepository
                .findByIsSuspiciousOrderByLoginTimeDesc(true, pageable);
    }

    // ================= EXTRACT BROWSER INFO =================
    /**
     * Simple browser detection from User-Agent
     */
    public String extractBrowser(String userAgent) {
        if (userAgent == null) return "Unknown";

        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Safari")) return "Safari";
        if (userAgent.contains("Edge")) return "Edge";
        if (userAgent.contains("Opera")) return "Opera";

        return "Other";
    }

    // ================= EXTRACT OS INFO =================
    /**
     * Simple OS detection from User-Agent
     */
    public String extractOperatingSystem(String userAgent) {
        if (userAgent == null) return "Unknown";

        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Mac")) return "macOS";
        if (userAgent.contains("Linux")) return "Linux";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";

        return "Other";
    }

    // ================= EXTRACT DEVICE TYPE =================
    /**
     * Detect device type from User-Agent
     */
    public String extractDeviceType(String userAgent) {
        if (userAgent == null) return "UNKNOWN";

        if (userAgent.contains("Mobile") || userAgent.contains("Android")
                || userAgent.contains("iPhone") || userAgent.contains("iPad")) {
            return "MOBILE";
        }

        return "DESKTOP";
    }

    // ================= LOGIN STATS RESPONSE CLASS =================
    public static class LoginStatsResponse {
        public long totalLogins;
        public long successfulLogins;
        public long failedLogins;
        public long failedLast24Hours;
        public long suspiciousLogins;
        public LocalDateTime lastLoginTime;

        public LoginStatsResponse(
                long totalLogins,
                long successfulLogins,
                long failedLogins,
                long failedLast24Hours,
                long suspiciousLogins,
                LocalDateTime lastLoginTime
        ) {
            this.totalLogins = totalLogins;
            this.successfulLogins = successfulLogins;
            this.failedLogins = failedLogins;
            this.failedLast24Hours = failedLast24Hours;
            this.suspiciousLogins = suspiciousLogins;
            this.lastLoginTime = lastLoginTime;
        }
    }
}