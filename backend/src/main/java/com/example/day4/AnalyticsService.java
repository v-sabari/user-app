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

    // ================= ADMIN ANALYTICS SNAPSHOT =================
    public AnalyticsResponse getAdminAnalytics() {

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");
        long inactiveUsers = userRepository.countByStatus("INACTIVE");
        long lockedUsers = userRepository.countByStatus("LOCKED");
        long adminUsers = userRepository.countByRole("ADMIN");
        long normalUsers = userRepository.countByRole("USER");
        long totalAuditLogs = auditLogRepository.count();
        long successfulActions = auditLogRepository.countByStatus("SUCCESS");
        long failedActions = auditLogRepository.countByStatus("FAILED");

        List<ActionCountResponse> actionCounts =
                auditLogRepository.countLogsByAction()
                        .stream()
                        .map(row -> new ActionCountResponse(
                                row[0] == null ? "UNKNOWN" : row[0].toString(),
                                ((Number) row[1]).longValue()
                        ))
                        .toList();

        return new AnalyticsResponse(
                totalUsers, activeUsers, inactiveUsers, lockedUsers,
                adminUsers, normalUsers, totalAuditLogs,
                successfulActions, failedActions, actionCounts
        );
    }

    // ================= TREND =================
    public List<DailyCountResponse> getTrend(String action, int days) {

        LocalDate today = LocalDate.now();
        LocalDate startDay = today.minusDays(days - 1);

        List<Object[]> rows = auditLogRepository.countActionTrend(
                action, startDay.atStartOfDay()
        );

        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        List<DailyCountResponse> result = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate current = startDay.plusDays(i);
            String key = current.toString();
            result.add(new DailyCountResponse(key, counts.getOrDefault(key, 0L)));
        }

        return result;
    }

    // ✅ Day 74 — INACTIVE ACCOUNTS REPORT =================
    public Map<String, Object> getInactiveUsers() {

        List<User> neverLoggedIn = userRepository.findUsersWhoNeverLoggedIn();
        long totalCount = userRepository.countUsersWhoNeverLoggedIn();
        long totalUsers = userRepository.count();

        double percentage = totalUsers > 0
                ? Math.round((totalCount / (double) totalUsers) * 1000.0) / 10.0
                : 0.0;

        // ✅ Build simplified response — just the data admins need
        List<Map<String, Object>> userList = neverLoggedIn.stream().map(u -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", u.getId());
            entry.put("name", u.getName());
            entry.put("email", u.getEmail());
            entry.put("role", u.getRole());
            entry.put("status", u.getStatus());
            return entry;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("users", userList);
        result.put("count", totalCount);
        result.put("totalUsers", totalUsers);
        result.put("percentage", percentage);

        return result;
    }
}