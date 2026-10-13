# ADR 0001 — Mixed-stack backend (Node + Spring + Go)

Ngày: 2026-10-12 · Status: Accepted · SF-7 tổng hợp từ epic FI-62

## Context
Boilerplate nội bộ phải phục vụ team có nhiều stack; mỗi service 1 stack đại diện để team copy đúng phần mình cần.

## Decision
3 service, mỗi stack một: node-svc (Fastify + TypeScript, Node 22 + pnpm), spring-svc (Spring Boot 3 Web MVC, JDK 21, không reactive), go-svc (Go 1.24 + chi). Không dùng 1 stack cho tất cả — mục đích là template, không phải microservice tối ưu.

## Consequences
- (+) Mỗi team copy đúng stack; sample đầy đủ 3 hệ sinh thái tooling (pnpm / mvnw / go mod).
- (−) CI phải build 3 pipeline riêng (path-filtered per stack); toolchain local nặng hơn (xem [toolchain](../toolchain.md)).
- (−) Convention phải được giữ bằng kỷ luật (conventions/ — JSON log, error envelope, healthcheck) vì framework nào cũng có cách riêng.
