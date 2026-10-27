# 03 — JSON log shape chung

Mọi service log JSON một dòng mỗi entry ra **stdout** (12-factor; compose/CI collect). Không log ra file.

## Shape

```json
{
  "ts": "2026-10-12T05:00:00.123Z",
  "level": "info",
  "service": "node-svc",
  "msg": "task created",
  "requestId": "b1c2...",
  "taskId": "9f0e...",
  "durationMs": 12
}
```

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| `ts` | ✓ | ISO 8601 UTC, độ chính xác ms |
| `level` | ✓ | `debug` \| `info` \| `warn` \| `error` |
| `service` | ✓ | `node-svc` \| `spring-svc` \| `go-svc` \| `auth-svc` \| `dotnet-svc` \| `gateway` |
| `msg` | ✓ | Câu ngắn, tiếng Anh, không nhạy cảm |
| `requestId` | khi xử lý request | Lấy từ header `X-Request-Id` (gateway sinh nếu thiếu) — trace xuyên gateway → service |
| còn lại | tuỳ | Case camelCase; KHÔNG log JWT/email/password toàn phần (mask email: `a***@demo.local`) |

## Stack mapping

| Stack | Thư viện |
|-------|----------|
| node-svc | `pino` (mặc định JSON) |
| spring-svc | Logback `LogstashEncoder` (`net.logstash.logback`) |
| go-svc | `log/slog` JSON handler |
| auth-svc | `pino` |
| dotnet-svc | `ConsoleFormatter` custom (`WakiiJsonConsoleFormatter`) |

## Quy tắc

1. **Fire-and-forget event push** (node-svc → go-svc): fail = log `level:"warn"`, msg chứa `event push failed`, KHÔNG raise error cho caller, KHÔNG retry (ADR SF-7).
2. Unhandled error: `level:"error"` + stack trong trường `err` (string).
3. Không dùng `console.log` trong service Node — mọi log đi qua logger có shape trên.
