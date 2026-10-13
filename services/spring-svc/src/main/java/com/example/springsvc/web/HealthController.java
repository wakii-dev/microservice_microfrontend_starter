package com.example.springsvc.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Naked probes (conventions/02): /healthz liveness (process sống),
 * /readyz readiness (Flyway xong + DB pass). Body shape CỐ ĐỊNH
 * {"status":"ok"} — CI boot-smoke grep đúng shape này.
 * 503 readiness trả envelope conventions/04 (code DEPENDENCY_DOWN catalog).
 */
@RestController
public class HealthController {

    public static final Map<String, String> OK = Map.of("status", "ok");

    private final ReadinessService readiness;
    private final ObjectMapper mapper;
    private final HttpServletRequest request;

    public HealthController(ReadinessService readiness, ObjectMapper mapper, HttpServletRequest request) {
        this.readiness = readiness;
        this.mapper = mapper;
        this.request = request;
    }

    @GetMapping("/healthz")
    public Map<String, String> healthz() {
        return OK;
    }

    @GetMapping("/readyz")
    public ResponseEntity<Object> readyz() {
        if (readiness.isReady()) {
            return ResponseEntity.ok(OK);
        }
        String requestId = request.getHeader("X-Request-Id");
        return ResponseEntity.status(503)
                .body(new ErrorEnvelope.ErrorWrapper(ApiError.of("DEPENDENCY_DOWN", "Service not ready", requestId)));
    }
}
