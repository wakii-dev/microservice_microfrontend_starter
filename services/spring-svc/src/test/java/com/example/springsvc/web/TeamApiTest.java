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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Teams API contract tests — FINAL path /api/users/teams (contract-resolved).
 * @Transactional rollback — team_members không làm bẩn DB seed test.
 */
@SpringBootTest(properties = "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef")
@AutoConfigureMockMvc
@Transactional
class TeamApiTest {

    private static final String ALICE_ID = "11111111-1111-4111-8111-111111111111";
    private static final String BOB_ID = "22222222-2222-4222-8222-222222222222";

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
    void createTeamDedupesMemberIds() throws Exception {
        String body = "{\"name\":\"Platform\",\"memberIds\":[\"" + ALICE_ID + "\",\"" + BOB_ID + "\",\"" + ALICE_ID + "\"]}";
        mockMvc.perform(post("/api/users/teams")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Platform"))
                .andExpect(jsonPath("$.memberIds.length()").value(2));
    }

    @Test
    void getTeamEchoesMemberIds() throws Exception {
        String createBody = "{\"name\":\"Core\",\"memberIds\":[\"" + ALICE_ID + "\"]}";
        String teamId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(mockMvc.perform(post("/api/users/teams")
                                .header("Authorization", bearer())
                                .contentType("application/json")
                                .content(createBody))
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString())
                .get("id").asText();

        mockMvc.perform(get("/api/users/teams/" + teamId).header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teamId))
                .andExpect(jsonPath("$.memberIds[0]").value(ALICE_ID));
    }

    @Test
    void getUnknownTeamIs404Envelope() throws Exception {
        mockMvc.perform(get("/api/users/teams/99999999-9999-4999-8999-999999999999")
                        .header("Authorization", bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void listTeamsIncludesCreated() throws Exception {
        mockMvc.perform(post("/api/users/teams")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content("{\"name\":\"Temp\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/users/teams").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.items[?(@.name == 'Temp')]").isNotEmpty());
    }

    @Test
    void createTeamBlankNameIs400() throws Exception {
        mockMvc.perform(post("/api/users/teams")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
