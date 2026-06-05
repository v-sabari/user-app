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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<?> getAdminAnalytics() {
        AnalyticsResponse response = analyticsService.getAdminAnalytics();
        return ResponseEntity.ok(
                ApiResponse.success("Analytics fetched successfully", response)
        );
    }
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/trend")
    public ResponseEntity<?> getTrend(
            @RequestParam String action,
            @RequestParam(defaultValue = "7") int days
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Trend fetched successfully",
                        analyticsService.getTrend(action, days)
                )
        );
    }
}