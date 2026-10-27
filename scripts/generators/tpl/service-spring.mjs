// service-spring.mjs — template Spring Boot 3 service (gen-service --lang spring).
// KHUNG tối giản theo conventions: 01 Dockerfile (temurin JRE alpine, USER 1001,
// healthcheck ở compose), 02 health naked+mirror, 03 logback pattern (root env),
// 04 error envelope qua @RestControllerAdvice, 05 SERVER_PORT env, 06 env
// fail-fast (JwtVerifier bắt secret), 07 CORS @Profile("dev"), 08 prefix
// /api/<name> + JwtVerifyFilter. Pin version MIRROR spring-svc (pom ở trên).
// mvnw + .mvn wrapper generator COPY từ services/spring-svc (không sinh được).
// ctx: { name, pascal, camel, scream, port, db, pkg } — pkg = com.example.<camel>.

function pom(ctx) {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.5</version>
    <relativePath/>
  </parent>
  <groupId>com.example</groupId>
  <artifactId>` +
    ctx.name +
    `</artifactId>
  <version>0.1.0</version>
  <name>` +
    ctx.name +
    `</name>
  <description>` +
    ctx.pascal +
    ` API — sinh bởi scripts/generators gen-service (--lang spring)</description>

  <properties>
    <java.version>21</java.version>
    <jjwt.version>0.12.6</jjwt.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-api</artifactId>
      <version>\${jjwt.version}</version>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-impl</artifactId>
      <version>\${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>io.jsonwebtoken</groupId>
      <artifactId>jjwt-jackson</artifactId>
      <version>\${jjwt.version}</version>
      <scope>runtime</scope>
    </dependency>
` +
    (ctx.db
      ? `    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
`
      : '') +
    `    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
`
  );
}

const appYml = (ctx) =>
  `# ` +
  ctx.name +
  ` config — 100% env-var (platform/conventions/06), fail-fast secret ở JwtVerifier.
server:
  port: \${SERVER_PORT:` +
  ctx.port +
  `} # conventions/05-ports.md

spring:
  application:
    name: ` +
  ctx.name +
  `
` +
  (ctx.db
    ? `  datasource:
    url: \${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/boilerplate}
    username: \${SPRING_DATASOURCE_USERNAME:` +
      ctx.dbRole +
      `}
    password: \${SPRING_DATASOURCE_PASSWORD:}
`
    : '') +
  `app:
  jwt-secret: \${JWT_SECRET:} # fail-fast validate ở JwtVerifier (conventions/06 rule 6)
  cors-dev-origins: \${CORS_DEV_ORIGIN:} # CORS @Profile("dev") — conventions/07

logging:
  level:
    root: \${LOG_LEVEL:info}
`;

function applicationJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ` +
    ctx.pascal +
    ` — sinh bởi scripts/generators gen-service (--lang spring).
 * Conventions: platform/conventions/ (02 health, 03 log, 04 envelope, 05 port,
 * 06 env fail-fast, 07 CORS dev, 08 prefix + JWT verify).
 */
@SpringBootApplication
public class ` +
    ctx.pascal +
    `Application {
    public static void main(String[] args) {
        SpringApplication.run(` +
    ctx.pascal +
    `Application.class, args);
    }
}
`
  );
}

function jwtVerifierJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Verify JWT HS256 (signature + expiry) — service TỰ verify, gateway chỉ
 * presence-check (conventions/08 rule 4). Fail-fast: secret rỗng lúc boot →
 * IllegalStateException (conventions/06 rule 6).
 */
@Component
public class JwtVerifier {
    private final SecretKey key;

    public JwtVerifier(@Value("\${app.jwt-secret:}") String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET rỗng — set env trước khi boot (conventions/06)");
        }
        this.key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public boolean verify(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
`
  );
}

function jwtFilterJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.security;

import ` +
    ctx.pkg +
    `.web.ErrorEnvelope;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Chặn mọi /api/` +
    ctx.name +
    `/** trừ health (conventions/02 — probes không-auth).
 * Thiếu/sai token → 401 envelope chung (conventions/04).
 */
@Component
public class JwtVerifyFilter extends OncePerRequestFilter {
    private static final List<String> EXEMPT = List.of("/healthz", "/readyz");
    private final JwtVerifier verifier;

