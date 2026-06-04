package com.example.day4;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserSessionRepository userSessionRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            UserSessionRepository userSessionRepository
    ) {
        this.auditLogRepository = auditLogRepository;
        this.userSessionRepository = userSessionRepository;
    }

    // ================= LOG =================
    public void log(
            String actorEmail,
            String actorRole,
            String action,
            String targetEmail,
            String status,
            String details
    ) {

        AuditLog auditLog = new AuditLog();

        auditLog.setActorEmail(actorEmail);
        auditLog.setActorRole(actorRole);
        auditLog.setAction(action);
        auditLog.setTargetEmail(targetEmail);
        auditLog.setStatus(status);
        auditLog.setDetails(details);
        auditLog.setCreatedAt(LocalDateTime.now());

        auditLogRepository.save(auditLog);
    }

    // ================= FILTER LOGS =================
    public Page<AuditLog> getFilteredLogs(
            String action,
            String status,
            String actorEmail,
            String targetEmail,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    ) {

        String safeAction =
                action == null ? "" : action.trim();

        String safeStatus =
                status == null ? "" : status.trim();

        String safeActorEmail =
                actorEmail == null ? "" : actorEmail.trim();

        String safeTargetEmail =
                targetEmail == null ? "" : targetEmail.trim();

        LocalDateTime safeFromDate =
                fromDate == null
                        ? LocalDateTime.of(2000, 1, 1, 0, 0)
                        : fromDate;

        LocalDateTime safeToDate =
                toDate == null
                        ? LocalDateTime.of(2100, 12, 31, 23, 59, 59)
                        : toDate;

        return auditLogRepository
                .findByActionContainingIgnoreCaseAndStatusContainingIgnoreCaseAndActorEmailContainingIgnoreCaseAndTargetEmailContainingIgnoreCaseAndCreatedAtBetween(
                        safeAction,
                        safeStatus,
                        safeActorEmail,
                        safeTargetEmail,
                        safeFromDate,
                        safeToDate,
                        pageable
                );
    }

    // ================= EXPORT FILTERED LOGS AS CSV (Day 52) =================
    public String exportFilteredLogsAsCsv(
            String action,
            String status,
            String actorEmail,
            String targetEmail,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {

        String safeAction =
                action == null ? "" : action.trim();

        String safeStatus =
                status == null ? "" : status.trim();

        String safeActorEmail =
                actorEmail == null ? "" : actorEmail.trim();

        String safeTargetEmail =
                targetEmail == null ? "" : targetEmail.trim();

        LocalDateTime safeFromDate =
                fromDate == null
                        ? LocalDateTime.of(2000, 1, 1, 0, 0)
                        : fromDate;

        LocalDateTime safeToDate =
                toDate == null
                        ? LocalDateTime.of(2100, 12, 31, 23, 59, 59)
                        : toDate;

        // ✅ Fetch all matching logs — no pagination for export
        List<AuditLog> logs = auditLogRepository
                .findAllByActionContainingIgnoreCaseAndStatusContainingIgnoreCaseAndActorEmailContainingIgnoreCaseAndTargetEmailContainingIgnoreCaseAndCreatedAtBetween(
                        safeAction,
                        safeStatus,
                        safeActorEmail,
                        safeTargetEmail,
                        safeFromDate,
                        safeToDate
                );

        // ✅ Build CSV string
        StringBuilder csv = new StringBuilder();

        // CSV header row
        csv.append("ID,Action,Actor Email,Actor Role,Target Email,Status,Details,Created At\n");

        for (AuditLog log : logs) {

            csv.append(log.getId()).append(",");
            csv.append(escapeCsv(log.getAction())).append(",");
            csv.append(escapeCsv(log.getActorEmail())).append(",");
            csv.append(escapeCsv(log.getActorRole())).append(",");
            csv.append(escapeCsv(log.getTargetEmail())).append(",");
            csv.append(escapeCsv(log.getStatus())).append(",");
            csv.append(escapeCsv(log.getDetails())).append(",");
            csv.append(
                    log.getCreatedAt() != null
                            ? log.getCreatedAt().toString()
                            : ""
            ).append("\n");
        }

        return csv.toString();
    }

    // ✅ Escape commas and quotes in CSV fields
    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ================= SECURITY DASHBOARD =================
    public SecurityDashboardResponse getSecurityDashboard() {

        long totalLogs =
                auditLogRepository.count();

        long successfulLogins =
                auditLogRepository.countByActionAndStatus(
                        "LOGIN",
                        "SUCCESS"
                );

        long failedLogins =
                auditLogRepository.countByActionAndStatus(
                        "LOGIN",
                        "FAILED"
                );

        long suspiciousLogins =
                auditLogRepository.countByStatus(
                        "WARNING"
                );

        long passwordChanges =
                auditLogRepository.countByAction(
                        "CHANGE_PASSWORD"
                );

        long activeSessions =
                userSessionRepository.countByIsActiveTrue();

        return new SecurityDashboardResponse(
                totalLogs,
                successfulLogins,
                failedLogins,
                suspiciousLogins,
                passwordChanges,
                activeSessions
        );
    }

    // ================= TOP ACTIONS =================
    public List<TopActionResponse> getTopActions() {

        return auditLogRepository.countLogsByAction()
                .stream()
                .map(obj -> new TopActionResponse(
                        (String) obj[0],
                        (Long) obj[1]
                ))
                .collect(Collectors.toList());
    }

    // ================= SESSION METRICS =================
    public SessionMetricsResponse getSessionMetrics() {

        long totalActive =
                userSessionRepository.countByIsActiveTrue();

        long suspicious =
                userSessionRepository
                        .countByIsActiveTrueAndIsSuspiciousTrue();

        long mobile =
                userSessionRepository
                        .countByIsActiveTrueAndDeviceType("MOBILE");

        long desktop =
                userSessionRepository
                        .countByIsActiveTrueAndDeviceType("DESKTOP");

        return new SessionMetricsResponse(
                totalActive,
                suspicious,
                mobile,
                desktop
        );
    }

    // ================= RECENT EVENTS =================
    public List<AuditLog> getRecentSecurityEvents() {

        return auditLogRepository
                .findTop10ByOrderByCreatedAtDesc();
    }

    // ================= REFRESH SUCCESS =================
    public void logRefreshSuccess(String email, String role) {

        log(
                email,
                role,
                "REFRESH_TOKEN",
                email,
                "SUCCESS",
                "Access token refreshed successfully"
        );
    }

    // ================= REFRESH FAILED =================
    public void logRefreshFailure(String email) {

        log(
                email,
                "UNKNOWN",
                "REFRESH_TOKEN",
                email,
                "FAILED",
                "Invalid refresh token"
        );
    }

    // ================= TOKEN REUSE DETECTED =================
    public void logTokenReuse(String email) {

        log(
                email,
                "UNKNOWN",
                "REFRESH_TOKEN_REUSE",
                email,
                "WARNING",
                "Refresh token reuse detected"
        );
    }

    // ================= LOGOUT =================
    public void logLogout(String email, String role) {

        log(
                email,
                role,
                "LOGOUT",
                email,
                "SUCCESS",
                "User logged out successfully"
        );
    }
}