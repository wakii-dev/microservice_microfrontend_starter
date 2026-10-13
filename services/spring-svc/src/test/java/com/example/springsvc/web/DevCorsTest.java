package com.example.springsvc.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CORS dev-profile — conventions/07: profile "dev" + CORS_DEV_ORIGIN mở
 * ACAO cho đúng origin; preflight không bị JWT filter chặn (OPTIONS skip).
 */
@SpringBootTest(properties = {
        "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef",
        "spring.profiles.active=dev",
        "app.cors-dev-origins=http://localhost:3000,http://localhost:4001"
})
@AutoConfigureMockMvc
class DevCorsTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void preflightFromAllowedOriginGetsAcaoHeader() throws Exception {
        mockMvc.perform(options("/api/users/users")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void preflightFromUnknownOriginHasNoAcao() throws Exception {
        mockMvc.perform(options("/api/users/users")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
