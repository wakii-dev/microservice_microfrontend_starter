# Platform Conventions — index

SF-1 (FI-64) sở hữu. **Mọi service/repo-con trong boilerplate PHẢI theo các conventions này** — SF-2..7 đọc trước khi code. Không đúng convention = review fail.

| File | Nội dung |
|------|----------|
| [01-dockerfile-pattern.md](01-dockerfile-pattern.md) | Dockerfile multi-stage pattern chuẩn cho cả 3 stack |
| [02-healthcheck.md](02-healthcheck.md) | `/healthz` (liveness) + `/readyz` (readiness) — contract cho compose + CI boot-smoke |
| [03-logging.md](03-logging.md) | JSON log shape chung |
| [04-error-envelope.md](04-error-envelope.md) | Error envelope chung (mirror trong 4 OpenAPI specs) |
| [05-ports.md](05-ports.md) | PORT TABLE — nguồn sự thật duy nhất về port |
| [06-configuration.md](06-configuration.md) | Config qua env-var — quy tắc + .env workflow |
| [07-cors.md](07-cors.md) | CORS dev-profile rule |
| [08-gateway-and-remotes.md](08-gateway-and-remotes.md) | Gateway routing table + MF remote registry |
| [09-async-messaging.md](09-async-messaging.md) | Kafka lazy-connect + outbox + consumer idempotent + retry/DLQ (hợp đồng envelope: contracts/events/task-events.md) |
