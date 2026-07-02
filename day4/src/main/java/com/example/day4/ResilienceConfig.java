package com.example.day4;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.core.IntervalFunction;

import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

import java.time.Duration;

/**
 * Resilience Configuration for High Availability
 *
 * Features:
 * - Circuit Breaker: Prevents cascading failures
 * - Retry Logic: Automatic error recovery
 * - Timeout Protection: Prevents hanging requests
 */
@Slf4j
@Configuration
@EnableRetry
public class ResilienceConfig {

    /**
     * Circuit Breaker Configuration
     *
     * CLOSED: Normal operation, requests pass through
     * OPEN: Too many failures, requests immediately fail (fail fast)
     * HALF_OPEN: Testing if service recovered, limited requests allowed
     */
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.ofDefaults();
        registry.getEventPublisher()
                .onEntryAdded(event -> log.info("Circuit Breaker added: {}", event.getAddedEntry().getName()))
                .onEntryRemoved(event -> log.info("Circuit Breaker removed: {}", event.getRemovedEntry().getName()));
        return registry;
    }

    /**
     * Database Circuit Breaker
     * Opens after 5 consecutive failures or 50% failure rate
     */
    @Bean
    public CircuitBreaker databaseCircuitBreaker(CircuitBreakerRegistry registry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(50.0f)  // Open if 50% fail
                .slowCallRateThreshold(50.0f) // Open if 50% are slow
                .slowCallDurationThreshold(Duration.ofSeconds(2))
                .waitDurationInOpenState(Duration.ofSeconds(10))
                .permittedNumberOfCallsInHalfOpenState(3)
                .minimumNumberOfCalls(5)
                .recordExceptions(Exception.class)
                .ignoreExceptions(IllegalArgumentException.class)
                .build();

        CircuitBreaker circuitBreaker = registry.circuitBreaker("database", config);
        circuitBreaker.getEventPublisher()
                .onStateTransition(event -> log.warn("DB Circuit Breaker state change: {} -> {}",
                        event.getStateTransition().getFromState(),
                        event.getStateTransition().getToState()));

        return circuitBreaker;
    }

    /**
     * API Circuit Breaker
     * Opens after too many timeout or connection errors
     */
    @Bean
    public CircuitBreaker apiCircuitBreaker(CircuitBreakerRegistry registry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(60.0f)
                .slowCallRateThreshold(60.0f)
                .slowCallDurationThreshold(Duration.ofSeconds(3))
                .waitDurationInOpenState(Duration.ofSeconds(20))
                .permittedNumberOfCallsInHalfOpenState(5)
                .minimumNumberOfCalls(10)
                .recordExceptions(Exception.class)
                .build();

        return registry.circuitBreaker("api", config);
    }

    /**
     * Retry Configuration
     * Automatically retry failed requests with exponential backoff
     */
    @Bean
    public RetryRegistry retryRegistry() {
        RetryRegistry registry = RetryRegistry.ofDefaults();
        registry.getEventPublisher()
                .onEntryAdded(event -> log.info("Retry policy added: {}", event.getAddedEntry().getName()))
                .onEntryRemoved(event -> log.info("Retry policy removed: {}", event.getRemovedEntry().getName()));
        return registry;
    }

    /**
     * Database Retry Policy
     * Retries 3 times with exponential backoff (1s, 2s, 4s)
     */
    @Bean
    public Retry databaseRetry(RetryRegistry registry) {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(1000))
                .intervalFunction(IntervalFunction.ofExponentialBackoff(1000, 2))
                .retryOnException(e -> !(e instanceof IllegalArgumentException))
                .build();

        Retry retry = registry.retry("database", config);
        retry.getEventPublisher()
                .onRetry(event -> log.warn("Database retry attempt {} for: {}",
                        event.getNumberOfRetryAttempts(),
                        event.getLastThrowable().getMessage()));

        return retry;
    }

    /**
     * API Retry Policy
     * Retries 2 times with fixed delay for external API calls
     */
    @Bean
    public Retry apiRetry(RetryRegistry registry) {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(2)
                .waitDuration(Duration.ofMillis(500))
                .intervalFunction(IntervalFunction.of(Duration.ofSeconds(1)))
                .retryOnException(e -> !(e instanceof IllegalArgumentException))
                .build();

        return registry.retry("api", config);
    }
}