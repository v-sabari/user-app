package com.example.day4;

import org.springframework.data.jpa.repository.JpaRepository;

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
}