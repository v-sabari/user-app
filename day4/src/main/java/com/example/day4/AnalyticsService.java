package com.example.day4;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
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

    public List<DailyCountResponse> getTrend(
            String action,
            int days
    ) {

        LocalDate today = LocalDate.now();
        LocalDate startDay = today.minusDays(days - 1);

        List<Object[]> rows =
                auditLogRepository.countActionTrend(
                        action,
                        startDay.atStartOfDay()
                );

        Map<String, Long> counts = new HashMap<>();

        for (Object[] row : rows) {

            String date = row[0].toString();

            long count =
                    ((Number) row[1]).longValue();

            counts.put(date, count);
        }

        List<DailyCountResponse> result =
                new ArrayList<>();

        for (int i = 0; i < days; i++) {

            LocalDate current =
                    startDay.plusDays(i);

            String key = current.toString();

            result.add(
                    new DailyCountResponse(
                            key,
                            counts.getOrDefault(key, 0L)
                    )
            );
        }

        return result;
    }
}