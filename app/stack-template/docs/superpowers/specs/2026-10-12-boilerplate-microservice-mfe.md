# Epic Spec — Boilerplate Microservice + Micro-frontend

> Story: pending epic ID · tạo 2026-10-12 · pipeline: story-workflow CREATE
> Rev 2 — sau spec-critic vòng 1 (NO-GO): sửa 2 P0 (fe-shared ownership, activity event flow) + 7 P1 (auth claims, seed users, failure semantics, schema grants, standalone-copy, gateway topology, smoke/scaffold semantics)
> Rev 3 — sau plan-critic (NO-GO): P0 canonical tasks DDL + edge SF-7→SF-3; P1 compose pre-seed (không 3 SF cùng sửa compose), boot-smoke CI per service, event-push fire-and-forget, CORS dev có chủ, spike fe-shared ở SF-1, grant qua default privileges, users fixture chung, smoke = script committed, exit criteria CI-verifiable
> Repo: `__STACK_ORG__/architecture-overview` (greenfield — chỉ README, 1 commit)

## IDEA-BRIEF (8 chiều)

- **Task**: Phát triển boilerplate (khung mẫu copy-able) cho kiến trúc microservice + micro-frontend: contracts → platform → 3 services polyglot → FE shell + remotes → convergence + scaffold.
- **Output**: Cây thư mục code trong repo này — `docker compose up` (hoặc chạy native từng service) cho demo end-to-end qua browser; CI GitHub Actions xanh.
- **Users**: Dev team nội bộ — copy boilerplate để khởi tạo dự án mới; fresh-clone walkthrough checklist phải chạy được từ đầu đến cuối (SF-7).
- **Constraints**: Mixed-stack (Node/TS + Spring Boot + Go, mỗi stack 1 service); Module Federation 2.0 (Rspack, KHÔNG trộn bundler); multi-repo convention trong 1 repo (mỗi thư mục con = repo-con độc lập tooling, contract = OpenAPI contract-first); mock JWT + điểm cắm OIDC (không Keycloak thật); Docker Compose + CI cơ bản, k8s out-of-scope.
- **Input**: Không Figma, không code cũ. Domain sample: **task management**.
- **Context**: README hiện tại chỉ có docs Mermaid; Docker KHÔNG có trên dev machine (verify docker build qua CI; local demo chạy native); GH Actions enabled, quyền ADMIN.
- **Success criteria**: (1) `docker compose up` (trên CI/máy có Docker) → mở shell → login mock → CRUD task → activity feed — xuyên 3 service qua nginx gateway. (2) CI path-filtered xanh (build + test + docker build per stack). (3) Mỗi repo-con copy ra dùng độc lập được (kèm `frontend/shared` nếu nó import shared). (4) Scaffold script sinh project mới từ boilerplate, cùng flow chạy được.
- **Out-of-scope**: k8s/Helm; Keycloak thật; sản phẩm task management thật (chỉ sample đủ demo); message broker (Kafka…) — inter-service dùng REST sync; mobile app; i18n.

## Quyết định đã chốt (user, 2026-10-12)

| # | Quyết định | Chọn |
|---|---|---|
| 1 | Mục đích | Template nội bộ + sample e2e |
| 2 | Stack BE | Mixed: Node/TS + Spring Boot + Go (mỗi stack 1 service) |
| 3 | Micro-frontend | Module Federation (Rspack + @module-federation/enhanced) |
| 4 | Layout | Multi-repo convention — FE một phía, services một phía |
| 5 | Infra | Docker Compose + GitHub Actions CI; k8s out-of-scope |
| 6 | Nơi đặt | Repo này (mỗi thành phần = thư mục con = repo-con) |
| 7 | Auth | Mock JWT + điểm cắm OIDC |

