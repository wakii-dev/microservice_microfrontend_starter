# ADR 0003 — Contract-first (OpenAPI + canonical DDL + users fixture)

Ngày: 2026-10-12 · Status: Accepted

## Context
3 service polyglot + FE shell/remotes phát triển song song — không có hợp lệ chung thì interface lệch nhau muộn (integration hell).

## Decision
`contracts/` là source of truth duy nhất: OpenAPI specs (tasks/users/activity/auth) cho API surface; `contracts/db/tasks-schema.sql` là canonical DDL bảng tasks (node-svc migration phải sinh khớp 1:1 — có test chặn diff; go-svc query theo đúng cột); `contracts/auth/users.json` là users fixture chung (auth-svc seed + spring seed đọc cùng file, id khớp 100% — tên dịch vụ `auth-mock` trong ghi chép cũ là tiền thân đã decommission, epic auth-real). Mỗi service codegen models từ OpenAPI (không gen full client). CI spectral lint + schemathesis contract test.

## Consequences
- (+) SF/teams phát triển song song được; breaking change thấy được ở lint/contract test trước runtime.
- (−) Đổi API = sửa contract TRƯỚC, 2 bước (contract rồi code); codegen adds build step (spring generate-sources).
- (−) Gotcha: codegen `interfaceOnly` giữ FULL path từ yaml (không strip servers.url) — implementor gắn class base-path phải hiểu điều này, nếu không route double-prefix (bug thật gặp ở SF-7 e2e — đã report epic FI-62).
