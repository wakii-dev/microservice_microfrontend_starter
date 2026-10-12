package com.example.springsvc.web;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * /readyz — kiểm THẬT (conventions/02: không hardcode 200): DB reachable +
 * Flyway đã migrate xong (bảng users query được = seed migration đã chạy).
 */
@Component("dbReadiness")
public class ReadinessService implements HealthIndicator {

    private final JdbcTemplate jdbc;

    public ReadinessService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean isReady() {
        try {
            // bảng users chỉ tồn tại sau V1 + seed V2 → query được = migration xong + DB sống
            jdbc.queryForObject("SELECT count(*) FROM users", Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public Health health() {
        return isReady() ? Health.up().build() : Health.down().build();
    }
}
