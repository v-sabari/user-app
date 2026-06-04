package com.example.day4;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name,
            String email,
            Pageable pageable
    );

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndStatus(String email, String status);

    boolean existsByEmail(String email);

    long countByStatus(String status);

    long countByRole(String role);

    // ✅ Day 51 — Filter by role + status + search combined
    Page<User> findByNameContainingIgnoreCaseAndRoleContainingIgnoreCaseAndStatusContainingIgnoreCase(
            String name,
            String role,
            String status,
            Pageable pageable
    );
}