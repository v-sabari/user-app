package com.example.day4;

import java.util.List;

public class AnalyticsResponse {

    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long lockedUsers;
    private long adminUsers;
    private long normalUsers;

    private long totalAuditLogs;
    private long successfulActions;
    private long failedActions;

    private List<ActionCountResponse> actionCounts;

    public AnalyticsResponse() {
    }

    public AnalyticsResponse(
            long totalUsers,
            long activeUsers,
            long inactiveUsers,
            long lockedUsers,
            long adminUsers,
            long normalUsers,
            long totalAuditLogs,
            long successfulActions,
            long failedActions,
            List<ActionCountResponse> actionCounts
    ) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.inactiveUsers = inactiveUsers;
        this.lockedUsers = lockedUsers;
        this.adminUsers = adminUsers;
        this.normalUsers = normalUsers;
        this.totalAuditLogs = totalAuditLogs;
        this.successfulActions = successfulActions;
        this.failedActions = failedActions;
        this.actionCounts = actionCounts;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public long getInactiveUsers() {
        return inactiveUsers;
    }

    public void setInactiveUsers(long inactiveUsers) {
        this.inactiveUsers = inactiveUsers;
    }

    public long getLockedUsers() {
        return lockedUsers;
    }

    public void setLockedUsers(long lockedUsers) {
        this.lockedUsers = lockedUsers;
    }

    public long getAdminUsers() {
        return adminUsers;
    }

    public void setAdminUsers(long adminUsers) {
        this.adminUsers = adminUsers;
    }

    public long getNormalUsers() {
        return normalUsers;
    }

    public void setNormalUsers(long normalUsers) {
        this.normalUsers = normalUsers;
    }

    public long getTotalAuditLogs() {
        return totalAuditLogs;
    }

    public void setTotalAuditLogs(long totalAuditLogs) {
        this.totalAuditLogs = totalAuditLogs;
    }

    public long getSuccessfulActions() {
        return successfulActions;
    }

    public void setSuccessfulActions(long successfulActions) {
        this.successfulActions = successfulActions;
    }

    public long getFailedActions() {
        return failedActions;
    }

    public void setFailedActions(long failedActions) {
        this.failedActions = failedActions;
    }

    public List<ActionCountResponse> getActionCounts() {
        return actionCounts;
    }

    public void setActionCounts(List<ActionCountResponse> actionCounts) {
        this.actionCounts = actionCounts;
    }
}