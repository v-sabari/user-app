package com.example.day4;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimiterService rateLimiterService, ObjectMapper objectMapper) {
        this.rateLimiterService = rateLimiterService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        String ip = request.getRemoteAddr();

        boolean allowed = true;

        if (path.equals("/auth/login")) {
            allowed = rateLimiterService.allowRequest(ip + "_login", 5, 60_000);
        } else if (path.equals("/auth/forgot-password")) {
            allowed = rateLimiterService.allowRequest(ip + "_forgot", 3, 600_000);
        } else if (path.equals("/auth/reset-password")) {
            allowed = rateLimiterService.allowRequest(ip + "_reset", 5, 600_000);
        } else if (path.equals("/users") && request.getMethod().equals("POST")) {
            allowed = rateLimiterService.allowRequest(ip + "_users", 10, 60_000);
        } else if (path.equals("/users/export")) {
            // ✅ Day 89-90 — SECURITY FIX: this endpoint exports the entire
            // user database as CSV and previously had no rate limit at all,
            // unlike every other sensitive endpoint in this filter. Limited
            // to 5 exports per 5 minutes per IP — generous enough for normal
            // admin use, but stops rapid repeated full-database dumps if an
            // admin account/session is ever compromised.
            allowed = rateLimiterService.allowRequest(ip + "_users_export", 5, 300_000);
        } else if (path.startsWith("/email-alerts/")) {
            // ✅ Day 89-90 — SECURITY FIX: every endpoint under /email-alerts
            // lets any authenticated user trigger a real email send to
            // themselves with zero rate limiting. Not a data-leak risk
            // (users can only spam their own inbox), but a real resource-
            // abuse risk: unrestricted use could exhaust Gmail SMTP quota
            // or get the sending account flagged for abuse, degrading
            // email delivery for every user. Limited to 10 email sends
            // per 10 minutes per IP — enough for legitimate testing/use,
            // not enough to meaningfully abuse the quota.
            allowed = rateLimiterService.allowRequest(ip + "_email_alerts", 10, 600_000);
        }

        if (!allowed) {
            writeRateLimitResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", "Too many requests. Try again later.");
        body.put("data", null);

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}