package com.example.day4;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    List<UserSession> findByUserEmail(String userEmail);

    List<UserSession> findByUserEmailAndIsActiveTrue(String userEmail);

    Optional<UserSession> findByRefreshToken(String refreshToken);

    Optional<UserSession> findByRefreshTokenAndIsActiveTrue(String refreshToken);

    long countByIsActiveTrue();

    long countByIsActiveTrueAndIsSuspiciousTrue();

    long countByIsActiveTrueAndDeviceType(String deviceType);

    // ✅ Day 55 — Fetch all active sessions system-wide for admin view
    List<UserSession> findAllByIsActiveTrueOrderByCreatedAtDesc();

    // ✅ Day 70 — Terminate ALL active sessions in one query
    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.isActive = false WHERE s.isActive = true")
    int deactivateAllActiveSessions();
}