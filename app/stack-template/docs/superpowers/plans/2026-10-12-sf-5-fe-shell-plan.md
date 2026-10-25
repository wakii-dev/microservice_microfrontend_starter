# Plan: SF-5 FE shell — MF host (Rspack)
Date: 2026-10-12 | Linear: FI-73 | Worktree: __STACK_ORG__/sf-5-fe-shell | Story: FI-62

## 0. Root cause analysis (WHY)

### Root cause
Boilerplate epic cần FE entry-point: shell là MF host duy nhất — remotes (SF-6) không tự đứng, load vào host. Không có host = epic acceptance #1 (mở shell → login → nav + 2 remote render) không thể demo.

### Current state (before feature)
SF-1 đã merge: `frontend/shared` (api-client, token-storage, mf-bootstrap), spike MF đã test pin versions (evidence PNG), compose PRE-SEED khung (FE entries CHƯA có — gap flag), gateway routing `/` → `shell:3000` (502 đến khi shell tồn tại).

### Expected outcome
`frontend/shell/` chạy dev native :3000 → login fixture user qua gateway `/api/auth/login` → nav + layout; route `/tasks` `/activity` hiện fallback remote-down (SF-5 standalone, remote chưa có); vitest pass (focus + skip-link + login); CI xanh (build + tests + boot-smoke).

### Constraints & hardships
- fe-shared/catalog/compose/contracts READ-ONLY — thiếu gì = FLAG, không tự sửa.
- Không Docker trên dev machine — verify docker qua CI.
- Pin matrix bắt buộc: react 19.3.0, rspack 1.7.12, mf-enhanced 0.21.6 (nâng cấp = re-spike).
- SF-6 chạy SONG SONG — không cướp `pnpm-lock.yaml` semantics (commit bình thường, coordinator resolve).

### High-level strategy
Scaffold host từ pattern spike đã test (async boundary `import('./bootstrap')`, automatic JSX runtime), đóng gói remote loading qua `loadRemoteModule` + error boundary, routing react-router với lazy remote slots. Không design system — UI tối giản sạch.

## 1. Problem
Dev team copy boilerplate cần shell demo được login + nav ngay khi mở — không có shell thì toàn bộ FE demo epic sập từ cửa vào.

## 2. Scope
- **In scope:** scaffold `frontend/shell/` (Rspack + MF host + React 19 + TS + pnpm); re-validation spike + fe-shared fit-check (task đầu); catalog singleton deps; routing + layout + nav (`/`, `/tasks`, `/activity`); login qua fe-shared; a11y baseline CÓ TEST (route focus + skip link); error boundary + fallback remote-down; vitest + testing-library; Dockerfile nginx static; boot-smoke CI job; README; compose entry gap → FLAG (không tự sửa).
- **Out of scope:** implement remote apps (SF-6); sửa fe-shared/catalog/compose/contracts; design system phức tạp; docker local; i18n.
- **Success criteria (observable):** ACCEPTANCE trong `docs/superpowers/contexts/sf-5.md` — từng dòng verify + BROWSER VERIFY Rule 0 (login thật fixture user + nav + fallback remote-down, screenshot bằng chứng).

## 3. Touch map
- **Tạo:** `frontend/shell/**` (src, rspack.config.mjs, package.json, tsconfig, index.html, Dockerfile, nginx.conf, README.md, vitest config + tests), `.github/workflows/shell.yml`, evidence `docs/superpowers/evidence/sf-5-fe-shell/`.
- **READ-ONLY:** `frontend/shared/**`, `pnpm-workspace.yaml`, `platform/docker-compose.yml`, `platform/conventions/*`, `platform/.env.example`, `contracts/**`.
- **Shared-regen:** `pnpm-lock.yaml` (cả SF-6).
- **Consumers:** SF-6 (remotes load vào host này), gateway `/` route, CI pipeline.

