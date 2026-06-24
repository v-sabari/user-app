package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String email, Pageable pageable
    );

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndStatus(String email, String status);

    boolean existsByEmail(String email);

    long countByStatus(String status);

    long countByRole(String role);

    // ✅ Day 51 — Filter by role + status + search combined
    Page<User> findByNameContainingIgnoreCaseAndRoleContainingIgnoreCaseAndStatusContainingIgnoreCase(
            String name, String role, String status, Pageable pageable
    );

    // ✅ Day 74 — Find users who have NEVER successfully logged in
    @Query("""
        SELECT u FROM User u
        WHERE u.email NOT IN (
            SELECT DISTINCT a.actorEmail FROM AuditLog a
            WHERE a.action = 'LOGIN' AND a.status = 'SUCCESS'
        )
        ORDER BY u.email ASC
        """)
    List<User> findUsersWhoNeverLoggedIn();

    // ✅ Day 74 — Count users who have NEVER successfully logged in
    @Query("""
        SELECT COUNT(u) FROM User u
        WHERE u.email NOT IN (
            SELECT DISTINCT a.actorEmail FROM AuditLog a
            WHERE a.action = 'LOGIN' AND a.status = 'SUCCESS'
        )
        """)
    long countUsersWhoNeverLoggedIn();
    // ✅ Day 76 — ADD THESE METHODS TO UserRepository.java

// Note: If your User entity doesn't have lastPasswordChangedAt field yet,
// add this to your User.java class:
// @Column(nullable = true)
// private LocalDateTime lastPasswordChangedAt;
//
// And add the getter/setter:
// public LocalDateTime getLastPasswordChangedAt() { return lastPasswordChangedAt; }
// public void setLastPasswordChangedAt(LocalDateTime lastPasswordChangedAt) {
//     this.lastPasswordChangedAt = lastPasswordChangedAt;
// }

// Add these query methods to UserRepository interface:

    /**
     * ✅ Day 76 — Find all users sorted by creation date descending
     * Used for loading all users for risk assessment
     */
    List<User> findAll();

    /**
     * ✅ Day 76 — Find users with specific status
     */
    List<User> findByStatus(String status);

    /**
     * ✅ Day 76 — Find users who haven't changed password in X days
     * Note: User entity must have lastPasswordChangedAt field
     */
    @Query("""
        SELECT u FROM User u
        WHERE u.lastPasswordChangedAt IS NULL
        OR u.lastPasswordChangedAt < :cutoffDate
        """)
    List<User> findUsersWithOldPasswords(java.time.LocalDateTime cutoffDate);
}