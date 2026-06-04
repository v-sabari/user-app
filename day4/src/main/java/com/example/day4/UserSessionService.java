package com.example.day4;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserSessionService {

    private final UserSessionRepository repository;

    public UserSessionService(UserSessionRepository repository) {
        this.repository = repository;
    }

    // ================= CREATE SESSION =================
    public UserSession createSession(
            String email,
            String refreshToken,
            String ipAddress,
            String userAgent,
            String deviceType
    ) {

        UserSession session = new UserSession();

        session.setUserEmail(email);
        session.setRefreshToken(refreshToken);

        session.setActive(true);

        session.setCreatedAt(LocalDateTime.now());

        session.setExpiresAt(
                LocalDateTime.now().plusDays(7)
        );

        session.setIpAddress(ipAddress);
        session.setUserAgent(userAgent);
        session.setDeviceType(deviceType);

        session.setSuspicious(false);
        session.setLoginType("NORMAL");

        return repository.save(session);
    }

    // ================= SAVE =================
    public UserSession save(UserSession session) {
        return repository.save(session);
    }

    // ================= GET SESSION BY ID =================
    public UserSession getSessionById(Long id) {

        return repository.findById(id)
                .orElse(null);
    }

    // ================= GET USER SESSIONS =================
    public List<UserSession> getUserSessions(String email) {
        return repository.findByUserEmail(email);
    }

    // ================= ACTIVE SESSIONS =================
    public List<UserSession> getActiveSessions(String email) {
        return repository.findByUserEmailAndIsActiveTrue(email);
    }

    // ================= VALIDATE SESSION =================
    public UserSession validateSession(String refreshToken) {

        UserSession session = repository
                .findByRefreshTokenAndIsActiveTrue(refreshToken)
                .orElse(null);

        if (session == null) {
            return null;
        }

        if (!session.isValid()) {

            session.setActive(false);

            repository.save(session);

            return null;
        }

        return session;
    }

    // ================= REFRESH TOKEN ROTATION =================
    public UserSession rotateRefreshToken(
            UserSession session,
            String newRefreshToken
    ) {

        session.setRefreshToken(newRefreshToken);

        session.setCreatedAt(LocalDateTime.now());

        session.setExpiresAt(
                LocalDateTime.now().plusDays(7)
        );

        return repository.save(session);
    }

    // ================= DEACTIVATE SINGLE SESSION =================
    public void deactivateSession(UserSession session) {

        session.setActive(false);

        repository.save(session);
    }

    // ================= LOGOUT ALL =================
    public void invalidateAllSessions(String email) {

        List<UserSession> sessions =
                repository.findByUserEmailAndIsActiveTrue(email);

        for (UserSession session : sessions) {

            session.setActive(false);

            repository.save(session);
        }
    }

    // ================= CHECK VALID SESSION =================
    public boolean hasAnyValidSession(String email) {

        List<UserSession> sessions =
                repository.findByUserEmailAndIsActiveTrue(email);

        for (UserSession session : sessions) {

            if (session.isValid()) {
                return true;
            }
        }

        return false;
    }
}