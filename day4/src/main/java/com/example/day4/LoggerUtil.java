package com.example.day4;

import io.sentry.Sentry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import io.sentry.SentryLevel;
import java.util.Map;

/**
 * Centralized logging utility for consistent error tracking
 * Put this file in: src/main/java/com/example/day4/LoggerUtil.java
 *
 * No extra packages needed! Everything goes in com.example.day4
 */
@Slf4j
@Component
public class LoggerUtil {

    /**
     * Log info level message
     */
    public static void info(String message) {
        log.info(message);
    }

    /**
     * Log info with context data
     */
    public static void info(String message, Map<String, String> context) {
        log.info("{} - Context: {}", message, context);
        Sentry.addBreadcrumb("info", message);
        context.forEach(Sentry::setTag);
    }

    /**
     * Log warning
     */
    public static void warn(String message) {
        log.warn(message);
        Sentry.addBreadcrumb("warning", message);
    }

    /**
     * Log warning with context
     */
    public static void warn(String message, Map<String, String> context) {
        log.warn("{} - Context: {}", message, context);
        Sentry.addBreadcrumb("warning", message);
        context.forEach(Sentry::setTag);
    }

    /**
     * Log error
     */
    public static void error(String message) {
        log.error(message);
        Sentry.addBreadcrumb("error", message);
    }

    /**
     * Log error with exception
     */
    public static void error(String message, Exception ex) {
        log.error(message, ex);
        Sentry.captureException(ex);
        Sentry.addBreadcrumb("error", message);
    }

    /**
     * Log error with context
     */
    public static void error(String message, Map<String, String> context, Exception ex) {
        log.error("{} - Context: {}", message, context, ex);
        Sentry.captureException(ex);
        Sentry.addBreadcrumb("error", message);
        context.forEach(Sentry::setTag);
    }

    /**
     * Log critical error that needs immediate attention
     */
    public static void critical(String message, Exception ex) {
        log.error("CRITICAL: {}", message, ex);
        Sentry.captureException(ex);
        Sentry.configureScope(scope -> scope.setLevel(SentryLevel.FATAL));
    }

    /**
     * Log security event
     */
    public static void security(String action, String result, Map<String, String> context) {
        log.warn("SECURITY EVENT - Action: {} - Result: {} - Context: {}", action, result, context);
        Sentry.addBreadcrumb("security", action);
        context.forEach(Sentry::setTag);
    }

    /**
     * Log authentication attempt
     */
    public static void logAuthAttempt(String username, String result, String reason) {
        String message = String.format("Auth attempt - User: %s, Result: %s, Reason: %s",
                username, result, reason);
        log.info(message);
        Sentry.addBreadcrumb("auth", result);
        Sentry.setTag("username", username);
        Sentry.setTag("result", result);
    }

    /**
     * Log suspicious activity
     */
    public static void suspicious(String activity, Map<String, String> context) {
        log.warn("SUSPICIOUS ACTIVITY: {} - Context: {}", activity, context);
        Sentry.captureMessage("Suspicious Activity: " + activity);
        context.forEach(Sentry::setTag);
    }

    /**
     * Log API call
     */
    public static void logApiCall(String method, String path, int statusCode, long durationMs) {
        log.debug("API Call - Method: {}, Path: {}, Status: {}, Duration: {}ms",
                method, path, statusCode, durationMs);
    }

    /**
     * Log database operation
     */
    public static void logDbOperation(String operation, String entity, long durationMs) {
        log.debug("DB Operation - Operation: {}, Entity: {}, Duration: {}ms",
                operation, entity, durationMs);
    }
}