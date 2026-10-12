package com.example.springsvc.web;

import com.example.springsvc.security.JwtVerifier;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Users API contract tests — FINAL paths /api/users/users (contract-resolved).
 * @Transactional: rollback mỗi test → không làm bẩn bảng users (seed test độc lập).
 */
@SpringBootTest(properties = "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef")
@AutoConfigureMockMvc
@Transactional
class UserApiTest {

    private static final String ALICE_ID = "11111111-1111-4111-8111-111111111111";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtVerifier verifier;

    private String bearer() {
        String token = Jwts.builder()
                .subject(ALICE_ID)
                .issuer(JwtVerifier.REQUIRED_ISSUER)
                .claim("email", "alice@demo.local")
                .claim("roles", List.of("admin"))
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusSeconds(600)))
                .signWith(verifier.getKey(), Jwts.SIG.HS256)
                .compact();
        return "Bearer " + token;
    }

    @Test
    void listUsersReturnsSeededAlice() throws Exception {
        mockMvc.perform(get("/api/users/users").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.items[?(@.id == '" + ALICE_ID + "')].email").value("alice@demo.local"));
    }

    @Test
    void listUsersValidatesLimit() throws Exception {
        mockMvc.perform(get("/api/users/users").param("limit", "101").header("Authorization", bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void getUserByFixtureIdReturnsAlice() throws Exception {
        mockMvc.perform(get("/api/users/users/" + ALICE_ID).header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ALICE_ID))
                .andExpect(jsonPath("$.email").value("alice@demo.local"))
                .andExpect(jsonPath("$.displayName").value("Alice Demo"))
                .andExpect(jsonPath("$.roles[0]").value("admin"));
    }

    @Test
    void getUnknownUserIs404Envelope() throws Exception {
        UUID unknown = UUID.fromString("99999999-9999-4999-8999-999999999999");
        mockMvc.perform(get("/api/users/users/" + unknown).header("Authorization", bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void createUserWithoutRolesDefaultsToUser() throws Exception {
        String body = "{\"email\":\"dave@demo.local\",\"displayName\":\"Dave Demo\"}";
        mockMvc.perform(post("/api/users/users")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.roles[0]").value("user"));
    }

    @Test
    void createUserDuplicateEmailIs409() throws Exception {
        String body = "{\"email\":\"alice@demo.local\",\"displayName\":\"Another Alice\"}";
        mockMvc.perform(post("/api/users/users")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void createUserInvalidEmailIs400() throws Exception {
        String body = "{\"email\":\"not-an-email\",\"displayName\":\"X\"}";
        mockMvc.perform(post("/api/users/users")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void createUserUnknownRoleIs400() throws Exception {
        String body = "{\"email\":\"eve@demo.local\",\"displayName\":\"Eve\",\"roles\":[\"superadmin\"]}";
        mockMvc.perform(post("/api/users/users")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void patchDisplayNameUpdatesUser() throws Exception {
        String body = "{\"displayName\":\"Alice Updated\"}";
        mockMvc.perform(patch("/api/users/users/" + ALICE_ID)
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Alice Updated"));
    }

    @Test
    void patchEmptyBodyIs400() throws Exception {
        mockMvc.perform(patch("/api/users/users/" + ALICE_ID)
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void patchBlankDisplayNameIs400() throws Exception {
        // contract displayName minLength 1 — @Valid không inherit qua interface, validate thủ công
        mockMvc.perform(patch("/api/users/users/" + ALICE_ID)
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content("{\"displayName\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void unknownPathIs404Not500() throws Exception {
        // NoResourceFoundException không được rơi vào catch-all 500 (review P1)
        mockMvc.perform(get("/api/users/khong-ton-tai").header("Authorization", bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
