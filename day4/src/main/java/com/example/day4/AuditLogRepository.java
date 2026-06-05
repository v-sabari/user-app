package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    // ================= FILTERING =================
    Page<AuditLog>
    findByActionContainingIgnoreCaseAndStatusContainingIgnoreCaseAndActorEmailContainingIgnoreCaseAndTargetEmailContainingIgnoreCase(
            String action,
            String status,
            String actorEmail,
            String targetEmail,
            Pageable pageable
    );

    // ================= FILTERING WITH DATE =================
    Page<AuditLog>
    findByActionContainingIgnoreCaseAndStatusContainingIgnoreCaseAndActorEmailContainingIgnoreCaseAndTargetEmailContainingIgnoreCaseAndCreatedAtBetween(
            String action,
            String status,
            String actorEmail,
            String targetEmail,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    );

    // ================= EXPORT FILTER =================
    List<AuditLog>
    findAllByActionContainingIgnoreCaseAndStatusContainingIgnoreCaseAndActorEmailContainingIgnoreCaseAndTargetEmailContainingIgnoreCaseAndCreatedAtBetween(
            String action,
            String status,
            String actorEmail,
            String targetEmail,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    // ================= USER HISTORY =================
    List<AuditLog>
    findByTargetEmailOrderByCreatedAtDesc(
            String targetEmail
    );

    // ================= DATE FILTER QUERY =================
    @Query("""
        SELECT a
        FROM AuditLog a
        WHERE
            (:action = '' OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%')))
            AND (:status = '' OR LOWER(a.status) LIKE LOWER(CONCAT('%', :status, '%')))
            AND (:actorEmail = '' OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', :actorEmail, '%')))
            AND (:targetEmail = '' OR LOWER(a.targetEmail) LIKE LOWER(CONCAT('%', :targetEmail, '%')))
            AND (:fromDate IS NULL OR a.createdAt >= :fromDate)
            AND (:toDate IS NULL OR a.createdAt <= :toDate)
        """)
    Page<AuditLog> searchLogs(
            String action,
            String status,
            String actorEmail,
            String targetEmail,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    );

    // ================= ANALYTICS =================
    long countByStatus(String status);

    long countByAction(String action);

    long countByActionAndStatus(
            String action,
            String status
    );

    @Query("""
        SELECT a.action, COUNT(a)
        FROM AuditLog a
        GROUP BY a.action
        ORDER BY COUNT(a) DESC
        """)
    List<Object[]> countLogsByAction();

    // ================= RECENT EVENTS =================
    List<AuditLog> findTop10ByOrderByCreatedAtDesc();

    // ================= DAY 57 — Count recent failed logins =================
    @Query("""
        SELECT COUNT(a)
        FROM AuditLog a
        WHERE LOWER(a.actorEmail) = LOWER(:email)
        AND a.action = 'LOGIN'
        AND a.status = 'FAILED'
        AND a.createdAt >= :fromTime
        """)
    long countRecentFailedLogins(
            String email,
            LocalDateTime fromTime
    );

    // ================= USER RECENT ACTIVITY =================
    List<AuditLog> findTop5ByActorEmailOrderByCreatedAtDesc(
            String actorEmail
    );

    // ================= USER ACTIVITY PAGINATION (unfiltered) =================
    Page<AuditLog> findByActorEmailOrderByCreatedAtDesc(
            String actorEmail,
            Pageable pageable
    );

    // ✅ Day 65 — Filtered personal activity (action + status filter)
    @Query("""
        SELECT a
        FROM AuditLog a
        WHERE a.actorEmail = :actorEmail
        AND (:action = '' OR LOWER(a.action) LIKE LOWER(CONCAT('%', :action, '%')))
        AND (:status = '' OR LOWER(a.status) LIKE LOWER(CONCAT('%', :status, '%')))
        ORDER BY a.createdAt DESC
        """)
    Page<AuditLog> findByActorEmailWithFilters(
            String actorEmail,
            String action,
            String status,
            Pageable pageable
    );
    @Query("""
    SELECT FUNCTION('DATE', a.createdAt), COUNT(a)
    FROM AuditLog a
    WHERE a.action = :action
    AND a.createdAt >= :startDate
    GROUP BY FUNCTION('DATE', a.createdAt)
    ORDER BY FUNCTION('DATE', a.createdAt)
    """)
    List<Object[]> countActionTrend(
            String action,
            LocalDateTime startDate
    );
}