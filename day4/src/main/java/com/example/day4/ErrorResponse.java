package com.example.day4;

import java.util.Map;

public class ErrorResponse {

    private boolean success;
    private String message;
    private Map<String, String> errors;

    public ErrorResponse() {
    }

    public ErrorResponse(boolean success, String message, Map<String, String> errors) {
        this.success = success;
        this.message = message;
        this.errors = errors;
    }

    public static ErrorResponse of(String message, Map<String, String> errors) {
        return new ErrorResponse(false, message, errors);
    }

    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
}