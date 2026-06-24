package com.example.day4;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditLogService auditLogService;
    private final UserSessionService sessionService;
    private final UserService userService;
    private final AuditLogRepository auditLogRepository;
    // ✅ Day 82 — Login History Service injection
    private final LoginHistoryService loginHistoryService;

    public AuthController(
            UserRepository repo,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuditLogService auditLogService,
            UserSessionService sessionService,
            UserService userService,
            AuditLogRepository auditLogRepository,
            // ✅ Day 82 — Added to constructor
            LoginHistoryService loginHistoryService
    ) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditLogService = auditLogService;
        this.sessionService = sessionService;
        this.userService = userService;
        this.auditLogRepository = auditLogRepository;
        // ✅ Day 82
        this.loginHistoryService = loginHistoryService;
    }

    // ================= REGISTER =================
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        if (repo.existsByEmail(request.getEmail())) {

            return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Email already exists"));
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );
        user.setRole("USER");
        user.setStatus("ACTIVE");

        repo.save(user);

        auditLogService.log(
                user.getEmail(),
                "USER",
                "REGISTER",
                user.getEmail(),
                "SUCCESS",
                "New user registered successfully"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "User registered successfully",
                        null
                )
        );
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {

        // ✅ Day 82 — Extract device info early (needed for both success/failure logging)
        String ipAddressForHistory = httpRequest.getRemoteAddr();
        String userAgentForHistory = httpRequest.getHeader("User-Agent");
        String browserForHistory = loginHistoryService.extractBrowser(userAgentForHistory);
        String osForHistory = loginHistoryService.extractOperatingSystem(userAgentForHistory);
        String deviceTypeForHistory = loginHistoryService.extractDeviceType(userAgentForHistory);

        Optional<User> optionalUser =
                repo.findByEmail(
                        request.getEmail().toLowerCase()
                );

        // ================= USER NOT FOUND =================
        if (optionalUser.isEmpty()) {

            auditLogService.log(
                    request.getEmail(),
                    "UNKNOWN",
                    "LOGIN",
                    request.getEmail(),
                    "FAILED",
                    "Invalid email or password"
            );

            // ✅ Day 82 — Log failed login (user not found)
            try {
                loginHistoryService.logLogin(
                        request.getEmail().toLowerCase(),
                        ipAddressForHistory,
                        userAgentForHistory,
                        deviceTypeForHistory,
                        browserForHistory,
                        osForHistory,
                        "FAILED",
                        "Invalid email or password"
                );
            } catch (Exception e) {
                System.err.println("Failed to log login history: " + e.getMessage());
            }

            return ResponseEntity.badRequest()
                    .body(
                            ErrorResponse.of(
                                    "Invalid email or password"
                            )
                    );
        }

        User user = optionalUser.get();

        // ================= ACCOUNT LOCKED =================
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {

            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "LOGIN",
                    user.getEmail(),
                    "FAILED",
                    "Login attempt on locked account"
            );

            // ✅ Day 82 — Log failed login (account locked)
            try {
                loginHistoryService.logLogin(
                        user.getEmail(),
                        ipAddressForHistory,
                        userAgentForHistory,
                        deviceTypeForHistory,
                        browserForHistory,
                        osForHistory,
                        "FAILED",
                        "Account locked due to multiple failed login attempts"
                );
            } catch (Exception e) {
                System.err.println("Failed to log login history: " + e.getMessage());
            }

            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(
                            ErrorResponse.of(
                                    "Account locked due to multiple failed login attempts"
                            )
                    );
        }

        // ================= ACCOUNT INACTIVE =================
        if ("INACTIVE".equalsIgnoreCase(user.getStatus())) {

            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "LOGIN",
                    user.getEmail(),
                    "FAILED",
                    "Inactive account login attempt"
            );

            // ✅ Day 82 — Log failed login (account inactive)
            try {
                loginHistoryService.logLogin(
                        user.getEmail(),
                        ipAddressForHistory,
                        userAgentForHistory,
                        deviceTypeForHistory,
                        browserForHistory,
                        osForHistory,
                        "FAILED",
                        "Account is inactive"
                );
            } catch (Exception e) {
                System.err.println("Failed to log login history: " + e.getMessage());
            }

            return ResponseEntity.badRequest()
                    .body(
                            ErrorResponse.of(
                                    "Account is inactive"
                            )
                    );
        }

        // ================= PASSWORD CHECK =================
        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );

        // ================= FAILED LOGIN =================
        if (!passwordMatches) {

            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "LOGIN",
                    user.getEmail(),
                    "FAILED",
                    "Invalid email or password"
            );

            // ✅ Day 82 — Log failed login (wrong password)
            try {
                loginHistoryService.logLogin(
                        user.getEmail(),
                        ipAddressForHistory,
                        userAgentForHistory,
                        deviceTypeForHistory,
                        browserForHistory,
                        osForHistory,
                        "FAILED",
                        "Invalid email or password"
                );
            } catch (Exception e) {
                System.err.println("Failed to log login history: " + e.getMessage());
            }

            // ================= FAILED LOGIN COUNT =================
            long failedAttempts =
                    auditLogRepository.countRecentFailedLogins(
                            user.getEmail(),
                            LocalDateTime.now().minusMinutes(15)
                    );

            // ================= AUTO ACCOUNT LOCK =================
            if (failedAttempts >= 5) {

                user.setStatus("LOCKED");

                repo.save(user);

                auditLogService.log(
                        "SYSTEM",
                        "SYSTEM",
                        "AUTO_LOCK",
                        user.getEmail(),
                        "WARNING",
                        "Account auto-locked after 5 failed login attempts within 15 minutes"
                );

                return ResponseEntity.status(HttpStatus.LOCKED)
                        .body(
                                ErrorResponse.of(
                                        "Account locked due to multiple failed login attempts"
                                )
                        );
            }

            return ResponseEntity.badRequest()
                    .body(
                            ErrorResponse.of(
                                    "Invalid email or password"
                            )
                    );
        }

        // ================= DEVICE INFO =================
        String ipAddress =
                httpRequest.getRemoteAddr();

        String userAgent =
                httpRequest.getHeader("User-Agent");

        String deviceType = "UNKNOWN";

        if (userAgent != null) {

            if (userAgent.contains("Mobile")) {

                deviceType = "MOBILE";

            } else if (
                    userAgent.contains("Windows")
                            || userAgent.contains("Mac")
            ) {

                deviceType = "DESKTOP";
            }
        }

        // ================= ACTIVE SESSIONS =================
        List<UserSession> oldSessions =
                sessionService.getActiveSessions(
                        user.getEmail()
                );

        boolean isNewDevice = true;
        boolean isSuspicious = false;

        String loginType = "NORMAL";

        for (UserSession s : oldSessions) {

            if (
                    deviceType.equalsIgnoreCase(
                            s.getDeviceType()
                    )
            ) {

                isNewDevice = false;

                if (
                        !ipAddress.equals(
                                s.getIpAddress()
                        )
                ) {

                    isSuspicious = true;
                    loginType = "SUSPICIOUS";
                }
            }
        }

        if (isNewDevice) {
            loginType = "NEW_DEVICE";
        }

        // ================= TOKENS =================
        String accessToken =
                jwtUtil.generateAccessToken(
                        user.getEmail(),
                        user.getRole()
                );

        String refreshToken =
                jwtUtil.generateRefreshToken(
                        user.getEmail(),
                        user.getRole()
                );

        // ================= CREATE SESSION =================
        UserSession session =
                sessionService.createSession(
                        user.getEmail(),
                        refreshToken,
                        ipAddress,
                        userAgent,
                        deviceType
                );

        session.setSuspicious(isSuspicious);
        session.setLoginType(loginType);

        sessionService.save(session);

        // ✅ Day 82 — Log successful login + detect suspicious patterns
        try {
            LoginHistory loginHistory = loginHistoryService.logLogin(
                    user.getEmail(),
                    ipAddressForHistory,
                    userAgentForHistory,
                    deviceTypeForHistory,
                    browserForHistory,
                    osForHistory,
                    "SUCCESS",
                    null
            );

            // Check previous logins to detect suspicious activity
            List<LoginHistory> previousLogins =
                    loginHistoryService.getRecentLogins(user.getEmail(), 5);

            loginHistoryService.detectSuspiciousLogin(loginHistory, previousLogins);

        } catch (Exception e) {
            System.err.println("Failed to log login history: " + e.getMessage());
        }

        // ================= AUDIT LOGS =================
        if (isSuspicious) {

            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "LOGIN",
                    user.getEmail(),
                    "WARNING",
                    "Suspicious login detected from different IP"
            );

        } else if (isNewDevice) {

            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "LOGIN",
                    user.getEmail(),
                    "INFO",
                    "New device login detected"
            );

        } else {

            auditLogService.log(
                    user.getEmail(),
                    user.getRole(),
                    "LOGIN",
                    user.getEmail(),
                    "SUCCESS",
                    "Login successful"
            );
        }

        // ================= RESPONSE =================
        AuthResponse response = new AuthResponse(
                accessToken,
                refreshToken,
                "Login successful",
                user.getRole(),
                isNewDevice,
                isSuspicious
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Login successful",
                        response
                )
        );
    }

    // ================= REFRESH TOKEN =================
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request
    ) {

        String refreshToken =
                request.getRefreshToken();

        if (!jwtUtil.validateToken(refreshToken)) {

            auditLogService.logRefreshFailure(
                    "UNKNOWN"
            );

            return ResponseEntity.status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            ErrorResponse.of(
                                    "Invalid or expired refresh token"
                            )
                    );
        }

        if (!jwtUtil.isRefreshToken(refreshToken)) {

            return ResponseEntity.status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            ErrorResponse.of(
                                    "Invalid refresh token type"
                            )
                    );
        }

        UserSession session =
                sessionService.validateSession(
                        refreshToken
                );

        if (session == null) {

            String email =
                    jwtUtil.extractEmail(refreshToken);

            auditLogService.logTokenReuse(email);

            return ResponseEntity.status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            ErrorResponse.of(
                                    "Invalid or expired refresh session"
                            )
                    );
        }

        String email =
                jwtUtil.extractEmail(refreshToken);

        String role =
                jwtUtil.extractRole(refreshToken);

        String newAccessToken =
                jwtUtil.generateAccessToken(
                        email,
                        role
                );

        String newRefreshToken =
                jwtUtil.generateRefreshToken(
                        email,
                        role
                );

        sessionService.rotateRefreshToken(
                session,
                newRefreshToken
        );

        auditLogService.logRefreshSuccess(
                email,
                role
        );

        RefreshTokenResponse response =
                new RefreshTokenResponse(
                        newAccessToken,
                        newRefreshToken,
                        "Token refreshed successfully"
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Token refreshed successfully",
                        response
                )
        );
    }

    // ================= LOGOUT =================
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @Valid @RequestBody LogoutRequest request
    ) {

        String refreshToken =
                request.getRefreshToken();

        UserSession session =
                sessionService.validateSession(
                        refreshToken
                );

        if (session == null) {

            return ResponseEntity.status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            ErrorResponse.of(
                                    "Invalid session"
                            )
                    );
        }

        String email =
                session.getUserEmail();

        String role =
                jwtUtil.extractRole(refreshToken);

        sessionService.deactivateSession(session);

        auditLogService.logLogout(email, role);

        // ✅ Day 82 — Log logout time in login history
        try {
            loginHistoryService.logLogout(email);
        } catch (Exception e) {
            System.err.println("Failed to log logout history: " + e.getMessage());
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Logout successful",
                        null
                )
        );
    }

    // ================= FORGOT PASSWORD =================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {

        try {

            userService.forgotPassword(
                    request.getEmail()
            );

        } catch (Exception e) {

            System.err.println(
                    "Forgot password error for "
                            + request.getEmail()
                            + ": "
                            + e.getMessage()
            );
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        "If this email is registered, a reset link has been sent.",
                        null
                )
        );
    }

    // ================= RESET PASSWORD =================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {

        try {

            userService.resetPassword(
                    request.getToken(),
                    request.getNewPassword(),
                    request.getConfirmPassword()
            );

            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Password reset successfully. Please login with your new password.",
                            null
                    )
            );

        } catch (IllegalArgumentException ex) {

            return ResponseEntity.badRequest()
                    .body(
                            ErrorResponse.of(
                                    ex.getMessage()
                            )
                    );
        }
    }

    // ================= GET CURRENT USER =================
    @GetMapping("/me")
    public ResponseEntity<?> getMe(
            Authentication auth
    ) {

        User user =
                repo.findByEmail(auth.getName())
                        .orElse(null);

        if (user == null) {

            return ResponseEntity.status(
                            HttpStatus.NOT_FOUND
                    )
                    .body(
                            ErrorResponse.of(
                                    "User not found"
                            )
                    );
        }

        UserProfileResponse profile =
                new UserProfileResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole(),
                        user.getStatus()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Profile fetched successfully",
                        profile
                )
        );
    }

    // ================= GET SESSIONS =================
    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(
            Authentication auth
    ) {

        List<UserSession> sessions =
                sessionService.getUserSessions(
                        auth.getName()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Sessions fetched successfully",
                        sessions
                )
        );
    }

    // ================= LOGOUT ALL =================
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(
            Authentication auth
    ) {

        String email = auth.getName();

        User user =
                repo.findByEmail(email)
                        .orElse(null);

        String role =
                user != null
                        ? user.getRole()
                        : "USER";

        sessionService.invalidateAllSessions(email);

        auditLogService.log(
                email,
                role,
                "LOGOUT_ALL",
                email,
                "SUCCESS",
                "All sessions terminated by user"
        );

        // ✅ Day 82 — Log logout time in login history
        try {
            loginHistoryService.logLogout(email);
        } catch (Exception e) {
            System.err.println("Failed to log logout history: " + e.getMessage());
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        "All sessions logged out successfully",
                        null
                )
        );
    }

    // ================= DELETE SINGLE SESSION =================
    @DeleteMapping("/session/{id}")
    public ResponseEntity<?> deleteSession(
            @PathVariable Long id,
            Authentication auth
    ) {

        UserSession session =
                sessionService.getSessionById(id);

        if (
                session == null
                        || !session.getUserEmail()
                        .equals(auth.getName())
        ) {

            return ResponseEntity.badRequest()
                    .body(
                            ErrorResponse.of(
                                    "Session not found"
                            )
                    );
        }

        sessionService.deactivateSession(session);

        auditLogService.log(
                auth.getName(),
                "USER",
                "SESSION_LOGOUT",
                auth.getName(),
                "SUCCESS",
                "Session " + id + " terminated manually"
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Session deactivated successfully",
                        null
                )
        );
    }
}