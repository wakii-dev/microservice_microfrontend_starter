package com.example.springsvc.web;

import io.jsonwebtoken.Claims;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Endpoint test cho JwtAuthFilterTest — chỉ tồn tại trong test classpath.
 * Echo `sub` của JWT để chứng minh claims verify được rồi mới tới handler.
 */
@RestController
public class TestPingController {

    @GetMapping("/api/test/ping")
    public Map<String, String> ping(@RequestAttribute("jwt.claims") Claims claims) {
        return Map.of("sub", claims.getSubject());
    }
}
