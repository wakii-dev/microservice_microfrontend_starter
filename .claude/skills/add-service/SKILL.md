---
name: add-service
description: Use when cần thêm microservice mới vào services/ của boilerplate — "tạo service", "thêm notification-svc", service consume Kafka task-events, service có DB riêng, thêm BE service. KHÔNG dùng khi sửa service có sẵn (task thường), scaffold project mới (scripts/scaffold/scaffold.sh), hay thêm FE remote (playbook FE archetype).
---

# add-service — thêm service mới vào boilerplate

## Overview

Thủ tục theo tầng contracts-first: **khung boot xanh TRƯỚC, impl SAU, hội tụ CUỐI**.
Nguồn sự thật kỹ thuật là `platform/conventions/01–09` + `docs/wakii-playbook.md` (archetype
NS) — skill này chỉ đóng khung THỨ TỰ + GATES + lệnh verify. Không copy convention vào đây.

## Phase 0 — HỎI trước khi tính slice (không tự quyết)

5 câu hỏi đổi hình dạng toàn bộ việc còn lại — đặt cho user/epic, kèm khuyến nghị:

| Câu hỏi | Đổi gì |
|---|---|
| Sync hay async? | Có Kafka → conventions/09 + topic tạo tường minh trước consumer subscribe |
| Ngôn ngữ? (Node/Spring/Go — cấm stack ngoài 3 cái, ADR-0001) | Node ngoài workspace → standalone lockfile; Go → distroless (không healthcheck shell, gate `service_started`) + drift-guard snapshot |
| Có DB riêng? | DDL `contracts/db/` + role schema-only trong `platform/postgres/init/01-init.sh` |
| Port mấy? | Quy tắc 4 chỗ cùng commit: conventions/05 + .env.example + compose + README |
| FE có hiển thị? | Có → tách SF riêng (playbook NS), không gộp vào SF impl |

Rồi chốt: **story mode 4 SF** (mặc định cho service mới) hay single workflow (service cực nhỏ,
không Kafka, không DB). Phải là story được duyệt — compose/gateway/init là file dùng chung có
boundary "đụng = flag coordinator kèm gap-answer" (header docker-compose.yml).

## Công thức 4 SF — mỗi SF có checkpoint tường minh

**SF-1 · Khung (tier 0) — DONE khi `docker compose up` riêng service boot + healthcheck xanh,
impl còn rỗng:**
1. `contracts/openapi/<svc>.yaml` (mẫu: `contracts/openapi/activity.yaml` — nhỏ nhất) — healthz +
   readyz **mirror cả naked lẫn dưới prefix** (schemathesis 404 nếu thiếu — conventions/02 rule 6)
   → verify: `pnpm lint:contracts`
2. Nếu có DB: `contracts/db/<svc>-schema.sql` (mirror `tasks-schema.sql`, dedupe key là
   envelope_id — KHÔNG taskId) + role/schema-only trong init script → verify: fresh volume
   (`docker compose down -v && up -d postgres`) rồi `\dn <schema>` + login role
3. Compose entry qua **gap-answer cho coordinator** (port/env/healthcheck/depends_on — KHÔNG
   depends_on kafka, lazy-connect) → verify: `docker compose -f platform/docker-compose.yml
   --env-file platform/.env.example config -q`
4. `.env.example` thêm biến `:?set` fail-fast (password = placeholder `change-me-*` — gitleaks)
5. CI copy `.github/workflow-templates/services-ci.yml.example` → `services-<svc>.yml`
   (path filter kèm contracts path + `permissions: contents: read`) → verify: ruby YAML parse
6. Dockerfile theo conventions/01; gateway thêm block `location = /api/<svc>` (exact!) +
   `location /api/<svc>/` với presence-check 401 (thiếu exact-match → rơi vào `location /` nhận
   HTML của shell)

**SF-2 · Impl API (tier 1):** theo spec SF-1 đã chốt; JWT verify 2 lớp (gateway presence ≠
enforcement); error handler map mọi lỗi sang envelope conventions/04 → verify: unit + integration
test, `docker build`, curl healthz/readyz + 401 sai token.

**SF-3 · Async + FE (tier 1, song song SF-2 nếu tách vùng file):** consumer idempotent —
dedupe qua envelope_id, manual offset commit CHỈ sau DB tx, retry ×3 → DLQ; đăng ký consumer
group vào `contracts/events/task-events.md` (+1 dòng, KHÔNG bịa event type mới); FE nếu có →
SF riêng → verify: publish golden fixture từ `contracts/events/fixtures/` ×2, total không đổi
lần 2 (idempotency chứng minh được).

**SF-4 · Convergence (tier 2):** mở rộng `scripts/smoke/e2e.sh` (giữ exit-code theo bước) +
convergence CI; docs sync **cùng commit**: conventions 02/03/05/06/08(/09) + README + CLAUDE.md +
orca.yaml + walkthrough → verify: `bash scripts/smoke/e2e.sh` PASS + `grep -rn "<số services cũ>"
README.md CLAUDE.md orca.yaml` = rỗng.

## Bẫy đã trả giá thật (trả trước bằng CI đỏ)

| Bẫy | Hậu quả | Chặn |
|---|---|---|
| pgdata volume cũ thiếu role/schema mới | boot fail, tưởng code sai | `docker compose down -v` 1 lần; ghi vào walkthrough |
| Consumer subscribe trước topic tồn tại | kẹt im lặng — 0 fetch 0 error | tạo topic TRƯỚC boot consumer (conventions/09) |
| Dedupe bằng taskId | mất event hợp lệ khi re-assign | dedupe bằng envelope_id (+recipient nếu fanout) |
| Thiếu `location =` exact-match | GET /api/<svc> trả HTML 404 của shell | 2 block: exact + prefix |
| Quên 1/4 chỗ của port | review fail (gotcha tường minh) | 4 chỗ trong 1 commit |
| Commit offset trước tx | mất event khi crash | manual commit sau DB commit |
| `.env` commit / password thật | gitleaks đỏ | chỉ `.env.example` + placeholder |

## Đóng story

Full suite (`test_all` trong orca.yaml + service mới) → evidence `docs/superpowers/evidence/`
(test-run ghi HEAD tại code commit cuối) → review độc lập → `story-verify` → **coordinator
merge** (executor không tự merge) → post-task-ritual + improvements-log.
