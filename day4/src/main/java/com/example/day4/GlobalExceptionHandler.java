package com.example.day4;

import io.sentry.Sentry;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Generate unique error ID for tracking
     */
    private String generateErrorId() {
        return UUID.randomUUID().toString();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        log.warn("Validation error [{}]: {}", errorId, errors);

        return ResponseEntity.badRequest()
                .body(
                        ErrorResponse.of(errorId, "Validation failed", errors)
                );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        log.warn("Constraint violation [{}]: {}", errorId, ex.getMessage());

        return ResponseEntity.badRequest()
                .body(
                        ErrorResponse.of(errorId, "Validation failed")
                );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        log.warn("Illegal argument [{}]: {}", errorId, ex.getMessage());

        return ResponseEntity.badRequest()
                .body(
                        ErrorResponse.of(errorId, ex.getMessage())
                );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        log.error("Database integrity error [{}]: {}", errorId, ex.getMessage(), ex);

        // Send to Sentry for monitoring
        Sentry.captureException(ex);
        Sentry.setTag("error_id", errorId);

        return ResponseEntity.badRequest()
                .body(
                        ErrorResponse.of(errorId, "Database error occurred")
                );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        log.warn("Authentication failed [{}]: Invalid credentials", errorId);

        Sentry.addBreadcrumb("auth_failure", "Bad credentials");
        Sentry.setTag("error_id", errorId);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(
                        ErrorResponse.of(errorId, "Invalid email or password")
                );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        String path = request.getDescription(false).replace("uri=", "");

        log.warn("Access denied [{}]: User attempted unauthorized access to {}", errorId, path);

        Sentry.addBreadcrumb("access_denied", path);
        Sentry.setTag("error_id", errorId);

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(
                        ErrorResponse.of(errorId, "Access denied")
                );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex,
            WebRequest request
    ) {
        String errorId = generateErrorId();
        String path = request.getDescription(false).replace("uri=", "");

        log.error("Unhandled exception [{}] at {}: ", errorId, path, ex);

        // Send to Sentry with full context
        Sentry.captureException(ex);
        Sentry.setTag("error_id", errorId);
        Sentry.setTag("path", path);
        Sentry.setTag("exception_type", ex.getClass().getSimpleName());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(
                        ErrorResponse.of(
                                errorId,
                                "Something went wrong"
                        )
                );
    }
}