# ADR — Architecture Decision Records (boilerplate FI-62)

Mỗi quyết định kiến trúc của boilerplate = 1 ADR ngắn (Context / Decision / Consequences). Người copy nên đọc đủ 8 trước khi đổi bất kỳ quyết định nào.

| # | Quyết định | File |
|---|-----------|------|
| 1 | Mixed-stack backend (Node + Spring + Go) | [0001-mixed-stack.md](0001-mixed-stack.md) |
| 2 | Module Federation trên Rspack | [0002-mf-rspack.md](0002-mf-rspack.md) |
| 3 | Contract-first (OpenAPI + canonical DDL) | [0003-contract-first.md](0003-contract-first.md) |
| 4 | Per-service schema + readonly role cho go-svc | [0004-readonly-schema-tradeoff.md](0004-readonly-schema-tradeoff.md) |
| 5 | Fail-closed thay vì degrade khi spring down | [0005-fail-closed.md](0005-fail-closed.md) |
| 6 | Event push fire-and-forget (node → go) | [0006-fire-and-forget-events.md](0006-fire-and-forget-events.md) |
| 7 | Fork-not-upgrade (copy boilerplate, không dependence) | [0007-fork-not-upgrade.md](0007-fork-not-upgrade.md) |
| 8 | Kafka + Outbox + Saga (supersede 0006) | [0008-kafka-outbox-saga.md](0008-kafka-outbox-saga.md) |
