---
name: wakii-debug-kafka
description: Use when debugging Kafka on the wakii boilerplate — consumer not receiving events, empty assignment/feed, events sitting in the DLQ, odd "Assignment failed" saga, "kafka not working", topic errors. Covers topic-before-consumer, DLQ, smoke saga. Do NOT use for adding a new consumer from scratch (skill add-service + conventions/09) or changing the event contract (skill sync-contracts).
---

# wakii-debug-kafka — topic before consumer · DLQ · smoke saga

## Overview

Kafka diagnosis directives for the wakii stack: node-svc outbox → relay → topic `task-events` → idempotent go-svc consumer (retry ×3 → `task-events.dlq`); saga assigns `fail@demo.local` → compensation `assignment_failed`. Sources of truth: `platform/conventions/09` + `docs/adr/0008` + `contracts/events/task-events.md`.

## Diagnosis by symptom

- IF the consumer group is `Stable` but with 0 fetch/0 commit and feed/assignment stays empty FOREVER (no crash) THEN join-group-before-topic race → `docker compose --env-file platform/.env down -v`; create topics `task-events` + `task-events.dlq` FIRST (`kafka-init` one-shot + go-svc `EnsureTopics`) → up again → create a task → the event must arrive within seconds, NO service restart needed.
- IF the DLQ has events THEN the consumer failed ×3 retries — read the payloads (`kafka-console-consumer --topic task-events.dlq --from-beginning`) → fix the root cause + reprocess; NEVER delete the DLQ.
- IF events are in the topic but the feed is empty THEN check offsets/group: `kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group <group>` — large LAG = consumer stuck; missing group = wrong group id.
- IF events are NOT in the topic THEN the fault is upstream in the node-svc outbox/relay — check the outbox table (`status` still pending relay?) before blaming Kafka.
- IF demoing the saga THEN assign a task to `fail@demo.local` → go consumer fails ×3 → `assignment_failed` → event lands in the DLQ; the "Assignment failed" badge shows in the UI.

## Final verify

- THEN `bash scripts/smoke/e2e.sh` PASS (happy path through Kafka + saga → DLQ asserts) — never conclude from ad-hoc manual tests alone.
- IF retry/idempotency was touched THEN publish a golden fixture from `contracts/events/fixtures/` twice — the total must not change on the second publish (provable idempotency).

## Traps

- Kafka has NO data volume — `down` loses topics; always create topics explicitly after down (`kafka-init` handles it on compose up).
- Consumers must NOT subscribe before the topic exists (lazy-connect + topic before boot — conventions/09).
- Dedupe by `envelope_id`, NOT taskId (taskIds collide on re-assign).
