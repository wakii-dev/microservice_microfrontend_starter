package com.example.springsvc.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * CORS dev-profile — platform/conventions/07: chỉ profile "dev" (native dev,
 * không docker) mở CORS cho đúng origin trong CORS_DEV_ORIGIN (comma list);
 * prod/compose → bean không active → không ACAO nào emit (deny-by-default).
 */
@Configuration
@Profile("dev")
public class DevCorsConfig implements WebMvcConfigurer {

    private final String originsConfig;

    public DevCorsConfig(org.springframework.core.env.Environment env) {
        this.originsConfig = env.getProperty("app.cors-dev-origins", "");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = Arrays.stream(originsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        if (origins.isEmpty()) {
            return; // deny-by-default — không emit ACAO
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PATCH")
                .allowedHeaders("Authorization", "Content-Type", "X-Request-Id")
                .exposedHeaders("X-Request-Id");
    }
}
