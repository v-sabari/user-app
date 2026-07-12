package com.example.day4;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/sessions")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminSessionController {

    private final UserSessionRepository userSessionRepository;
    private final UserSessionService userSessionService;
    private final AuditLogService auditLogService;

    public AdminSessionController(
            UserSessionRepository userSessionRepository,
            UserSessionService userSessionService,
            AuditLogService auditLogService
    ) {
        this.userSessionRepository = userSessionRepository;
        this.userSessionService = userSessionService;
        this.auditLogService = auditLogService;
    }

    // ================= GET ALL ACTIVE SESSIONS =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getAllActiveSessions() {

        List<UserSession> sessions =
                userSessionRepository
                        .findAllByIsActiveTrueOrderByCreatedAtDesc();

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Active sessions fetched successfully",
                        sessions
                )
        );
    }

    // ================= TERMINATE ONE SESSION =================
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> terminateSession(
            @PathVariable Long id,
            Authentication auth
    ) {

        UserSession session =
                userSessionService.getSessionById(id);

        if (session == null || !session.isActive()) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Session not found or already inactive"));
        }

        String targetEmail = session.getUserEmail();

        userSessionService.deactivateSession(session);

        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "ADMIN_TERMINATE_SESSION",
                targetEmail,
                "SUCCESS",
                "Admin terminated session ID " + id + " for user " + targetEmail
        );

        return ResponseEntity.ok(
                ApiResponse.success("Session terminated successfully", null)
        );
    }

    // ✅ Day 70 — Terminate ALL active sessions system-wide
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping
    public ResponseEntity<?> terminateAllSessions(Authentication auth) {

        // ✅ Count before terminating so we can report the number
        long countBefore =
                userSessionRepository.countByIsActiveTrue();

        if (countBefore == 0) {
            return ResponseEntity.ok(
                    ApiResponse.success("No active sessions to terminate", 0)
            );
        }

        int terminated =
                userSessionRepository.deactivateAllActiveSessions();

        auditLogService.log(
                auth.getName(),
                "ADMIN",
                "ADMIN_TERMINATE_ALL_SESSIONS",
                "SYSTEM",
                "SUCCESS",
                "Admin terminated all " + terminated + " active sessions system-wide"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "All " + terminated + " active sessions have been terminated",
                        terminated
                )
        );
    }
}