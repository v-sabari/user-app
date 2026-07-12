package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    // ================= GET USER LOGIN HISTORY =================
    Page<LoginHistory> findByUserEmailOrderByLoginTimeDesc(String userEmail, Pageable pageable);

    // ================= GET RECENT LOGINS =================
    List<LoginHistory> findTop10ByUserEmailOrderByLoginTimeDesc(String userEmail);

    // ================= COUNT LOGINS =================
    long countByUserEmail(String userEmail);

    long countByUserEmailAndStatus(String userEmail, String status);

    // ================= SUCCESSFUL LOGINS =================
    @Query("""
        SELECT COUNT(l) FROM LoginHistory l
        WHERE LOWER(l.userEmail) = LOWER(:email)
        AND l.status = 'SUCCESS'
        """)
    long countSuccessfulLogins(String email);

    // ================= FAILED LOGINS =================
    @Query("""
        SELECT COUNT(l) FROM LoginHistory l
        WHERE LOWER(l.userEmail) = LOWER(:email)
        AND l.status = 'FAILED'
        """)
    long countFailedLogins(String email);

    // ================= FAILED LOGINS IN LAST 24 HOURS =================
    @Query("""
        SELECT COUNT(l) FROM LoginHistory l
        WHERE LOWER(l.userEmail) = LOWER(:email)
        AND l.status = 'FAILED'
        AND l.loginTime >= :since
        """)
    long countRecentFailedLogins(String email, LocalDateTime since);

    // ================= SUSPICIOUS LOGINS =================
    @Query("""
        SELECT COUNT(l) FROM LoginHistory l
        WHERE LOWER(l.userEmail) = LOWER(:email)
        AND l.isSuspicious = true
        """)
    long countSuspiciousLogins(String email);

    // ================= GET LAST SUCCESSFUL LOGIN =================
    @Query("""
        SELECT l FROM LoginHistory l
        WHERE LOWER(l.userEmail) = LOWER(:email)
        AND l.status = 'SUCCESS'
        ORDER BY l.loginTime DESC
        """)
    List<LoginHistory> getLastSuccessfulLogin(String email, Pageable pageable);

    // ================= GET LOGINS FROM SPECIFIC IP =================
    List<LoginHistory> findByUserEmailAndIpAddress(String userEmail, String ipAddress);

    // ================= GET LOGINS FROM SPECIFIC DEVICE =================
    List<LoginHistory> findByUserEmailAndDeviceType(String userEmail, String deviceType);

    // ================= FILTER BY DATE RANGE =================
    List<LoginHistory> findByUserEmailAndLoginTimeBetween(String userEmail, LocalDateTime from, LocalDateTime to);

    // ================= ADMIN: ALL LOGIN HISTORY =================
    Page<LoginHistory> findAllByOrderByLoginTimeDesc(Pageable pageable);

    // ================= ADMIN: SEARCH BY EMAIL =================
    Page<LoginHistory> findByUserEmailContainingIgnoreCaseOrderByLoginTimeDesc(String userEmail, Pageable pageable);

    // ================= ADMIN: FILTER BY STATUS =================
    Page<LoginHistory> findByStatusOrderByLoginTimeDesc(String status, Pageable pageable);

    // ================= ADMIN: SUSPICIOUS LOGINS =================
    Page<LoginHistory> findByIsSuspiciousOrderByLoginTimeDesc(boolean suspicious, Pageable pageable);

    // ================= COUNT TOTAL LOGINS SYSTEM-WIDE =================
    long countByStatus(String status);
}