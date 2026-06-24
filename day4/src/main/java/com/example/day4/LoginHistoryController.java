package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * ✅ Day 82 — Login History Controller
 * API endpoints for login history tracking and analysis
 */
@RestController
@RequestMapping("/login-history")
@CrossOrigin(origins = "http://localhost:5173")
public class LoginHistoryController {

    private final LoginHistoryService loginHistoryService;

    public LoginHistoryController(LoginHistoryService loginHistoryService) {
        this.loginHistoryService = loginHistoryService;
    }

    // ================= GET USER LOGIN HISTORY =================
    /**
     * Get paginated login history for current user
     * GET /login-history?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<?> getUserLoginHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        Page<LoginHistory> history = loginHistoryService
                .getUserLoginHistory(userEmail, page, size);

        return ResponseEntity.ok(
                ApiResponse.success("Login history fetched", history)
        );
    }

    // ================= GET LOGIN STATS =================
    /**
     * Get login statistics for current user
     * GET /login-history/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getLoginStats(Authentication authentication) {
        String userEmail = authentication.getName();

        LoginHistoryService.LoginStatsResponse stats =
                loginHistoryService.getLoginStats(userEmail);

        return ResponseEntity.ok(
                ApiResponse.success("Login stats fetched", stats)
        );
    }

    // ================= GET DEVICE LOGINS =================
    /**
     * Get logins from a specific device type
     * GET /login-history/by-device?deviceType=MOBILE
     */
    @GetMapping("/by-device")
    public ResponseEntity<?> getDeviceLogins(
            @RequestParam String deviceType,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        var logins = loginHistoryService
                .getDeviceLogins(userEmail, deviceType);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Device logins fetched",
                        logins
                )
        );
    }

    // ================= GET IP LOGINS =================
    /**
     * Get logins from a specific IP address
     * GET /login-history/by-ip?ipAddress=192.168.1.1
     */
    @GetMapping("/by-ip")
    public ResponseEntity<?> getIpLogins(
            @RequestParam String ipAddress,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        var logins = loginHistoryService
                .getIpLogins(userEmail, ipAddress);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "IP logins fetched",
                        logins
                )
        );
    }

    // ================= ADMIN: ALL LOGIN HISTORY =================
    /**
     * Admin endpoint: view all logins system-wide
     * GET /login-history/admin/all?page=0&size=10
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllLoginHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<LoginHistory> history = loginHistoryService
                .getAllLoginHistory(page, size);

        return ResponseEntity.ok(
                ApiResponse.success("All login history fetched", history)
        );
    }

    // ================= ADMIN: SEARCH BY EMAIL =================
    /**
     * Admin endpoint: search logins by user email
     * GET /login-history/admin/search?userEmail=user@example.com&page=0&size=10
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/search")
    public ResponseEntity<?> searchByEmail(
            @RequestParam String userEmail,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<LoginHistory> history = loginHistoryService
                .searchByEmail(userEmail, page, size);

        return ResponseEntity.ok(
                ApiResponse.success("Search results fetched", history)
        );
    }

    // ================= ADMIN: FILTER BY STATUS =================
    /**
     * Admin endpoint: filter by login status (SUCCESS or FAILED)
     * GET /login-history/admin/by-status?status=FAILED&page=0&size=10
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/by-status")
    public ResponseEntity<?> filterByStatus(
            @RequestParam String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<LoginHistory> history = loginHistoryService
                .filterByStatus(status, page, size);

        return ResponseEntity.ok(
                ApiResponse.success("Filtered login history", history)
        );
    }

    // ================= ADMIN: SUSPICIOUS LOGINS =================
    /**
     * Admin endpoint: view all suspicious logins
     * GET /login-history/admin/suspicious?page=0&size=10
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/suspicious")
    public ResponseEntity<?> getSuspiciousLogins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<LoginHistory> suspicious = loginHistoryService
                .getSuspiciousLogins(page, size);

        return ResponseEntity.ok(
                ApiResponse.success("Suspicious logins fetched", suspicious)
        );
    }
}