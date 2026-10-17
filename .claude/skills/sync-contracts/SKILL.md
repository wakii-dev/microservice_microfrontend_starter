---
name: sync-contracts
description: Use when sửa API hoặc contract của boilerplate — thêm field vào task/user/event, thêm endpoint, đổi OpenAPI spec, đổi DDL/schema, đổi event payload, "thêm trường", "sửa tasks.yaml", spec lệch code. KHÔNG dùng khi thêm service nguyên con (skill add-service), sửa UI-only không đụng API, hay fix không đổi contract.
---

# sync-contracts — sửa API theo vòng contracts-first

## Overview

Contract là source of truth: **spec TRƯỚC, code theo sau, verify bằng CI đã có sẵn**
(spectral, drift-guard, schemathesis, schema-diff test — KHÔNG tự chế gate mới). Skill này
là THỨ TỰ + QUY TẮC ĐỒNG BỘ CẶP; chi tiết convention nằm ở `platform/conventions/04` (envelope)
+ README từng service.

## Bước 0 — Phân loại thay đổi (quyết story mode, không bỏ qua)

| Loại | Ví dụ | Chạy qua |
|---|---|---|
| **Additive** (non-breaking) | field optional mới, response-only field, enum giá trị mới | single workflow được |
| **Breaking** | field thành required, rename/xoá field, đổi shape/type, đổi enum xoá giá trị | **archetype CC** (`docs/wakii-playbook.md` §2) — SF-1 contracts là hiệp ước; chốt một: tương thích ngược có kiểm soát (token/event cũ còn verify) HOẶC đổi đồng loạt 1 SF |

Breaking trên **event** → `schemaVersion` bump + golden fixtures cập nhật theo. Additive
payload → KHÔNG bump (consumer bỏ qua field lạ — task-events.md), dùng **presence-based**
(chỉ gửi khi có giá trị — precedent `description` trong routes/tasks.ts).

## Quy tắc đồng bộ CẶP — các file này phải cùng commit

| Đổi file | Phải kèm |
|---|---|
| `contracts/openapi/tasks.yaml` | `contracts/db/tasks-schema.sql` (comment DDL tự quy định) |
| `contracts/openapi/tasks.yaml` | types node-svc: `pnpm --filter node-svc generate:types` → commit `src/types/api.d.ts` |
| `contracts/events/task-events.md` | `contracts/events/fixtures/*.json` (golden cùng nguồn node/go test) |
| `contracts/openapi/activity.yaml` | `services/go-svc/internal/api/openapi/activity.yaml` **copy bit-identical** — drift-guard CI `diff` (đổi tasks/users spec KHÔNG đụng snapshot này) |
| `services/node-svc/src/db/schema.ts` | migration `drizzle/000N_*.sql` + nếu ALTER shape mới → **mở rộng normalizer** `schema-diff.test.ts` (thử sẵn: nó throw ở action chưa biết) |
| DDL thêm index | sanity test đếm index sẽ vỡ — cập nhật cùng commit |

## Thứ tự chuẩn (additive field làm mẫu)

1. **Spec**: `contracts/openapi/<svc>.yaml` — schema + Create/Update request; endpoint mới thì
   nhớ gateway route (`location = /api/<svc>` exact + prefix + presence 401 — skill add-service)
   → verify `pnpm lint:contracts`
2. **DDL + schema + migration** (nếu có DB) → verify `pnpm --filter node-svc test` (schema-diff xanh lại)
3. **node-svc**: generate:types → repo (presence-based patch) → routes body schema
   (`additionalProperties: false` tự 400 giá trị lạ) → event payload matrix
4. **go-svc / spring-svc**: additive = **verify-only, KHÔNG sửa** — `go test ./...` pass không
   edit chính là bằng chứng non-breaking. Fixture mới mà test cũ fail → sửa TEST theo fixture,
   không sửa fixture ngược
5. **FE mirror**: `app/remotes/<svc>/src/api.ts` types + UI; `app/shared` READ-LOCKED là
   pass-through — KHÔNG sửa; primitives/variant mới → `app/ui-kit` (evidence build-storybook)
6. **Docs**: README service (API table + event matrix) + walkthrough nếu UI đổi — cùng PR
7. **Convergence**: `bash scripts/smoke/e2e.sh` PASS; optional mở rộng e2e nếu muốn e2e che field mới

## Verify battery (tổng)

```bash
pnpm lint:contracts
pnpm --filter node-svc test && pnpm --filter node-svc build   # tsc = typecheck
cd services/go-svc && go test ./...                            # additive: phải xanh không sửa
pnpm --filter "@wakii/remote-tasks" test && pnpm --filter "@wakii/remote-tasks" typecheck
bash scripts/smoke/e2e.sh                                      # cần compose (SMOKE_SAGA=0 nếu không Kafka)
```

CI tự chạy theo path-trigger: `contracts` (spectral + gitleaks + **schemathesis** — spec sai
shape so với impl sẽ đỏ ở đây, không cần tự dựng), `services-node-svc` (boot-smoke), `convergence`.

## Bẫy đã gặp

| Bẫy | Chặn |
|---|---|
| Sửa fixture để chiều test cũ | Sai chiều — fixture là golden, sửa test |
| Đổi activity.yaml quên copy snapshot go-svc | Drift-guard đỏ 1 vòng CI vô ích — copy cùng commit |
| PATCH `field: null` để xoá | Precedent `assigneeId`: contract non-nullable — nếu muốn xoá phải thiết kế riêng |
| Payload đổi mà quên event matrix trong routes | Test key-set cứng trong app.test.ts sẽ bắt — đọc trước khi sửa |
| Đổi spec xong code "tự hiểu" | Không có code-theo-suy-diễn — generate:types rồi impl theo types |
