package com.example.springsvc.service;

import com.example.springsvc.domain.TeamRepository;
import com.example.springsvc.security.JwtVerifier;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * @Transactional N-step rollback demo (SF-4, FI-78) — Situation A acceptance:
 * (a) happy path — team + members TỒN TẠI trong DB sau request;
 * (b) rollback — fail giữa chừng (member trùng alice@demo.local ở vị trí giữa)
 *     → team KHÔNG tồn tại trong DB, members cũng không (assert QUA REPOSITORY,
 *     không chỉ response code — Rule 0).
 *
 * KHÔNG @Transactional ở test: request phải chạy trong transaction của server
 * (commit thật / rollback thật). Test bọc tx sẽ thấy dữ liệu nửa chừng
 * (rollback-only chưa physical rollback) → assert sai ý nghĩa.
 * Happy path commit thật → cleanup @AfterEach bằng repository.
 */
@SpringBootTest(properties = "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef")
@AutoConfigureMockMvc
class TeamServiceRollbackTest {

    private static final String ALICE_ID = "11111111-1111-4111-8111-111111111111"; // rollback trigger (alice@demo.local)
    private static final String BOB_ID = "22222222-2222-4222-8222-222222222222";
    private static final String CAROL_ID = "33333333-3333-4333-8333-333333333333";
    private static final String HAPPY_TEAM = "tx-demo-happy";
    private static final String ROLLBACK_TEAM = "tx-demo-rollback";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtVerifier verifier;

    @Autowired
    private TeamRepository teams;

    @AfterEach
    void cleanup() {
        // Happy path commit thật — dọn bằng chính repository (cascade dọn team_members)
        teams.deleteByName(HAPPY_TEAM);
        teams.deleteByName(ROLLBACK_TEAM);
        teams.deleteByName(ROLLBACK_TEAM + "-first"); // test 3 dùng tên riêng — dọn đủ
    }

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
    void happyPathTeamAndMembersPersistedInDb() throws Exception {
        String body = "{\"name\":\"" + HAPPY_TEAM + "\",\"memberIds\":[\"" + BOB_ID + "\",\"" + CAROL_ID + "\"]}";
        mockMvc.perform(post("/api/users/teams")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.memberIds.length()").value(2));

        // Rule 0 — assert QUA REPOSITORY: team + members thật sự nằm trong DB
        assertThat(teams.existsByName(HAPPY_TEAM)).as("team tồn tại trong DB").isTrue();
        assertThat(teams.countMembersByTeamName(HAPPY_TEAM)).as("2 members đã insert").isEqualTo(2);
    }

    @Test
    void midFailRollsBackTeamAndMembersInDb() throws Exception {
        // bob insert OK → alice (trigger email) throw giữa chừng → carol không kịp insert
        String body = "{\"name\":\"" + ROLLBACK_TEAM + "\",\"memberIds\":[\""
                + BOB_ID + "\",\"" + ALICE_ID + "\",\"" + CAROL_ID + "\"]}";
        mockMvc.perform(post("/api/users/teams")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"))
                .andExpect(jsonPath("$.error.requestId").isNotEmpty());

        // Rule 0 — rollback assert QUA REPOSITORY: DB KHÔNG có team lẫn members
        assertThat(teams.existsByName(ROLLBACK_TEAM))
                .as("team đã rollback — không còn trong DB").isFalse();
        assertThat(teams.countMembersByTeamName(ROLLBACK_TEAM))
                .as("không member nào sót lại").isZero();
    }

    @Test
    void triggerMemberAloneAlsoRollsBack() throws Exception {
        // Trigger ở vị trí ĐẦU (không có member nào trước) — team đã saveAndFlush vẫn phải biến mất
        String body = "{\"name\":\"" + ROLLBACK_TEAM + "-first\",\"memberIds\":[\"" + ALICE_ID + "\"]}";
        mockMvc.perform(post("/api/users/teams")
                        .header("Authorization", bearer())
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isConflict());

        assertThat(teams.existsByName(ROLLBACK_TEAM + "-first"))
                .as("team đã saveAndFlush cũng rollback khi step member throw").isFalse();
    }
}
