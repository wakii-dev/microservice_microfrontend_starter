package com.example.springsvc.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Lớp 2 enforcement — contracts/auth/token-contract.md §4: service TỰ verify
 * signature (HS256, secret = UTF-8 bytes — khớp auth-mock node jsonwebtoken)
 * + expiry (jjwt tự check khi parse) + iss. KHÔNG tin gateway.
 * JWT_SECRET fail-fast lúc boot (platform/conventions/06 rule 6).
 */
@Component
public class JwtVerifier {

    static final String REQUIRED_ISSUER = "auth-mock";

    private final SecretKey key;

    public JwtVerifier(@Value("${app.jwt-secret:}") String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET is required (contracts/auth/token-contract.md §2)");
        }
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    /**
     * @return claims khi token hợp lệ (sig + exp + iss)
     * @throws io.jsonwebtoken.JwtException sai signature / hết hạn / sai iss / malformed
     */
    public Claims verify(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(REQUIRED_ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public SecretKey getKey() {
        return key;
    }
}
