package com.example.day4;

public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;

    public UserProfileResponse() {
    }

    // ✅ FULL CONSTRUCTOR (Day 46 — includes status)
    public UserProfileResponse(
            Long id,
            String name,
            String email,
            String role,
            String status
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
    }

    // ✅ BACKWARD COMPATIBLE CONSTRUCTOR (preserves older usages)
    public UserProfileResponse(
            Long id,
            String name,
            String email,
            String role
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = null;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}