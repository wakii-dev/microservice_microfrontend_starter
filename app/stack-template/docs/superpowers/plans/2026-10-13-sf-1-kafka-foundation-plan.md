# SF-1 Plan — Kafka foundation + async contracts (FI-77)

> Story FI-76 · spec slice: `docs/superpowers/contexts/sf-1.md` · epic spec rev 3: `docs/superpowers/specs/2026-10-13-kafka-outbox-saga.md`
> Worktree: `sf-1-kafka-foundation` (nhánh `__STACK_ORG__/sf-1-kafka-foundation` fork từ `__STACK_ORG__/story-fi76-kafka-outbox-saga`)
> Ràng buộc: dev machine KHÔNG Docker — mọi verify compose/kafka qua CI. Compose sửa ĐÚNG 1 commit duy nhất.

## Tasks (10)

| # | Task | Files | Commit |
|---|------|-------|--------|
| T1 | Compose: kafka entry (apache/kafka KRaft, heap 512m, healthcheck full-path `/opt/kafka/bin/kafka-broker-api-versions.sh`, KHÔNG depend_on, KHÔNG expose 9092) + PRE-ADD env downstream (node-svc `KAFKA_BROKERS`; go-svc `KAFKA_BROKERS` + `AUTH_MOCK_URL` + `SVC_ACTIVITY_PASSWORD`) + header ownership | `platform/docker-compose.yml` | 1 commit (cùng .env.example — conventions/06) |
| T2 | .env.example: `KAFKA_BROKERS=kafka:9092` + `SVC_ACTIVITY_PASSWORD=demo-password` (+ comment) | `platform/.env.example` | cùng commit T1 |
| T3 | Contract: `contracts/events/task-events.md` — envelope `{schemaVersion:1, id UUID, type, occurredAt RFC3339, payload}`, payload shape theo 5 event type, filter-by-type (group `go-svc-activity` trừ `task.assignment_failed`; `node-svc-compensation` chỉ `task.assignment_failed`), topics `task-events`+`task-events.dlq` 1 partition, retry ×3 in-memory → DLQ, manual commit sau DB tx, `auto.offset.reset: earliest` | contracts/events/task-events.md | 1 commit |
| T4 | Golden fixtures: 5 file JSON (`task.created/updated/assigned/deleted/assignment_failed.json`) đúng envelope — machine-checkable cho SF-2 relay test + SF-3 consumer test + CI console-producer | `contracts/events/fixtures/*.json` | 1 commit |
| T5 | Fixture users: + `svc-fail` (`fail@demo.local`), `svc-activity` (service user) — roles `["user"]`, UUID cố định pattern | `contracts/auth/users.json` | 1 commit |
| T6 | Conventions: `platform/conventions/09-async-messaging.md` — producer/consumer/retry/DLQ/idempotency + lazy-connect rule + conventions README row | conventions/09 + README.md (conventions) | 1 commit |
| T7 | ADR-0008 supersede ADR-0006 (Kafka KRaft, outbox tự viết, presence-based trigger, in-memory retry, PLAINTEXT, segmentio/kafka-go, saga choreography) + adr README row | `docs/adr/0008-*.md` + docs/adr/README.md | 1 commit |
| T8 | README section compose: 10 services + kafka lazy-connect note | `README.md` | 1 commit |
| T9 | Verify local không-Docker: fixtures parse JSON + đủ field envelope (jq), users.json roles hợp lệ, compose YAML parse; push + CI watch (contracts/compose-config + convergence xanh) | — | — |
| T10 | Code-reviewer độc lập trên diff → verdict file /tmp/story/fi62/code-reviewer-sf-1-kafka-foundation.md; evidence `docs/superpowers/evidence/sf-1-kafka-foundation/`; story-verify sf-1; Linear comment DONE | — | — |

## Acceptance (user-visible — từ context pack)
1. `docker compose config -q` validate với entry kafka + env mới (CI-verified).
2. CI convergence không đỏ vì kafka entry (không service depend kafka).
3. Golden fixtures parse JSON, envelope đủ field, mỗi event type 1 file.
4. users.json 2 user mới, roles hợp lệ, spring SeedMatch (SF-4) vẫn pass khi merge.
5. ADR-0008 + conventions/09 tồn tại, supersede 0006 rõ ràng.

## Boundary
KHÔNG đụng: `contracts/db/`, `contracts/openapi/`, `services/**`, FE. KHÔNG kafka vào readyz/depends_on. KHÔNG expose 9092. KHÔNG SASL/SSL. Compose 1 commit duy nhất.
