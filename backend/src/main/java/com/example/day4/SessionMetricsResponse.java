package com.example.day4;

public class SessionMetricsResponse {

    private long totalActiveSessions;
    private long suspiciousSessions;
    private long mobileSessions;
    private long desktopSessions;

    public SessionMetricsResponse(
            long totalActiveSessions,
            long suspiciousSessions,
            long mobileSessions,
            long desktopSessions
    ) {
        this.totalActiveSessions = totalActiveSessions;
        this.suspiciousSessions = suspiciousSessions;
        this.mobileSessions = mobileSessions;
        this.desktopSessions = desktopSessions;
    }

    public long getTotalActiveSessions() {
        return totalActiveSessions;
    }

    public long getSuspiciousSessions() {
        return suspiciousSessions;
    }

    public long getMobileSessions() {
        return mobileSessions;
    }

    public long getDesktopSessions() {
        return desktopSessions;
    }
}