    public JwtVerifyFilter(JwtVerifier verifier) {
        this.verifier = verifier;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getRequestURI();
        return EXEMPT.contains(p) || p.startsWith("/api/` +
    ctx.name +
    `/healthz") || p.startsWith("/api/` +
    ctx.name +
    `/readyz") || !p.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
        if (token == null || !verifier.verify(token)) {
            ErrorEnvelope.write(response, 401, "UNAUTHORIZED",
                    token == null ? "Missing Authorization header" : "Invalid or expired token",
                    request.getHeader("X-Request-Id"));
            return;
        }
        chain.doFilter(request, response);
    }
}
`
  );
}

function errorEnvelopeJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.web;

import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Error envelope chung (conventions/04) — mọi 4xx/5xx đi qua đây.
 */
@RestControllerAdvice
public class ErrorEnvelope {

    public record ApiError(String code, String message, String requestId, Object details) {}

    public record Wrapped(ApiError error) {}

    public static void write(HttpServletResponse response, int status, String code, String message, String requestId)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(
                "{\\"error\\":{\\"code\\":\\"" + code + "\\",\\"message\\":\\"" + message
                        + "\\",\\"requestId\\":" + (requestId == null ? "null" : "\\"" + requestId + "\\"")
                        + ",\\"details\\":null}}");
    }

