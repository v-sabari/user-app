package com.example.day4;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalyticsService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public AnalyticsService(
            UserRepository userRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public AnalyticsResponse getAdminAnalytics() {

        long totalUsers = userRepository.count();

        long activeUsers =
                userRepository.countByStatus("ACTIVE");

        long inactiveUsers =
                userRepository.countByStatus("INACTIVE");

        long lockedUsers =
                userRepository.countByStatus("LOCKED");

        long adminUsers =
                userRepository.countByRole("ADMIN");

        long normalUsers =
                userRepository.countByRole("USER");

        long totalAuditLogs =
                auditLogRepository.count();

        long successfulActions =
                auditLogRepository.countByStatus("SUCCESS");

        long failedActions =
                auditLogRepository.countByStatus("FAILED");

        List<ActionCountResponse> actionCounts =
                auditLogRepository
                        .countLogsByAction()
                        .stream()
                        .map(row -> new ActionCountResponse(
                                row[0] == null
                                        ? "UNKNOWN"
                                        : row[0].toString(),
                                ((Number) row[1]).longValue()
                        ))
                        .toList();

        return new AnalyticsResponse(
                totalUsers,
                activeUsers,
                inactiveUsers,
                lockedUsers,
                adminUsers,
                normalUsers,
                totalAuditLogs,
                successfulActions,
                failedActions,
                actionCounts
        );
    }
}