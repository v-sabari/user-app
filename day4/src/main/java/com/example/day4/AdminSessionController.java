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

    // ================= GET ALL ACTIVE SESSIONS (Day 55) =================
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

    // ================= TERMINATE ANY SESSION (Day 55) =================
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
                ApiResponse.success(
                        "Session terminated successfully",
                        null
                )
        );
    }
}