Tự quyết theo conventions (ADR ghi ở SF-7): JDK 21 + Spring Boot 3.x (Web MVC, không reactive); Node 22 LTS + pnpm; Go 1.24.x + chi; React 19; Rspack (không Vite-MF); drizzle-orm (node-svc); Flyway (spring-svc); go-svc serve OpenAPI spec + swagger-ui static; Postgres 16 dùng chung (mỗi service 1 schema + migration); nginx gateway-lite; sample domain = task management; 1 story 7 SF, phased-release 3 phase.

## Kiến trúc sample (e2e flow chứng minh)

```
Browser → nginx gateway :8080
  ├─ /            → shell static (MF host)
  ├─ /remotes/*   → remote static (mỗi remote 1 nginx container riêng, remoteEntry.js)
  └─ /api/*       → services
       ├─ /api/tasks/*    → node-svc :3001 (task CRUD, Postgres schema `tasks`)
       │    └─ sau khi mutate task: POST /api/activity/events → go-svc (event "task.created")
       ├─ /api/users/*    → spring-svc :8081 (users + teams CRUD, Postgres schema `users`)
       │    └─ node-svc gọi REST validate user (timeout 2s; spring down → 503 fail-closed, ADR ghi phương án degrade)
       └─ /api/activity/* → go-svc :8082 (feed + stats; OWNS schema `activity` migration;
            ĐỌC-ONLY schema `tasks` qua postgres readonly role — grants cấp bởi compose init script SF-1)
Auth: auth-mock cấp JWT HS256 (claims: sub = user id spring, email, roles; TTL 8h; secret chia qua
compose env .env không-commit). Enforcement 2 lớp: gateway chặn thiếu-token (401), từng service
TỰ verify signature + expiry (không tin gateway). Token contract file trong contracts/.
```

Contract-first: `contracts/openapi/*.yaml` (tasks, users, activity, auth) là source of truth duy nhất cho API surface; **`contracts/db/tasks-schema.sql` là canonical DDL cho bảng `tasks`** — interface chung thật sự giữa node-svc (migration phải sinh ra đúng DDL) và go-svc (stats query theo đúng DDL); **`contracts/auth/users.json` là fixture users chung** — auth-mock và seed migration spring đọc CÙNG file. Mỗi service codegen models từ OpenAPI (không gen full client); CI lint (spectral) + contract test (schemathesis). Event push node→go là **fire-and-forget**: fail → JSON log warn, KHÔNG chặn mutation task, KHÔNG retry (ADR ghi trade-off).

## SF split (7 SF — rubric C1-C5/V1-V3, anti-duplicate áp dụng)

### Phase 1 — backend demo được (checkpoint: compose/CI build xanh + swagger + contract test)

**SF-1 · Contracts & Platform Foundation** (tier 0, ~16 tasks — deliberate bottleneck, trade-off ghi ADR: tách fe-shared thành SF riêng không đáng thêm 1 handoff)
- OpenAPI specs (tasks, users, activity — **event payload + feed response chứa đủ user-display fields FE cần render**, auth) + spectral rules + contract-test scaffold (schemathesis)
- **Canonical DDL** `contracts/db/tasks-schema.sql` (bảng `tasks` — nguồn cho migration node-svc và query go-svc)
- **Users fixture** `contracts/auth/users.json` (auth-mock + seed spring đọc chung)
- **Auth token contract file**: claims (sub/email/roles), TTL, secret phân phối, enforcement 2 lớp — commit trong `contracts/`
- Conventions pack: Dockerfile multi-stage pattern, healthcheck `/healthz`+`/readyz`, JSON log shape, error envelope, **port table (đủ: 3 svc + auth-mock + shell + 2 remotes dev + prod)**, env config qua env-var, **CORS dev-profile rule**
- **Gateway routing table** (`/` shell, `/remotes/*`, `/api/*`) + **remote registry** (tên MF remote + URL dev/prod, env-configurable)
- docker-compose **PRE-SEED đủ khung 3 services + postgres + nginx + auth-mock** (env inventory đầy đủ trong `.env.example`; **SF-2/3/4 KHÔNG sửa compose — chỉ điền impl**); postgres init script: tạo schemas + readonly role go-svc dùng **`ALTER DEFAULT PRIVILEGES IN SCHEMA tasks`** (grant vẫn hiệu lực khi bảng sinh sau bởi migration)
- nginx gateway config; auth-mock service (đọc users fixture)
- **`frontend/shared` (fe-shared)**: api client wrapper, MF bootstrap helper, token storage; kèm **spike tối thiểu hello-world remote load được** để pin React 19 + @module-federation/enhanced + Rspack CÓ CĂN CỨ ở tier 0; `pnpm-workspace.yaml` globs khai báo đủ `frontend/*`
- `.gitignore`/`.gitattributes` (eol=lf)/`.editorconfig`
- CI templates: path-filtered per service + **boot-smoke job pattern (container up + curl `/healthz` + `/readyz` + migration chạy xong)** + gitleaks
- README cập nhật kiến trúc thật

