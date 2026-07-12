package com.example.day4;

public class TempPasswordResponse {

    private String email;
    private String temporaryPassword;

    public TempPasswordResponse() {
    }

    public TempPasswordResponse(String email, String temporaryPassword) {
        this.email = email;
        this.temporaryPassword = temporaryPassword;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }

    public void setTemporaryPassword(String temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }
}