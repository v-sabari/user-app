package com.example.day4;

import java.time.LocalDateTime;
import java.util.List;

public class SecuritySummaryResponse {

    private int totalSessions;
    private int activeSessions;
    private int suspiciousSessions;
    private List<String> devicesUsed;
    private LocalDateTime lastLoginTime;
    private List<String> recentActions;
    private String riskLevel;

    public SecuritySummaryResponse(
            int totalSessions,
            int activeSessions,
            int suspiciousSessions,
            List<String> devicesUsed,
            LocalDateTime lastLoginTime,
            List<String> recentActions,
            String riskLevel
    ) {
        this.totalSessions = totalSessions;
        this.activeSessions = activeSessions;
        this.suspiciousSessions = suspiciousSessions;
        this.devicesUsed = devicesUsed;
        this.lastLoginTime = lastLoginTime;
        this.recentActions = recentActions;
        this.riskLevel = riskLevel;
    }

    public int getTotalSessions() { return totalSessions; }
    public int getActiveSessions() { return activeSessions; }
    public int getSuspiciousSessions() { return suspiciousSessions; }
    public List<String> getDevicesUsed() { return devicesUsed; }
    public LocalDateTime getLastLoginTime() { return lastLoginTime; }
    public List<String> getRecentActions() { return recentActions; }
    public String getRiskLevel() { return riskLevel; }
}