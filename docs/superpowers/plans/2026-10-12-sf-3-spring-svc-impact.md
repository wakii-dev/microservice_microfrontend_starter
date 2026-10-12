# Phase 0 — Impact Analysis — SF-3 spring-svc (FI-71)

> Story FI-62 · spec rev 3 · slice: `docs/superpowers/contexts/sf-3.md` · worktree `wakii-dev/sf-3-spring-svc`
> Tier: Full (9 tasks). Chạy autonomous theo brief — decisions đã chốt ở epic, không hỏi lại.

## 1. Problem framing

spring-svc chưa tồn tại (chỉ README placeholder từ SF-1) → acceptance epic #2 (node-svc validate
assignee qua REST) gãy ở integration, acceptance #4 (service tự verify JWT) không chứng minh được.
spring-svc là **source-of-truth users/teams**: seed PHẢI khớp `contracts/auth/users.json` 100%
vì auth-mock (SF-1) đọc cùng fixture — lệch id = login user A nhưng validate user id không tồn tại.

Constraints chốt: dev machine KHÔNG Docker + KHÔNG JDK (đã probe: `java`, `docker`, `mvn` đều vắng)
→ mọi build/test/docker verify **qua CI**; KHÔNG sửa compose/contracts/conventions; KHÔNG Keycloak.

## 2. Touch map

```
services/spring-svc/**                        [SỞ HỮU — tạo mới: pom.xml, mvnw, src/**, Dockerfile, .dockerignore, README]
.github/workflows/services-spring-svc.yml     [TẠO MỚI — copy từ .github/workflow-templates/services-ci.yml.example]
docs/superpowers/evidence/sf-3/**             [TẠO MỚI — evidence convention B1+]
platform/docker-compose.yml                   [READ-ONLY — entry pre-seed: SPRING_DATASOURCE_*, JWT_SECRET, USERS_FIXTURE_PATH]
platform/conventions/*, contracts/**          [READ-ONLY]
platform/.env.example                         [READ-ONLY]
```

Drift-guard duy nhất phát sinh: snapshot `contracts/openapi/users.yaml` phải nằm trong Docker
build context (context = `services/spring-svc` — compose `build: ../services/spring-svc` không
thấy `contracts/`). Snapshot commit tại `services/spring-svc/src/main/resources/openapi/users.yaml`
(bit-identical) + CI diff-guard chặn drift. Đây là file SF-3 sở hữu, KHÔNG đụng contracts/.

## 3. Second-order effects (multi-dimension)

| Dimension | Assessment | Risk/gap |
|-----------|-----------|----------|
| Functional | CRUD users/teams khớp users.yaml; seed 3 fixture users | Seed lệch id → acceptance #2 gãy; assert trong test là bắt buộc |
| Technical/architecture | Spring Boot 3 Web MVC + Flyway + Spring Data JPA; mount `/api/users`, `/api/teams`; healthz/readyz naked | Role `spring_svc` có `search_path=users` (init script) → Hibernate resolve đúng schema mà không đụng JDBC URL |
| Data | Schema `users`: users, teams, team_members; id UUID cố định từ fixture | Flyway Java migration đọc `USERS_FIXTURE_PATH` (env, compose mount sẵn) — đọc file thật = khớp 100% theo cấu trúc, không hardcode |
| Performance | CRUD demo-scale; limit/offset list users | Không hot path; bỏ qua tối ưu |
| Security | JWT HS256 service-side: signature + exp + iss, mọi route trừ healthz/readyz/swagger-docs | Secret từ env `JWT_SECRET` (compose inject); fail-fast khi thiếu; KHÔNG log token |
| Backward-compat | Greenfield — không consumer hiện hữu ngoài contract | node-svc (SF-2) ghép sau: GET /users/{id} 404 → UNPROCESSABLE |
| UX | Swagger UI qua host port 8081 | Gateway chỉ route `/api/users/*` có presence-check → swagger KHÔNG truy cập được qua :8080 (giới hạn gateway SF-1, không phải bug SF-3) |
| Maintenance | mvnw wrapper committed; codegen maven plugin types-only | Local không JDK → mvnw không chạy native; toolchain-in-Docker trong CI là đường chính (đúng brief) |
| Operational | /healthz liveness + /readyz (Flyway xong + DB query thật); logback LogstashEncoder JSON shape conventions/03; error envelope conventions/04 | Compose entry spring-svc KHÔNG có block `healthcheck` (pre-seed SF-1) → FLAG (mention) cho coordinator, SF-3 không tự sửa |
| Business | Bước bắt buộc Phase 1 checkpoint | Trễ SF-3 → SF-7 convergence trễ |

**Skips có chủ đích**: Performance (demo boilerplate, không SLA), Business (tier position đã chốt ở epic).

## 4. Alternatives (design forks)

- **A. Seed bằng SQL tĩnh hardcode id**: nhanh nhưng lệch fixture khi fixture đổi — vi phạm "đọc cùng file". LOẠI.
- **B. Flyway Java migration đọc `USERS_FIXTURE_PATH` runtime (CHỌN)**: đọc file thật qua mount compose; id khớp theo cấu trúc; test assert DB == fixture. Trade-off: Java migration phức tạp hơn SQL — chấp nhận vì đúng chữ spec.
- **C. App-level runner (CommandLineRunner) seed**: seed ngoài Flyway = mất idempotent-versioning, /readyz không gate được "seed xong". LOẠI.
- **JWT verify: jjwt + filter tự viết (CHỌN) vs spring-security-oauth2-resource-server**: 1 secret HS256 + 3 claims — resource server kéo cả security filter chain + config magic; filter ~80 dòng kiểm soát rõ, envelope 401 đúng conventions/04 dễ map. Trade-off ghi ADR trong README (điểm cắm OIDC: đổi filter sang JWKS sau).

## 5. Risks / unknowns

| Risk | Mitigation |
|------|-----------|
| Không build/test local được (không JDK, không Docker) | Vòng verify = push + watch `gh run watch` (gh auth OK); chi phí mỗi vòng ~5-8 phút → viết test cẩn thận trước, gom commit hợp lý |
| Flyway Java migration + Hibernate schema resolution trên role search_path | Đã verify init script: `ALTER ROLE spring_svc SET search_path = users` + GRANT USAGE, CREATE |
| Snapshot users.yaml drift với contracts/ | CI job thêm bước `diff` 2 file — fail nếu lệch |
| H2 compat cho @SpringBootTest | Tránh rủi ro: CI build-test job dùng **postgres service container** thật (GitHub Actions `services:`); không phụ thuộc H2 |
| mvnw binary trên Windows | CI chạy Linux; mvnw là shell script chuẩn — không cần .cmd cho CI (kèm luôn mvnw.cmd cho dev có JDK) |

## Verdict

GO — scope khớp context pack, không gap cần hỏi lại epic. Direction B+jjwt (mục 4) là lựa chọn
duy nhất khớp nguyên văn spec slice (seed ĐỌC file fixture; codegen qua maven plugin).
