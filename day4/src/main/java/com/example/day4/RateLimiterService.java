package com.example.day4;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private static class Bucket {
        int tokens;
        long lastRefillTime;
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean allowRequest(String key, int maxRequests, long windowMillis) {

        Bucket bucket = buckets.computeIfAbsent(key, k -> {
            Bucket b = new Bucket();
            b.tokens = maxRequests;
            b.lastRefillTime = Instant.now().toEpochMilli();
            return b;
        });

        synchronized (bucket) {
            long now = Instant.now().toEpochMilli();

            if (now - bucket.lastRefillTime > windowMillis) {
                bucket.tokens = maxRequests;
                bucket.lastRefillTime = now;
            }

            if (bucket.tokens > 0) {
                bucket.tokens--;
                return true;
            }

            return false;
        }
    }
}