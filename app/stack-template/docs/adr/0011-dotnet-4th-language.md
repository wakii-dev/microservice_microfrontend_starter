# ADR 0011 — dotnet-svc: .NET as the 4th language (partially supersedes ADR-0001)

Date: 2026-10-27 · Status: Accepted · Source: lead mission brief (__STACK_ORG__/feat-dotnet-svc)

## Context

ADR-0001 locked 3 stacks (Node/Spring/Go) — "no stack outside the 3". Actual need since then: part of the team works in .NET, and the boilerplate has no ASP.NET Core Minimal API sample to copy. The service had to satisfy 2 constraints: a domain that touches NO other service (tasks/users/activity/auth), and template value over business logic (proving conventions + .NET tooling work end-to-end).

## Decision

Add **dotnet-svc** — ASP.NET Core 8 **Minimal API**, domain `notifications` (single-table CRUD scoped to the JWT subject), PostgreSQL via **Npgsql + Dapper** (no EF Core — keep it thin, mirroring the thin-data spirit of go-svc). NO Kafka, NO inter-service calls.

- Port **8083** (right after go-svc 8082) — conventions/05.
- Gateway route `/api/dotnet` (exact + prefix, presence-check 401) — conventions/08.
- Schema `notifications` + role `dotnet_svc` — platform/postgres/init/01-init.sh.
- Service-side JWT verification (layer 2, token-contract.md §4) — like node/spring/go.
- Every build/test **through Docker** (Dockerfile runs xunit inside the build stage) — dev machines need no .NET SDK, mirroring go-svc's go.sum-in-image pattern.

## Consequences

- (+) The .NET team gets a template that complies with the conventions (envelope/log/healthcheck/ports) like the 3 existing stacks.
- (+) No runtime footprint increase: dotnet-svc is standalone with postgres — the current compose/e2e flow has no logical dependency on it (only the gateway health-gate).
- (−) Partially supersedes ADR-0001: the repo now maintains **4** per-stack CI pipelines (path-filtered) + one more toolchain entry (Docker-only — `dotnet` SDK not required on dev machines).
- (−) Convention-by-review pieces must be re-expressed as .NET idioms (pino/slog → `ConsoleFormatter`; Fastify error handler → `UseExceptionHandler` + JwtBearer events) — kept in place BY TESTS, not by framework.
- Replacement hook: if .NET is no longer needed, prune via stack-manifest (`dotnet-svc` entry, requires postgres) like any other service.