**SF-2 · node-svc — task API** (tier 1, ~9 tasks): Fastify+TS, codegen models, CRUD tasks, validate user qua spring-svc (timeout 2s, fail-closed 503), migration sinh đúng canonical DDL (exit: diff schema vs `contracts/db/tasks-schema.sql` = 0), push event fire-and-forget (log warn khi go-svc down), healthcheck, JSON logging, CORS dev-profile, tests (unit + contract), Dockerfile, **boot-smoke CI job**, swagger, README standalone (exit: docs đủ — chứng minh copy-dir là việc SF-7).

**SF-3 · spring-svc — user API** (tier 1, ~9 tasks): Spring Boot 3 Web MVC, users + teams CRUD, **seed migration đọc `contracts/auth/users.json`** (exit: id trùng khớp fixture), Postgres schema `users` + Flyway, healthcheck (actuator + `/readyz`), logback JSON shape chung, CORS dev-profile, tests (@SpringBootTest + contract), Dockerfile multi-stage với mvnw, **boot-smoke CI job**, swagger, README standalone.

**SF-4 · go-svc — activity API** (tier 1, ~9 tasks): Go 1.24 + chi, activity feed + stats (query theo canonical DDL), schema `activity` MÌNH migrate, nhận `POST /activity/events` (contract activity), healthcheck, slog JSON shape chung, CORS dev-profile, tests (unit + contract), Dockerfile multi-stage distroless, **boot-smoke CI job**, swagger-ui static, README standalone. **Exit criterion chứng minh readonly đọc được: seed rows bằng owner role → stats trả về đúng.**

### Phase 2 — FE demo được (checkpoint: shell chạy, 2 remote load, gọi service thật qua gateway)

**SF-5 · FE shell — MF host** (tier 2, ~9 tasks): Rspack + @module-federation/enhanced host; **task đầu: re-validation spike của SF-1 + fe-shared fit-check** (export API đủ dùng cho shell chưa — lệch phát hiện sớm, không giữa run); pnpm catalog ép singleton deps; routing + layout + nav; login mock JWT (dùng token-storage + api client từ `frontend/shared`); a11y baseline **có test**: route focus + skip link (vitest); error boundary + fallback khi remote load fail; tests; Dockerfile (nginx static); compose entry đã pre-seed — SF-5 chỉ điền impl + **boot-smoke CI job**; README standalone.

**SF-6 · FE remotes — tasks + activity** (tier 2, ~10 tasks): 2 remote apps cùng pattern; remote `tasks`: danh sách + tạo/sửa task (gọi node-svc qua gateway `/api/tasks`, đính JWT); remote `activity`: feed + stats (`/api/activity`); **cả hai import shared utilities từ `frontend/shared` (READ-ONLY với SF-6 — SF-1 sở hữu, sửa = flag)**; shared singletons theo catalog; mỗi remote tests + Dockerfile + compose impl (pre-seeded) + **boot-smoke CI job** + README standalone. Remote URLs đọc từ remote registry (env); dev server proxy theo conventions (native mode không cần CORS mở vì đi qua dev proxy). *Lưu ý vận hành: SF-5 ∥ SF-6 cùng regenerate root `pnpm-lock.yaml` — coordinator resolve theo checklist (lấy 1 phía + `pnpm install` lại), không gộp tay.*

