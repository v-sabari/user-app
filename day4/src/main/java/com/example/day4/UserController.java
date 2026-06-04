package com.example.day4;

import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserRepository repo;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionService userSessionService;

    private static final String TEMP_PASSWORD_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";

    public UserController(
            UserRepository repo,
            AuditLogService auditLogService,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            UserSessionService userSessionService
    ) {
        this.repo = repo;
        this.auditLogService = auditLogService;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSessionService = userSessionService;
    }

    // ================= GET ALL USERS =================
    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {

        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        String safeSearch = search == null ? "" : search.trim();
        String safeRole = role == null ? "" : role.trim();
        String safeStatus = status == null ? "" : status.trim();

        Page<User> usersPage =
                repo.findByNameContainingIgnoreCaseAndRoleContainingIgnoreCaseAndStatusContainingIgnoreCase(
                        safeSearch, safeRole, safeStatus, pageable
                );

        return ResponseEntity.ok(
                ApiResponse.success("Users fetched successfully", usersPage)
        );
    }

    // ================= EXPORT USERS CSV =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/export")
    public ResponseEntity<?> exportUsersCsv(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String role,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            Authentication auth
    ) {

        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        String safeSearch = search == null ? "" : search.trim();
        String safeRole = role == null ? "" : role.trim();
        String safeStatus = status == null ? "" : status.trim();

        List<User> users =
                repo.findByNameContainingIgnoreCaseAndRoleContainingIgnoreCaseAndStatusContainingIgnoreCase(
                        safeSearch, safeRole, safeStatus,
                        PageRequest.of(0, Integer.MAX_VALUE, sort)
                ).getContent();

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Name,Email,Role,Status\n");

        for (User user : users) {
            csv.append(user.getId()).append(",");
            csv.append("\"").append(user.getName().replace("\"", "\"\"")).append("\",");
            csv.append("\"").append(user.getEmail().replace("\"", "\"\"")).append("\",");
            csv.append(user.getRole()).append(",");
            csv.append(user.getStatus()).append("\n");
        }

        auditLogService.log(auth.getName(), "ADMIN", "EXPORT_USERS_CSV",
                "SYSTEM", "SUCCESS", "Exported " + users.size() + " users as CSV");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=users-export.csv")
                .contentType(new MediaType("text", "csv"))
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    // ================= GET USER BY ID =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {

        User user = repo.findById(id).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));
        }

        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", user));
    }

    // ================= GET USER HISTORY =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}/history")
    public ResponseEntity<?> getUserHistory(@PathVariable Long id) {

        User user = repo.findById(id).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));
        }

        List<AuditLog> history =
                auditLogRepository.findByTargetEmailOrderByCreatedAtDesc(user.getEmail());

        return ResponseEntity.ok(ApiResponse.success("User history fetched successfully", history));
    }

    // ================= ADD USER =================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> addUser(@Valid @RequestBody User user, Authentication auth) {

        if (repo.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body(ErrorResponse.of("Email already exists"));
        }

        user.setEmail(user.getEmail().toLowerCase());
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (user.getRole() == null || user.getRole().isBlank()) user.setRole("USER");
        if (user.getStatus() == null || user.getStatus().isBlank()) user.setStatus("ACTIVE");

        User saved = repo.save(user);

        auditLogService.log(auth.getName(), "ADMIN", "ADD_USER",
                saved.getEmail(), "SUCCESS", "User added successfully");

        return ResponseEntity.ok(ApiResponse.success("User added successfully", saved));
    }

    // ================= UPDATE USER =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody User user,
            Authentication auth
    ) {

        User existing = repo.findById(id).orElse(null);

        if (existing == null) {
            return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));
        }

        existing.setName(user.getName());
        existing.setEmail(user.getEmail().toLowerCase());

        if (user.getRole() != null) existing.setRole(user.getRole());
        if (user.getStatus() != null) existing.setStatus(user.getStatus());

        User updated = repo.save(existing);

        auditLogService.log(auth.getName(), "ADMIN", "UPDATE_USER",
                updated.getEmail(), "SUCCESS", "User updated successfully");

        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    // ================= ACTIVATE =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, Authentication auth) {

        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));

        user.setStatus("ACTIVE");
        repo.save(user);
        auditLogService.log(auth.getName(), "ADMIN", "ACTIVATE_USER", user.getEmail(), "SUCCESS", "User activated");

        return ResponseEntity.ok(ApiResponse.success("User activated successfully", user));
    }

    // ================= DEACTIVATE (Day 63 — accepts optional reason) =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth
    ) {

        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));

        user.setStatus("INACTIVE");
        repo.save(user);

        // ✅ Day 63 — Include reason in audit log details if provided
        String reason = (body != null && body.get("reason") != null && !body.get("reason").isBlank())
                ? body.get("reason").trim()
                : null;

        String details = reason != null
                ? "User deactivated. Reason: " + reason
                : "User deactivated";

        auditLogService.log(auth.getName(), "ADMIN", "DEACTIVATE_USER", user.getEmail(), "SUCCESS", details);

        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", user));
    }

    // ================= LOCK (Day 63 — accepts optional reason) =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/lock")
    public ResponseEntity<?> lock(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth
    ) {

        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));

        user.setStatus("LOCKED");
        repo.save(user);

        // ✅ Day 63 — Include reason in audit log details if provided
        String reason = (body != null && body.get("reason") != null && !body.get("reason").isBlank())
                ? body.get("reason").trim()
                : null;

        String details = reason != null
                ? "User locked. Reason: " + reason
                : "User locked";

        auditLogService.log(auth.getName(), "ADMIN", "LOCK_USER", user.getEmail(), "SUCCESS", details);

        return ResponseEntity.ok(ApiResponse.success("User locked successfully", user));
    }

    // ================= UNLOCK =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/unlock")
    public ResponseEntity<?> unlock(@PathVariable Long id, Authentication auth) {

        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));

        user.setStatus("ACTIVE");
        repo.save(user);
        auditLogService.log(auth.getName(), "ADMIN", "UNLOCK_USER", user.getEmail(), "SUCCESS", "User unlocked");

        return ResponseEntity.ok(ApiResponse.success("User unlocked successfully", user));
    }

    // ================= DELETE (Day 63 — accepts optional reason) =================
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth
    ) {

        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));

        String email = user.getEmail();

        // ✅ Day 63 — Capture reason before deleting user
        String reason = (body != null && body.get("reason") != null && !body.get("reason").isBlank())
                ? body.get("reason").trim()
                : null;

        repo.delete(user);

        String details = reason != null
                ? "User deleted. Reason: " + reason
                : "User deleted";

        auditLogService.log(auth.getName(), "ADMIN", "DELETE_USER", email, "SUCCESS", details);

        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    // ================= ADMIN FORCE RESET PASSWORD =================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/reset-password")
    public ResponseEntity<?> adminResetPassword(@PathVariable Long id, Authentication auth) {

        User user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body(ErrorResponse.of("User not found"));

        if ("ADMIN".equalsIgnoreCase(user.getRole()) && !user.getEmail().equals(auth.getName())) {
            return ResponseEntity.badRequest().body(ErrorResponse.of("Cannot reset another admin's password"));
        }

        String tempPassword = generateTempPassword(10);
        user.setPassword(passwordEncoder.encode(tempPassword));
        repo.save(user);

        userSessionService.invalidateAllSessions(user.getEmail());

        auditLogService.log(auth.getName(), "ADMIN", "ADMIN_RESET_PASSWORD",
                user.getEmail(), "SUCCESS", "Admin force-reset password. All sessions invalidated.");

        return ResponseEntity.ok(
                ApiResponse.success("Password reset successfully",
                        new TempPasswordResponse(user.getEmail(), tempPassword))
        );
    }

    // ================= BULK ACTION =================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk-action")
    public ResponseEntity<?> bulkAction(
            @Valid @RequestBody BulkActionRequest request,
            Authentication auth
    ) {

        String action = request.getAction().trim().toUpperCase();

        if (!List.of("ACTIVATE", "DEACTIVATE", "LOCK", "DELETE").contains(action)) {
            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Invalid action. Allowed: ACTIVATE, DEACTIVATE, LOCK, DELETE"));
        }

        List<String> successList = new ArrayList<>();
        List<String> failedList = new ArrayList<>();

        for (Long userId : request.getUserIds()) {

            User user = repo.findById(userId).orElse(null);

            if (user == null) {
                failedList.add("ID " + userId + " not found");
                continue;
            }

            if (
                    "ADMIN".equalsIgnoreCase(user.getRole())
                            && !user.getEmail().equals(auth.getName())
                            && (action.equals("DELETE") || action.equals("LOCK"))
            ) {
                failedList.add(user.getEmail() + " (cannot modify another admin)");
                continue;
            }

            try {

                switch (action) {
                    case "ACTIVATE" -> { user.setStatus("ACTIVE"); repo.save(user); }
                    case "DEACTIVATE" -> { user.setStatus("INACTIVE"); repo.save(user); }
                    case "LOCK" -> {
                        user.setStatus("LOCKED");
                        repo.save(user);
                        userSessionService.invalidateAllSessions(user.getEmail());
                    }
                    case "DELETE" -> repo.delete(user);
                }

                successList.add(user.getEmail());

                auditLogService.log(auth.getName(), "ADMIN", "BULK_" + action,
                        user.getEmail(), "SUCCESS", "Bulk action " + action + " applied");

            } catch (Exception e) {
                failedList.add(user.getEmail() + " (error)");
                auditLogService.log(auth.getName(), "ADMIN", "BULK_" + action,
                        user.getEmail(), "FAILED", "Bulk action failed: " + e.getMessage());
            }
        }

        String message = action + " applied to " + successList.size() + " user(s)";
        if (!failedList.isEmpty()) message += ". Failed: " + failedList.size();

        return ResponseEntity.ok(
                ApiResponse.success(message,
                        new BulkActionResult(successList.size(), failedList.size(), successList, failedList))
        );
    }

    // ================= TEMP PASSWORD GENERATOR =================
    private String generateTempPassword(int length) {

        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(random.nextInt(TEMP_PASSWORD_CHARS.length())));
        }

        return sb.toString();
    }
}