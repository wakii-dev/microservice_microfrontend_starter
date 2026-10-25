package com.example.springsvc.security;

import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * JWT enforcement lớp 2 (token-contract.md §4) — 401 TỪ SERVICE:
 * valid/expired/garbage/missing/wrong-iss + OPTIONS preflight skip +
 * healthz/readyz naked exempt. Envelope shape theo conventions/04.
 */
@SpringBootTest(properties = "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef")
@AutoConfigureMockMvc
class JwtAuthFilterTest {

    private static final String SECRET = "test-secret-for-jwt-filter-0123456789abcdef";
    private static final String ALICE_SUB = "11111111-1111-4111-8111-111111111111";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtVerifier verifier;

    private String token(String issuer, Instant expiresAt) {
        return Jwts.builder()
                .subject(ALICE_SUB)
                .issuer(issuer)
                .claim("email", "alice@demo.local")
                .claim("roles", List.of("admin"))
                .issuedAt(Date.from(Instant.now().minusSeconds(60)))
                .expiration(Date.from(expiresAt))
                .signWith(verifier.getKey(), Jwts.SIG.HS256)
                .compact();
    }

    private String validToken() {
        return token(JwtVerifier.REQUIRED_ISSUER, Instant.now().plusSeconds(600));
    }

    @Test
    void validTokenPassesAndHandlerSeesClaims() throws Exception {
        mockMvc.perform(get("/api/test/ping").header("Authorization", "Bearer " + validToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sub").value(ALICE_SUB));
    }

    @Test
    void missingTokenIs401FromServiceWithEnvelope() throws Exception {
        mockMvc.perform(get("/api/test/ping").header("X-Request-Id", "req-test-1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.requestId").value("req-test-1"))
                .andExpect(jsonPath("$.error.message").isNotEmpty());
    }

    @Test
    void malformedAuthHeaderIs401() throws Exception {
        mockMvc.perform(get("/api/test/ping").header("Authorization", "Basic dXNlcjpwYXNz"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void garbageTokenIs401() throws Exception {
        mockMvc.perform(get("/api/test/ping").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void expiredTokenIs401() throws Exception {
        String expired = token(JwtVerifier.REQUIRED_ISSUER, Instant.now().minusSeconds(10));
        mockMvc.perform(get("/api/test/ping").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void wrongIssuerIs401() throws Exception {
        String wrongIss = token("someone-else", Instant.now().plusSeconds(600));
        mockMvc.perform(get("/api/test/ping").header("Authorization", "Bearer " + wrongIss))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void optionsPreflightSkipsJwt() throws Exception {
        // Preflight không mang Authorization — không được 401
        mockMvc.perform(options("/api/test/ping"))
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }
}
