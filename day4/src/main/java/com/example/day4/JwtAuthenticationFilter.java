package com.example.day4;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final UserSessionService sessionService;

    public JwtAuthenticationFilter(
            JwtUtil jwtUtil,
            ObjectMapper objectMapper,
            UserSessionService sessionService
    ) {
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
        this.sessionService = sessionService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();

        String method = request.getMethod();

        if (HttpMethod.OPTIONS.matches(method)) {
            return true;
        }

        return path.equals("/auth/login")
                || path.equals("/auth/register")
                || path.equals("/auth/refresh")
                || path.equals("/auth/forgot-password")
                || path.equals("/auth/reset-password");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {

            String header =
                    request.getHeader("Authorization");

            if (
                    header == null
                            || !header.startsWith("Bearer ")
            ) {

                filterChain.doFilter(request, response);

                return;
            }

            String token =
                    header.substring(7);

            if (!jwtUtil.validateToken(token)) {

                writeUnauthorized(
                        response,
                        jwtUtil.getTokenValidationMessage(token)
                );

                return;
            }

            if (!jwtUtil.isAccessToken(token)) {

                writeUnauthorized(
                        response,
                        "Invalid access token"
                );

                return;
            }

            String email =
                    jwtUtil.extractEmail(token);

            String role =
                    jwtUtil.extractRole(token);

            if (!sessionService.hasAnyValidSession(email)) {

                writeUnauthorized(
                        response,
                        "Session expired or logged out"
                );

                return;
            }

            if (
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication() == null
            ) {

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_" + role
                                        )
                                )
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(auth);
            }

            filterChain.doFilter(request, response);

        }

        catch (Exception ex) {

            SecurityContextHolder.clearContext();

            writeUnauthorized(
                    response,
                    "Authentication failed"
            );
        }
    }

    private void writeUnauthorized(
            HttpServletResponse response,
            String message
    ) throws IOException {

        response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
        );

        response.setContentType(
                MediaType.APPLICATION_JSON_VALUE
        );

        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put("success", false);

        body.put("message", message);

        body.put("data", null);

        response.getWriter().write(
                objectMapper.writeValueAsString(body)
        );
    }
}