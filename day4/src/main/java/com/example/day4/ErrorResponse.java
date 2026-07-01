package com.example.day4;

import java.time.LocalDateTime;
import java.util.Map;

public class ErrorResponse {

    private boolean success;
    private String message;
    private Map<String, String> errors;
    private String errorId;           // Unique error tracking ID
    private LocalDateTime timestamp;  // When error occurred

    public ErrorResponse() {
    }

    public ErrorResponse(boolean success, String message, Map<String, String> errors) {
        this.success = success;
        this.message = message;
        this.errors = errors;
    }

    public ErrorResponse(boolean success, String message, Map<String, String> errors, String errorId) {
        this.success = success;
        this.message = message;
        this.errors = errors;
        this.errorId = errorId;
        this.timestamp = LocalDateTime.now();
    }

    // Original factory methods (backward compatible)
    public static ErrorResponse of(String message, Map<String, String> errors) {
        return new ErrorResponse(false, message, errors);
    }

    public static ErrorResponse of(String message) {
        return new ErrorResponse(false, message, null);
    }

    // New factory methods with error ID
    public static ErrorResponse of(String errorId, String message, Map<String, String> errors) {
        return new ErrorResponse(false, message, errors, errorId);
    }

    public static ErrorResponse of(String errorId, String message) {
        return new ErrorResponse(false, message, null, errorId);
    }

    // Getters and Setters
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

    public String getErrorId() {
        return errorId;
    }

    public void setErrorId(String errorId) {
        this.errorId = errorId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}