package com.example.day4;

public class AuthResponse {

    private String token;
    private String refreshToken;
    private String message;
    private String role;

    // DAY 41
    private boolean newDevice;
    private boolean suspicious;

    public AuthResponse() {
    }

    public AuthResponse(
            String token,
            String refreshToken,
            String message,
            String role,
            boolean newDevice,
            boolean suspicious
    ) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.message = message;
        this.role = role;
        this.newDevice = newDevice;
        this.suspicious = suspicious;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getMessage() {
        return message;
    }

    public String getRole() {
        return role;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isNewDevice() {
        return newDevice;
    }

    public void setNewDevice(boolean newDevice) {
        this.newDevice = newDevice;
    }

    public boolean isSuspicious() {
        return suspicious;
    }

    public void setSuspicious(boolean suspicious) {
        this.suspicious = suspicious;
    }
}