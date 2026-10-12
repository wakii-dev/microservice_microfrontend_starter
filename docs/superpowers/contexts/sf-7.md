# SF-7 Context Pack — Convergence & Scaffold
> Đọc file này THAY VÌ tự tổng hợp từ bracket + epic + comments.
> Epic spec: `docs/superpowers/specs/2026-10-12-boilerplate-microservice-mfe.md` (rev 3). Bracket: `docs/superpowers/mindmaps/micro-boilerplate.wakii`.

## Spec slice (chỉ phần SF-7 chịu trách nhiệm)
1. **Smoke e2e API-level COMMITTED**: `scripts/smoke/e2e.sh` (curl: login auth-mock → tạo task node-svc → đọc feed go-svc; assert kết quả) + CI job chạy nó trên compose stack — KHÔNG ad-hoc tại checkpoint, KHÔNG browser trong CI (browser walkthrough = human gate tại checkpoint).
2. CI hoàn chỉnh: path-filter + docker build per stack + contract test + gitleaks + **copy-dir standalone smoke** (copy 1 service + `frontend/shared` ra tmp → build/test pass).
3. Docs đồng bộ: README Mermaid = kiến trúc thật; ADR ghi các quyết định (mixed stack, MF/Rspack, contract-first, readonly schema trade-off, fail-closed vs degrade, fire-and-forget events, fork-not-upgrade model); toolchain doc (JDK/Go/Node/pnpm/docker needed where); fresh-clone walkthrough checklist.
4. Scaffold script `scripts/scaffold/`: copy + rename + prune (không generator framework) — sinh project mới đặt tên riêng, chạy được cùng flow. **Nếu trễ: scope-flag lên user — KHÔNG auto-complete bằng manual fallback.**
5. Security-audit checkpoint: secrets/exec-bit/lockfile/deps scan (OWASP surface + repo hygiene).
6. Rà multi-stage + pinned base images toàn bộ Dockerfile.
7. Compose health-gated depends_on hoàn chỉnh (service_healthy chain) — e2e không flaky vì race.

## Touch map (files SF-7 tạo/sở hữu)
```
scripts/smoke/e2e.sh             [SỞ HỮU]
scripts/scaffold/**              [SỞ HỮU]
.github/workflows/*              [SỞ HỮU riêng file convergence — SF-1 templates READ-ONLY, có gì thiếu flag]
docs/** (ADR, walkthrough)       [SỞ HỮU]
README.md                        [SỬA lần cuối — đồng bộ]
platform/docker-compose.yml      [SỬA: health-gated depends_on — SF-7 được phép vì là convergence; mọi sửa khác flag]
services/* frontend/*            [READ-ONLY toàn bộ — bug thấy được = report, KHÔNG fix]
```

## ACCEPTANCE (user-visible)
- CI job e2e smoke xanh: script curl login → tạo task → đọc feed qua gateway — chứng minh chuỗi 3 service liền mạch.
- Copy-dir smoke xanh: ≥1 service + fe-shared copy ra tmp build/test được — chứng minh standalone.
- Scaffold: chạy script → thư mục project mới → cùng flow chạy được (CI verify scaffold output build được).
- README + ADR + fresh-clone walkthrough đọc theo được một người mới chạy từ đầu.
- Security-audit: 0 P0/P1 còn mở.

## Boundary (KHÔNG làm)
- KHÔNG fix bug business logic trong services/FE (report lại coordinator — SF sở hữu fix).
- KHÔNG merge vào `main` / KHÔNG tạo PR thay người (PR agent tạo nhưng merge là human gate — outside SF-7 scope, coordinator làm).
- KHÔNG thêm tính năng mới — chỉ hội tụ + chứng minh cái đã có.
