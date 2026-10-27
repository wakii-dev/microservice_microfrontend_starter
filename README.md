<div align="center">

<img src="docs/assets/readme/hero.svg" alt="microservice_microfrontend_starter — animated hero: blossom logo, token dots quỹ đạo, ripple pulse" width="880" />

# microservice_microfrontend_starter

### Microservice + micro-frontend starter — full-stack, one command.

Mọi thứ bạn thấy trong ảnh dưới là **sản phẩm thật của repo này** — chạy bằng
`docker compose up`, không mock, không screenshot từ dự án khác.

**90+** components · **1328** tests · **3** npm packages · **10** services

[![npm @wakii/ui-kit](https://img.shields.io/npm/v/@wakii/ui-kit?logo=npm&label=%40wakii%2Fui-kit&color=cb3837)](https://www.npmjs.com/package/@wakii/ui-kit)
[![npm create-wakii-app](https://img.shields.io/npm/v/create-wakii-app?logo=npm&label=create-wakii-app&color=cb3837)](https://www.npmjs.com/package/create-wakii-app)
[![npm create-wakii-stack](https://img.shields.io/npm/v/create-wakii-stack?logo=npm&label=create-wakii-stack&color=cb3837)](https://www.npmjs.com/package/create-wakii-stack)
[![Storybook](https://img.shields.io/badge/Storybook-870%2B%20stories-ff4785?logo=storybook&logoColor=white)](https://storybook-static-khaki-two.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<img src="docs/assets/readme/stack-marquee.svg" alt="Stack chạy ngang vô hạn — React 19 · Tailwind v4 · Rspack · Module Federation · Fastify · Spring Boot 3 · Go · PostgreSQL · Kafka · nginx · framer-motion" width="920" />

</div>

---

## Sản phẩm thật, không lời hứa

<img src="docs/assets/readme/landing.png" alt="Landing showcase — hero 3D + bento + marquee, chạy thật từ stack trong repo" width="920" />

| Kanban — kéo card đổi status | Activity — Kafka realtime |
|:---:|:---:|
| <img src="docs/assets/readme/kanban.png" alt="Kanban board — drag đổi status qua framer-motion" width="440" /> | <img src="docs/assets/readme/activity.png" alt="Activity feed — event Kafka hiện realtime sau khi tạo task" width="440" /> |
| <img src="docs/assets/readme/kanban-drag.svg" alt="Animated kanban — card tự trượt todo → doing → done, cột đích sáng, badge đếm nhảy số" width="440" /> | <img src="docs/assets/readme/feed-pulse.svg" alt="Animated activity feed — event pop-in, live dot pulse" width="440" /> |

Tạo một task ở Kanban → event đi qua **Kafka** → xuất hiện ngay ở Activity feed.
Gắn task cho user `fail@demo.local` → saga rollback → event vào **DLQ**. Tất cả
được kiểm chứng bởi [`scripts/smoke/e2e.sh`](scripts/smoke/e2e.sh) chạy trong CI.

## Bắt đầu trong 30 giây

<div align="center">

<img src="docs/assets/readme/terminal.svg" alt="Terminal gõ lệnh npm create wakii-stack — scaffold full stack, services ready, mở localhost:8080" width="640" />

</div>

```bash
# ① chỉ FE — React starter (5 preset · 3 framework)
npm create wakii-app@latest my-app                     # demo — showcase ui-kit
npm create wakii-app@latest my-app --preset product    # TanStack Query + zod + MSW
npm create wakii-app@latest my-app --variant next      # hoặc astro

# ② cả nền tảng — FE + 3 backend + gateway + postgres + kafka
npm create wakii-stack@latest my-stack
cd my-stack && cp platform/.env.example platform/.env
docker compose --env-file platform/.env up -d      # → http://localhost:8080

# ③ design system một mình
pnpm add @wakii/ui-kit        # 90+ components, dark/light, motion, a11y
```

> Đăng nhập demo: `alice@demo.local / demo-password` · Storybook:
> [storybook-static-khaki-two.vercel.app](https://storybook-static-khaki-two.vercel.app)

## Ba packages, một hệ sinh thái

| | Package | Là gì |
|---|---|---|
| 🎨 | **[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit)** | 90+ React components (antd × PrimeReact parity) — tokens-first, Tailwind v4, `UiKitProvider` theming, peer-deps optional sau subpath (`/carousel` `/chart` `/editor` `/schedule` `/experience3d`) |
| ⚡ | **[create-wakii-app](https://www.npmjs.com/package/create-wakii-app)** | CRA-style starter — TS/JS, router v7, extras demo, dark toggle chạy thật |
| 🏗️ | **[create-wakii-stack](https://www.npmjs.com/package/create-wakii-stack)** | Full-architecture starter — chọn services qua manifest, prune compose/lock/workspace đúng selection, `kafka-init` chống race topic |

```bash
pnpm add @wakii/ui-kit                   # 🎨 design system
npm create wakii-app@latest my-app       # ⚡ FE starter
npm create wakii-stack@latest my-stack   # 🏗️ full platform
```

<div align="center">

<img src="docs/assets/readme/token-palette.svg" alt="Design tokens nhấp nháy theo lượt — accent · ink · line · done · doing · fail" width="920" />

</div>

> Cả ba cũng có **mirror trên [GitHub Packages](https://github.com/orgs/wakii-dev/packages)** (`@wakii-dev/ui-kit` · `@wakii-dev/create-wakii-app` · `@wakii-dev/create-wakii-stack`) — registry `npm.pkg.github.com`, tiện cho org cài nội bộ. npmjs vẫn là bản canonical.

## Motion & dark mode built-in

<div align="center">

<img src="docs/assets/readme/dark-switch.svg" alt="Dark mode — hai panel cross-fade light/dark ngược pha, sun/moon xoay swap theo data-bp-theme" width="480" />

<img src="docs/assets/readme/motion-wave.svg" alt="Motion curves — enter ease-out, exit ease-in, toggle spring, tự vẽ + dot chạy theo đường cong" width="920" />

</div>

## Bên dưới là gì

<div align="center">

<img src="docs/assets/readme/arch-flow.svg" alt="Diagram kiến trúc chạy — Browser → gateway :8080 pulse → 4 services sáng lần lượt → postgres pulse + kafka topic ring, packet chạy cong vào activity feed" width="920" />

</div>

| Tầng | Thành phần |
|---|---|
| **Experience** | shell (landing 3D + nav) · remotes (kanban drag · feed realtime) · admin showcase |
| **Edge** | nginx gateway — routing · JWT presence · `/remotes/*` registry |
| **Services** | node-svc :3001 · spring-svc :8081 · go-svc :8082 · auth-svc :8090 |
| **Infra** | postgres :5432 (schema-per-svc) · kafka :9092 (KRaft + kafka-init) |

## Repo map

```
contracts/    source of truth — openapi (spectral CI) · canonical DDL · token contract
platform/     compose + kafka-init · postgres init · gateway · 9 conventions
services/     node · spring · go · auth — README standalone từng service
app/
  ui-kit/     @wakii/ui-kit — components · hooks · tokens · Storybook
  shared/     fe-shared — api client · token storage · MF bootstrap
  shell/      MF host + landing showcase (Scene3D three · tilt card)
  remotes/    tasks (kanban) · activity (feed)
  admin/      showcase SPA — DataTable virtual · zod forms · upload
  create-*/   scaffolders npm + starter-templates + stack-template
docs/         walkthrough · 10 ADR · toolchain · assets/readme (ảnh thật)
scripts/      smoke/e2e.sh · scaffold · snapshot-stack-template
```

## Quy tắc sống còn

1. **Contract-first** — sửa `contracts/openapi/*.yaml` trước, spectral phải pass ([ADR 0003](docs/adr/0003-contract-first.md))
2. **Gateway chỉ presence-check JWT** — service tự verify signature ([token-contract §4](contracts/auth/token-contract.md))
3. **Kafka lazy-connect + kafka-init** — topic tồn tại trước consumer, không `depends_on` broker ([ADR 0008](docs/adr/))
4. **Đổi port = 4 chỗ cùng commit** — conventions/05 · `.env.example` · compose · README
5. **Stack scaffold kèm** `app/shared` (source); `app/ui-kit` cài từ npm — `@wakii/ui-kit` latest, không kèm source ([ADR 0010](docs/adr/0010-stack-fe-npm-deps.md))
6. **Đổi kiến trúc** — đọc ADR trước (mỗi ADR ghi Consequences + điểm cắm thay thế)

---

<div align="center">

<img src="docs/assets/readme/constellation.svg" alt="Constellation — 14 nhóm component nối nhau bằng đường dữ liệu chảy + packet glow" width="920" />

<sub>

**microservice_microfrontend_starter** — microservice + micro-frontend, tokens all the way down · MIT

[Storybook](https://storybook-static-khaki-two.vercel.app) · [npm](https://www.npmjs.com/~wakii) · [Walkthrough](docs/walkthrough.md) · [ADR](docs/adr/)

</sub>

</div>