    public static ResponseEntity<Wrapped> of(HttpStatus status, String code, String message, String requestId) {
        return ResponseEntity.status(status).body(new Wrapped(new ApiError(code, message, requestId, null)));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Wrapped> validation(MethodArgumentNotValidException e,
            jakarta.servlet.http.HttpServletRequest request) {
        return of(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "payload sai schema", request.getHeader("X-Request-Id"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Wrapped> internal(Exception e, jakarta.servlet.http.HttpServletRequest request) {
        // KHÔNG lộ stack trong message (conventions/04)
        return of(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL", "Internal error", request.getHeader("X-Request-Id"));
    }
}
`
  );
}

function healthControllerJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.web;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Naked probes (conventions/02): /healthz liveness, /readyz readiness.
 * Body shape CỐ ĐỊNH {"status":"ok"} — CI boot-smoke grep đúng shape này.
 * readyz hiện luôn-ok (chưa có dep) — KHI THÊM DB/deps: kiểm dep THẬT (rule 2,
 * pattern spring-svc ReadinessService).
 */
@RestController
public class HealthController {

    public static final Map<String, String> OK = Map.of("status", "ok");

    @GetMapping("/healthz")
    public Map<String, String> healthz() {
        return OK;
    }

    @GetMapping("/readyz")
    public Map<String, String> readyz() {
        return OK;
    }

    // mirror dưới prefix /api/<name> (conventions/02 rule 6 — contract test)
    @GetMapping("/api/` +
    ctx.name +
    `/healthz")
    public Map<String, String> healthzMirror() {
        return OK;
    }

    @GetMapping("/api/` +
    ctx.name +
    `/readyz")
    public Map<String, String> readyzMirror() {
        return OK;
    }
}
`
  );
}

function itemsControllerJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SAMPLE items (conventions/08 — dưới prefix /api/<name>). THAY bằng domain
 * thật: sửa contracts/openapi/` +
    ctx.name +
    `.yaml TRƯỚC rồi code theo sau (contract-first).
 */
@RestController
@RequestMapping("/api/` +
    ctx.name +
    `")
public class ItemsController {

    public record Item(long id, String name, String createdAt) {}

    public record CreateItemRequest(@NotBlank @Size(max = 200) String name) {}

    private final Map<Long, Item> store = new ConcurrentHashMap<>();
    private final AtomicLong seq = new AtomicLong();

    @GetMapping("/items")
    public Map<String, Object> list() {
        List<Item> items = List.copyOf(store.values());
        return Map.of("items", items, "total", items.size());
    }

    @PostMapping("/items")
    public Item create(@Valid @RequestBody CreateItemRequest body) {
        long id = seq.incrementAndGet();
        Item item = new Item(id, body.name(), java.time.Instant.now().toString());
        store.put(id, item);
        return item;
    }
}
`
  );
}

function devCorsJavaV2(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS dev-profile (conventions/07) — bean CHỈ active profile "dev". Origin đọc
 * app.cors-dev-origins (env CORS_DEV_ORIGIN, phẩy) — KHÔNG hardcode, KHÔNG *
 * kèm credentials. Compose/prod: không bean → không ACAO nào emit (deny-default).
 */
@Configuration
@Profile("dev")
public class DevCorsConfig implements WebMvcConfigurer {

    private final String[] origins;

    public DevCorsConfig(@Value("\${app.cors-dev-origins:}") String origins) {
        this.origins = origins == null || origins.isBlank() ? new String[0]
                : java.util.Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty())
                        .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PATCH", "DELETE")
                .allowedHeaders("Authorization", "Content-Type", "X-Request-Id");
    }
}
`
  );
}

function healthTestJava(ctx) {
  return (
    `package ` +
    ctx.pkg +
    `.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/** Smoke conventions: health shape (02) + 401 envelope (04) + JWT filter (08). */
@SpringBootTest(properties = "app.jwt-secret=test-secret-not-real-32chars-xxxxxxx")
@AutoConfigureMockMvc
class HealthCheckTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void healthzShapeOk() throws Exception {
        mvc.perform(get("/healthz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void apiWithoutTokenReturns401Envelope() throws Exception {
        mvc.perform(get("/api/` +
    ctx.name +
    `/items"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }
}
`
  );
}

function dockerfile(ctx) {
  return (
    `# ` +
    ctx.name +
    ` — theo platform/conventions/01-dockerfile-pattern.md (Spring Boot).
# Healthcheck KHÔNG khai ở đây (conventions/01 rule 4) — compose là một nguồn duy nhất.

# deps stage — mvnw tải dependency vào layer cache riêng
FROM eclipse-temurin:21-jdk-alpine AS deps
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B dependency:go-offline

# build stage
FROM deps AS build
COPY src src
RUN ./mvnw -B package -DskipTests

# runtime stage — JRE-only, jar fat
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1001
EXPOSE ` +
    ctx.port +
    `
ENTRYPOINT ["java", "-jar", "app.jar"]
`
  );
}

function readmeMd(ctx) {
  return (
    `# ` +
    ctx.pascal +
    ` (` +
    ctx.name +
    `) — Spring Boot 3

Sinh bởi \`scripts/generators/gen-service.mjs\` (--lang spring) — khung theo conventions, impl domain là việc tiếp theo.

| Hạng mục | Giá trị |
|---|---|
| Port | ` +
    ctx.port +
    ` (env \`SERVER_PORT\` — conventions/05) |
| Health | \`/healthz\` + \`/readyz\` naked + mirror \`/api/` +
    ctx.name +
    `/*\` (conventions/02) |
| Auth | \`JwtVerifyFilter\` tự verify HS256 — gateway chỉ presence-check (conventions/08 rule 4) |
| Contract | \`contracts/openapi/` +
    ctx.name +
    `.yaml\` (stub — sửa TRƯỚC khi impl) |

## Việc tiếp theo (AI directives)

1. \`cd services/` +
    ctx.name +
    ` && ./mvnw test\` — khung có HealthCheckTest smoke (cần mvnw wrapper: generator copy từ services/spring-svc).
2. Sửa \`contracts/openapi/` +
    ctx.name +
    `.yaml\` thay SAMPLE \`items\` → \`pnpm lint:contracts\` → impl controller thật.
3. \`readyz\`: khi thêm DB (Flyway) → kiểm migration+DataSource thật (pattern spring-svc ReadinessService).
4. Đổi package \`com.example\` nếu org khác — đồng bộ pom groupId.
`
  );
}

/** Trả { relPath: content } — toàn bộ file của service Spring (trừ mvnw wrapper). */
export function serviceSpringFiles(ctx) {
  return {
    'pom.xml': pom(ctx),
    'src/main/resources/application.yml': appYml(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/' + ctx.pascal + 'Application.java']: applicationJava(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/security/JwtVerifier.java']: jwtVerifierJava(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/security/JwtVerifyFilter.java']: jwtFilterJava(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/web/ErrorEnvelope.java']: errorEnvelopeJava(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/web/HealthController.java']: healthControllerJava(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/web/ItemsController.java']: itemsControllerJava(ctx),
    ['src/main/java/' + ctx.pkg.replace(/\./g, '/') + '/config/DevCorsConfig.java']: devCorsJavaV2(ctx),
    ['src/test/java/' + ctx.pkg.replace(/\./g, '/') + '/web/HealthCheckTest.java']: healthTestJava(ctx),
    Dockerfile: dockerfile(ctx),
    '.dockerignore': 'target/\n',
    'README.md': readmeMd(ctx),
  };
}
