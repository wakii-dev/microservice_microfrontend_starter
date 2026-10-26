<div align="center">

<img src="app/ui-kit/docs/assets/hero.svg" width="880" alt="wakii — tokens-first design system và full-stack platform" />

# wakii · architecture-overview

**Một lệnh — cả nền tảng.** Design system 90+ components · full-stack starter
(FE + BE + infra) · module federation · event-driven — tất cả trong một repo,
đã verify end-to-end.

[![npm @wakii/ui-kit](https://img.shields.io/npm/v/@wakii/ui-kit?logo=npm&label=%40wakii%2Fui-kit&color=cb3837)](https://www.npmjs.com/package/@wakii/ui-kit)
[![npm create-wakii-app](https://img.shields.io/npm/v/create-wakii-app?logo=npm&label=create-wakii-app&color=cb3837)](https://www.npmjs.com/package/create-wakii-app)
[![npm create-wakii-stack](https://img.shields.io/npm/v/create-wakii-stack?logo=npm&label=create-wakii-stack&color=cb3837)](https://www.npmjs.com/package/create-wakii-stack)
[![Storybook](https://img.shields.io/badge/Storybook-live%20demo-ff4785?logo=storybook&logoColor=white)](https://storybook-static-khaki-two.vercel.app)
[![Tests](https://img.shields.io/badge/ui--kit%20tests-1328%20passing-brightgreen)](app/ui-kit)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Storybook](https://storybook-static-khaki-two.vercel.app) · [Hệ sinh thái npm](https://www.npmjs.com/~wakii) · [Walkthrough](docs/walkthrough.md) · [8 ADR](docs/adr/) · [Conventions](platform/conventions/)

</div>

---

## 🧩 Hệ sinh thái — 3 packages công khai

| Package | Một dòng | Cài |
|---|---|---|
| **[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit)** | 90+ React components (antd × PrimeReact parity) — tokens-first, Tailwind v4, dark/light, motion, a11y, 1328 behavior tests | `pnpm add @wakii/ui-kit` |
| **[create-wakii-app](https://www.npmjs.com/package/create-wakii-app)** | CRA-style React starter — TS/JS, router v7, extras demo (chart · carousel · schedule · editor), dark toggle chạy thật | `npm create wakii-app@latest` |
| **[create-wakii-stack](https://www.npmjs.com/package/create-wakii-stack)** | Full-architecture starter — chọn services qua manifest, `docker compose up` chạy ngay, entry duy nhất gateway `:8080` | `npm create wakii-stack@latest` |

> Component nặng (Chart.js · Swiper · Tiptap · FullCalendar · three) là **peer
> optional** sau subpath exports — không dùng thì không cài, bundle stays lean.

## 🏛️ Kiến trúc — 4 tầng, một cổng

> Luồng: **Browser → gateway :8080** → shell/remotes (FE) · /api/* → auth · node · spring · go → postgres + kafka (event task → activity feed realtime).

Chuỗi e2e chứng minh bởi smoke script: **happy** (login → tạo task → Kafka →
activity feed realtime) + **saga** (assign user fail → compensating
`assignment_failed` → DLQ). Demo: `alice@demo.local / demo-password`.

| Tầng | Thành phần | Ports |
|---|---|---|
| **Experience** | shell (landing + MF host) · remotes (kanban tasks · activity feed) · admin showcase | 3000 · 4001-4002 · 5173 |
| **Edge** | nginx gateway — routing + JWT presence + `/remotes/*` registry | **8080** |
| **Services** | node-svc · spring-svc · go-svc · auth-svc | 3001 · 8081 · 8082 · 8090 |
| **Infra** | postgres (schema-per-service) · kafka KRaft + kafka-init | 5432 · 9092 (internal) |

## 🚀 Chạy thử

**Cả stack (Docker):**

```bash
cd platform && cp .env.example .env    # điền JWT_SECRET + passwords
docker compose up -d --build           # kafka-init tạo topics, health-gated chain
bash ../scripts/smoke/e2e.sh           # PASS = happy + saga
open http://localhost:8080             # login alice@demo.local / demo-password
```

**Chỉ FE dùng ui-kit:**

```bash
npm create wakii-app@latest my-app     # scaffold + dogfood @wakii/ui-kit
cd my-app && pnpm install && pnpm dev
```

**Design system một mình:** [Storybook live](https://storybook-static-khaki-two.vercel.app)
(870+ stories, lens "sử dụng thực tế": Product gallery · OTP login · Orders
table · Checkout confirm…).

## 🗺️ Repo map

```
contracts/    source of truth — openapi (spectral lint CI) · canonical DDL · token contract
platform/     compose + kafka-init · postgres init · gateway nginx · 9 conventions
services/     node-svc · spring-svc · go-svc · auth-svc (README standalone từng svc)
app/
  ui-kit/     @wakii/ui-kit — 90+ components · 17 hooks · tokens · Storybook
  shared/     fe-shared — api client · token storage · MF bootstrap (READ-LOCKED)
  admin/      showcase SPA — DataTable virtual · zod forms · upload
  shell/      MF host + landing showcase (Scene3D · kanban remotes)
  remotes/    tasks (kanban drag) · activity (feed realtime)
  create-*/   2 scaffolders npm + starter-templates + stack-template
scripts/      smoke/e2e.sh · scaffold · snapshot-stack-template
docs/         walkthrough · 8 ADR · toolchain
```

## 📐 Quy tắc sống còn

1. **Contract-first** — API đổi = sửa `contracts/openapi/*.yaml` trước, spectral phải pass ([ADR 0003](docs/adr/0003-contract-first.md)).
2. **Gateway chỉ presence-check JWT** — service tự verify signature + expiry ([token-contract](contracts/auth/token-contract.md) §4).
3. **Kafka lazy-connect** — không `depends_on`, kafka-init tạo topic trước consumer (chống race empty-assignment — [ADR 0008](docs/adr/)).
4. **Đổi port = 4 chỗ cùng commit** — conventions/05 + `.env.example` + compose + README này.
5. **FE copy phải kèm** `app/shared` + `app/ui-kit` (workspace deps).
6. **Quyết định kiến trúc** — đọc ADR tương ứng trước khi đổi (mỗi ADR có Consequences + điểm cắm).

---

<div align="center">

**wakii** — tokens all the way down. · MIT

</div>
