package com.example.day4;

import org.springframework.data.domain.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@CrossOrigin(origins = "http://localhost:5173")
public class AuditLogController {

    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    // ================= FILTER LOGS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getLogs(

            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String actorEmail,
            @RequestParam(defaultValue = "") String targetEmail,

            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size

    ) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        LocalDateTime from = null;
        LocalDateTime to = null;

        try {

            if (fromDate != null && !fromDate.isBlank()) {
                from = LocalDateTime.parse(fromDate);
            }

            if (toDate != null && !toDate.isBlank()) {
                to = LocalDateTime.parse(toDate);
            }

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Invalid date format"));
        }

        Page<AuditLog> logs = service.getFilteredLogs(
                action,
                status,
                actorEmail,
                targetEmail,
                from,
                to,
                pageable
        );

        return ResponseEntity.ok(
                ApiResponse.success("Logs fetched", logs)
        );
    }

    // ================= EXPORT CSV (Day 52) =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLogs(

            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String actorEmail,
            @RequestParam(defaultValue = "") String targetEmail,

            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate

    ) {

        LocalDateTime from = null;
        LocalDateTime to = null;

        try {

            if (fromDate != null && !fromDate.isBlank()) {
                from = LocalDateTime.parse(fromDate);
            }

            if (toDate != null && !toDate.isBlank()) {
                to = LocalDateTime.parse(toDate);
            }

        } catch (Exception e) {

            return ResponseEntity.badRequest().build();
        }

        String csv = service.exportFilteredLogsAsCsv(
                action,
                status,
                actorEmail,
                targetEmail,
                from,
                to
        );

        // ✅ Generate timestamped filename
        String filename = "audit-logs-"
                + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd-HH-mm"))
                + ".csv";

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\""
                )
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.getBytes());
    }

    // ================= SECURITY DASHBOARD =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/security-dashboard")
    public ResponseEntity<?> getSecurityDashboard() {

        SecurityDashboardResponse response =
                service.getSecurityDashboard();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Security dashboard fetched",
                        response
                )
        );
    }

    // ================= SESSION METRICS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/session-metrics")
    public ResponseEntity<?> getSessionMetrics() {

        SessionMetricsResponse response =
                service.getSessionMetrics();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Session metrics fetched",
                        response
                )
        );
    }

    // ================= TOP ACTIONS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/top-actions")
    public ResponseEntity<?> getTopActions() {

        List<TopActionResponse> response =
                service.getTopActions();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Top actions fetched",
                        response
                )
        );
    }

    // ================= RECENT SECURITY EVENTS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/recent-events")
    public ResponseEntity<?> getRecentEvents() {

        List<AuditLog> response =
                service.getRecentSecurityEvents();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Recent security events fetched",
                        response
                )
        );
    }
}