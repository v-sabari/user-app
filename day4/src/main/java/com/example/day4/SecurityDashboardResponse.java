package com.example.day4;

public class SecurityDashboardResponse {

    private long totalLogs;
    private long successfulLogins;
    private long failedLogins;
    private long suspiciousLogins;
    private long passwordChanges;
    private long activeSessions;

    public SecurityDashboardResponse(
            long totalLogs,
            long successfulLogins,
            long failedLogins,
            long suspiciousLogins,
            long passwordChanges,
            long activeSessions
    ) {
        this.totalLogs = totalLogs;
        this.successfulLogins = successfulLogins;
        this.failedLogins = failedLogins;
        this.suspiciousLogins = suspiciousLogins;
        this.passwordChanges = passwordChanges;
        this.activeSessions = activeSessions;
    }

    public long getTotalLogs() {
        return totalLogs;
    }

    public long getSuccessfulLogins() {
        return successfulLogins;
    }

    public long getFailedLogins() {
        return failedLogins;
    }

    public long getSuspiciousLogins() {
        return suspiciousLogins;
    }

    public long getPasswordChanges() {
        return passwordChanges;
    }

    public long getActiveSessions() {
        return activeSessions;
    }
}