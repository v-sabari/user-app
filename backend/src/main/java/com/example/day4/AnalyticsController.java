package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    // ================= ADMIN ANALYTICS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics() {
        return ResponseEntity.ok(
                ApiResponse.success("Analytics fetched successfully",
                        analyticsService.getAdminAnalytics())
        );
    }

    // ================= TREND =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/trend")
    public ResponseEntity<?> getTrend(
            @RequestParam String action,
            @RequestParam(defaultValue = "7") int days
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Trend fetched successfully",
                        analyticsService.getTrend(action, days))
        );
    }

    // ✅ Day 74 — INACTIVE ACCOUNTS REPORT =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/inactive-users")
    public ResponseEntity<?> getInactiveUsers() {
        return ResponseEntity.ok(
                ApiResponse.success("Inactive users fetched successfully",
                        analyticsService.getInactiveUsers())
        );
    }
}