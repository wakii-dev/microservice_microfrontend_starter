package com.example.springsvc.logging;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Log shape conventions/03: một dòng JSON, ts (ISO ms UTC), level lowercase,
 * service=spring-svc, msg, requestId từ MDC. KHÔNG log token (assert ở filter tests).
 */
@SpringBootTest(properties = "app.jwt-secret=test-secret-for-jwt-filter-0123456789abcdef")
@ExtendWith(OutputCaptureExtension.class)
class LogShapeTest {

    private static final Logger log = LoggerFactory.getLogger(LogShapeTest.class);

    @Test
    void logLineHasConventions03Shape(CapturedOutput output) {
        MDC.put("requestId", "req-log-shape");
        try {
            log.info("log shape check");
        } finally {
            MDC.remove("requestId");
        }
        String json = output.toString();
        assertThat(json).contains("\"level\":\"info\"");
        assertThat(json).contains("\"service\":\"spring-svc\"");
        assertThat(json).contains("\"msg\":\"log shape check\"");
        assertThat(json).contains("\"requestId\":\"req-log-shape\"");
        assertThat(json).contains("\"ts\":\"");
    }
}
