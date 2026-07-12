package com.example.day4;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_KEY =
            "mysecretkeymysecretkeymysecretkey123mysecretkey123";

    // ✅ Access: 15 minutes
    private static final long ACCESS_TOKEN_EXPIRATION = 1000L * 60 * 15;

    // ✅ Refresh: 7 days
    private static final long REFRESH_TOKEN_EXPIRATION = 1000L * 60 * 60 * 24 * 7;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                SECRET_KEY.getBytes(StandardCharsets.UTF_8)
        );
    }

    // ✅ ACCESS TOKEN
    public String generateAccessToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("tokenType", "ACCESS")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(getSigningKey())
                .compact();
    }

    // ✅ REFRESH TOKEN
    public String generateRefreshToken(String email, String role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .claim("tokenType", "REFRESH")
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(getSigningKey())
                .compact();
    }

    // Backward support
    public String generateToken(String email, String role) {
        return generateAccessToken(email, role);
    }

    // ========================
    // 🔍 EXTRACT METHODS
    // ========================

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public String extractTokenType(String token) {
        return extractClaims(token).get("tokenType", String.class);
    }

    // ========================
    // ✅ VALIDATION (FIXED)
    // ========================

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        return validateToken(token) && "ACCESS".equals(extractTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return validateToken(token) && "REFRESH".equals(extractTokenType(token));
    }

    // ========================
    // 🔍 DEBUG MESSAGE
    // ========================

    public String getTokenValidationMessage(String token) {
        try {
            extractClaims(token);
            return "Token is valid";
        } catch (ExpiredJwtException e) {
            return "Token has expired";
        } catch (JwtException e) {
            return "Invalid token";
        }
    }
}