## 4. Design
- **Approach:** host = Rspack + `ModuleFederationPlugin` (name `shell`), entry async boundary (`index.tsx` → `import('./bootstrap')` — bài học spike RUNTIME-006 loadShareSync), remote slots lazy-load qua `loadRemoteModule` (fe-shared) + React error boundary per route, remote URLs inject build-time qua DefinePlugin (`__REMOTE_URLS__`), fallback prod `/remotes/<name>/remoteEntry.js` (fe-shared `resolveRemoteUrl` đã handle).
- **Alternatives dismissed:** (A) hardcode remote URL — vi phạm conventions/08 rule 1; (B) static import remote — mất runtime fallback remote-down; (C) Vite-MF — epic chốt Rspack, KHÔNG trộn bundler.
- **Edge cases:** remote down giữa session (error boundary + retry button); token hết hạn (fe-shared `isExpired` → clear + redirect login); login sai (error envelope decode → hiện lỗi); refresh trang giữ login (localStorage persist).
- **Non-functional:** a11y (route focus management + skip link — CÓ TEST vitest); security (JWT không verify phía FE — chỉ decode claims hiển thị, verify là việc BE); perf (singleton react qua catalog + shared config MF).

## 5. Implementation outline
- **File structure:** `frontend/shell/src/` (index.tsx, bootstrap.tsx, App.tsx, routes, components/{Layout,NavBar,LoginPage,RemoteSlot,ErrorBoundary}), `frontend/shell/tests/`, config files root của `frontend/shell/`.
- **Testing strategy:** vitest + @testing-library/react — unit (login flow mocked api, token lưu), a11y (route focus + skip link), error boundary (remote reject → fallback UI). Boot-smoke = CI (static serve + 200). BROWSER VERIFY Rule 0 = walkthrough thật bằng mắt + screenshot.

### Tasks (9 — ordered, DAG)
| # | Task | Deps |
|---|------|------|
| 1 | Re-validation spike + fe-shared fit-check (pin còn đúng? export đủ dùng? lệch = FLAG ngay) | — |
| 2 | Scaffold `frontend/shell/` — Rspack + MF host + React 19 + TS + catalog singletons, chạy được hello shell :3000 | 1 |
| 3 | Routing + layout + nav (`/`, `/tasks`, `/activity`) + route focus + skip link; tạo sẵn route `/login` stub + Layout mount (chống đụng file với T4); **kèm a11y vitest riêng (route focus + skip link)** | 2 |
| 4 | **Chỉ `LoginPage.tsx` + login vitest riêng** (mocked api + token persist); dev API base = env `API_BASE_URL` default `http://localhost:8090` (auth-mock trực tiếp — native không có gateway, conventions/05 rule 3 + CORS 07: auth-mock luôn mở dev origin); prod = same-origin `""` qua gateway `/api/auth/login` | 2 |
| 5 | Remote slots + error boundary + fallback remote-down + retry; **kèm error-boundary vitest riêng** | 3 |
| 6 | Suite-green toàn bộ + 1 integration test cross-cutting (login → nav → remote-down fallback) | 3,4,5 |
| 7 | Dockerfile (nginx static) + nginx.conf + README `frontend/shell/` | 2 |
| 8 | CI `shell.yml` — build + tests + boot-smoke static (up + 200) | 6,7 |
| 9 | BROWSER VERIFY Rule 0 walkthrough + screenshot evidence + ACCEPTANCE line-by-line + verifier. Tiền tố walkthrough: start auth-mock native :8090 (fixture user + dev password). DONE report phải chứa FLAG: compose thiếu entry `shell` (claim pre-seed sai) — owner: coordinator/SF-7; SF-5 không đụng compose | 8 |

## 6. Risks & unknowns
- **Must verify (Task 1):** pin versions còn cài được; fe-shared export đủ (ApiClient, tokenStorage, readClaims, isExpired, loadRemoteModule, resolveRemoteUrl, REMOTE_NAMES) cho mọi nhu cầu shell.
- **Gap đã phát hiện (Phase 0):** compose CHƯA có entry `shell` (comment compose nói pre-seed riêng, context pack nói đã pre-seed) → FLAG coordinator, KHÔNG tự sửa. Boot-smoke CI không phụ thuộc compose (serve static trực tiếp).
- **Unverified assumption:** auth-mock contract `/api/auth/login` request/response shape — đọc `contracts/openapi/auth.yaml` trước khi code Task 4.