**`frontend/shared` (fe-shared)**: package riêng, repo-con thứ 7, **SF-1 sở hữu** (api client wrapper, MF bootstrap helper, token storage, catalog). Standalone-copy định nghĩa: remote/shell copy KÈM fe-shared. — Đây là sửa P0-1 (spec-critic): không còn import chéo shell↔remote, không có dependency edge ẩn trong tier 2.

### Phase 3 — convergence (checkpoint: STORY-COMPLETE candidates)

**SF-7 · Convergence & Scaffold** (tier 3, ~10 tasks; **depends-on: SF-5, SF-6, VÀ TƯỜM MINH SF-2, SF-3, SF-4** — smoke chain login→tạo task→đọc feed cần đủ 3 service sống): compose e2e smoke **API-level qua gateway — script committed `scripts/smoke/e2e.sh` + CI job** (curl: login → tạo task → đọc feed), không ad-hoc tại checkpoint; browser walkthrough là human gate tại checkpoint, không vào CI; CI hoàn chỉnh (path-filter + docker build per stack + contract test + gitleaks + copy-dir standalone smoke: copy 1 service + fe-shared ra tmp → build/test); docs đồng bộ (README Mermaid = kiến trúc thật + ADR các quyết định + toolchain doc + fresh-clone walkthrough); scaffold script `scripts/scaffold/` (copy + rename + prune, không generator framework) — **Acceptance #7 yêu cầu script chạy được; nếu trễ thì scope-flag lên user, KHÔNG auto-complete bằng manual fallback**; security-audit checkpoint (secrets/exec-bit/lockfile); rà multi-stage + pinned base images.

## Phased-release

- Phase 1 COMPLETE = SF-1..4 merged + compose build xanh (CI) + swagger demo + contract test pass → **RELEASE CHECKPOINT 1** (security-audit gồm trong checkpoint).
- Phase 2 COMPLETE = SF-5..6 merged + shell demo 2 remote (local native dev servers nếu chưa có Docker) → **CHECKPOINT 2**.
- Phase 3 COMPLETE → STORY-COMPLETE candidates.

## Acceptance (epic-level, user-visible)

1. Mở shell trong browser → login (mock user) → thấy nav + 2 remote render.
2. Tạo task mới → hiện trong danh sách (đi qua node-svc, user được spring-svc validate).
3. Mở activity → thấy feed/stats phản ánh task vừa tạo (node-svc push event sang go-svc).
4. Toàn bộ request đi qua nginx gateway :8080 một cổng duy nhất; gateway chặn thiếu-token; service tự verify JWT (sai/hết hạn → 401 từ service).
5. Push → CI xanh: lint contract, test per service, build docker image per stack, **smoke e2e API-level**.
6. Copy một repo-con (service hoặc FE kèm `frontend/shared`) ra dùng riêng được theo README của nó — **CI có job copy-dir smoke chứng minh**.
7. Scaffold script sinh project mới (đổi tên) chạy được cùng flow e2e.

## Boundary epic-level

- Không merge vào `main` — mọi thứ trên nhánh đích `story-<epic-id>-micro-boilerplate`, PR do NGƯỜI merge.
- Docker không có trên dev machine: mọi verify docker qua CI; local demo = native per-service. Nếu user cài Docker Desktop giữa chừng → verify lại compose local trước checkpoint.
- Thiếu JDK/Go local: build/test Java+Go chạy trong Docker (CI) hoặc toolchain-in-Docker local; mvnw đi kèm spring-svc.
- `frontend/shared` chỉ SF-1 sửa; SF-5/6 tiêu thụ READ-ONLY (đụng = flag lên coordinator).
