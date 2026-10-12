package com.example.springsvc.security;

import com.example.springsvc.web.ErrorEnvelope;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * JWT enforcement mọi route TRỪ: /healthz, /readyz, /actuator/**, /v3/api-docs/**,
 * /swagger-ui/** (docs chỉ schema tài liệu — precedent auth-mock) và mọi OPTIONS
 * preflight (preflight không mang Authorization — chặn = CORS native gãy).
 * Fail bất kỳ → 401 TỪ SERVICE với envelope conventions/04. Request id:
 * echo X-Request-Id (gateway sinh nếu thiếu — conventions/03).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Set<String> EXACT_SKIP = Set.of("/healthz", "/readyz", "/actuator");
    private static final List<String> PREFIX_SKIP = List.of("/actuator/", "/v3/api-docs", "/swagger-ui");

    private final JwtVerifier verifier;
    private final ObjectMapper mapper;

    public JwtAuthFilter(JwtVerifier verifier, ObjectMapper mapper) {
        this.verifier = verifier;
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (shouldSkip(request)) {
            chain.doFilter(request, response);
            return;
        }

        String requestId = requestId(request);
        MDC.put("requestId", requestId);
        try {
            String auth = request.getHeader("Authorization");
            if (auth == null || !auth.startsWith("Bearer ")) {
                unauthorized(response, requestId, "Missing Bearer token");
                return;
            }
            try {
                Claims claims = verifier.verify(auth.substring(7).trim());
                request.setAttribute("jwt.claims", claims);
                // ContentCaching: controller đọc key-presence raw body (vd PATCH roles:[])
                chain.doFilter(new ContentCachingRequestWrapper(request), response);
            } catch (JwtException | IllegalArgumentException e) {
                // KHÔNG log token — chỉ log lý do chung (conventions/03)
                unauthorized(response, requestId, "Invalid or expired token");
            }
        } finally {
            MDC.remove("requestId");
        }
    }

    private boolean shouldSkip(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true; // CORS preflight
        }
        String path = request.getRequestURI();
        return EXACT_SKIP.contains(path)
                || PREFIX_SKIP.stream().anyMatch(path::startsWith);
    }

    private String requestId(HttpServletRequest request) {
        String fromGateway = request.getHeader("X-Request-Id");
        return fromGateway != null && !fromGateway.isBlank() ? fromGateway : UUID.randomUUID().toString();
    }

    private void unauthorized(HttpServletResponse response, String requestId, String message) throws IOException {
        ErrorEnvelope.write(response, mapper, 401, "UNAUTHORIZED", message, requestId);
    }
}
