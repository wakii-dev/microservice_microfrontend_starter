# Toolchain — cần gì ở đâu (boilerplate FI-62)

Bảng đối chiếu tool × môi trường. Nguyên tắc: **máy dev không có Docker vẫn làm việc được 100%** (native per-service); Docker chỉ cần cho compose mode + một số bước verify (có thể đưa qua CI).

| Tool | Version | Dev native | Dev compose | CI | Ai cần |
|------|---------|-----------|-------------|-----|--------|
| Node.js | 22 LTS (engines >=22) | ✓ | — | ✓ setup-node 22 | node-svc, auth-svc, toàn FE, scaffold output |
| pnpm | 9 (corepack) | ✓ | — | ✓ corepack | cùng Node ở trên |
| JDK | 21 (Temurin) | ✓ | — | ✓ setup-java 21 | spring-svc (mvnw tự tải deps — không cần Maven cài sẵn) |
| Go | 1.24.x | ✓ (hoặc skip — CI build) | — | ✓ setup-go 1.24 | go-svc (`go.sum` không commit — `go mod tidy` sinh) |
| Docker + Compose v2 | — | ✗ | ✓ | ✓ (ubuntu runner có sẵn) | chạy `platform/docker-compose.yml`; build image per service |
| Postgres | 16 | ✓ (cài riêng/portable) | ✓ (container) | ✓ (container compose) | mọi service BE + e2e smoke |
| bash + curl | — | ✓ (Git Bash trên Windows) | ✓ | ✓ | chạy `scripts/smoke/e2e.sh`, `scripts/scaffold/scaffold.sh` |
| jq | — | không cần (script dùng grep thuần) | — | có sẵn | — |

## Ma trận task × tool tối thiểu

| Task cần làm | Tool cần ở máy |
|--------------|----------------|
| Sửa node-svc / auth-svc / FE | Node 22 + pnpm + Postgres 16 (test) |
| Sửa spring-svc | JDK 21 (mvnw lo phần còn lại) |
| Sửa go-svc | Go 1.24 (hoặc để CI build — dev chỉ đọc code) |
| e2e smoke local | bash + curl + stack sống (compose HOẶC native — walkthrough.md) |
| Scaffold project mới | bash + pnpm (Node 22) |
| Build image / compose up | Docker (hoặc push → CI làm) |

## Lưu ý portable (máy khoá admin)
Mọi tool trên đều chạy được bản portable không cần admin (precedent: `~/Tools/sf6-e2e` — JDK 21 + Go 1.24 + Postgres 16 portable, xoá được). Extract là chạy, không installer.
