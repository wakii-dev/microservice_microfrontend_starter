# Epic Spec — UI/UX Redesign (shell + remotes + fe-shared design system)

> Story: VU-53 (epic In Progress) · tạo 2026-10-13 · pipeline: story-workflow CREATE
> Rev 2 — sau spec-critic (GO): sửa 3 P1 (contract api-mở-rộng SF-3, assignee UUID rút gọn không resolve tên, cssFilename fact /assets/ sai) + 6 P2 (primitive props API trong hand-off, spike R2 exit criteria, quán từ SF-4/SF-2, aria-list exhaustive, env.d.ts defensive, phase-2 visual transient expected)
> Rev 3 — sau plan-critic (GO): P1 phân rã tasks SF-2 (7→9) + SF-4 (6→9); P2 spike R2 chạy sớm sau jsx-runtime config, tests primitives ở shell/tests (fe-shared không vitest — tránh đụng lockfile), phase-gate security owner rõ, SF-3/4 rebase note (packs)
> Repo: `wakii-dev/architecture-overview` (đã chạy được: 10 services compose + e2e smoke 2 chiều PASS)
> Input user: "design lại UI/UX" · Creativity: BALANCED (spec = khung cứng; chi tiết chưa ghi agent tự quyết theo conventions, quyết định lớn flag trong notes)

## IDEA-BRIEF (8 chiều)

- **Task**: Design lại toàn bộ UI/UX của micro-frontend demo: dựng design system (tokens + base + primitives dùng chung shell/remotes), restyle shell (layout/login/nav/fallback) + 2 remote (tasks/activity), đóng các khoảng trống UX nhìn thấy được **bằng API hiện có** (pagination, filter, edit, delete, assignee/createdAt, per-item busy, skeleton, nav active, responsive).
- **Output**: Cùng repo — `docker compose up` → mở `:8080` thấy UI có visual identity nhất quán xuyên shell + 2 remote (không còn "unstyled mặc định trình duyệt"), standalone debug `:4001/:4002` có style, 3 package FE test+typecheck xanh, walkthrough mục 4 (kể cả saga 4b) chạy được trên UI mới.
- **Users**: (a) dev nội bộ copy boilerplate — UI là "mặt tiền" phán xét khi fresh-clone walkthrough; (b) người demo e2e/saga (cần badge `assignment_failed` nhận diện được); (c) CI KHÔNG nhìn UI (e2e là curl API-level — story này không đụng CI).
- **Constraints**: MUST — giữ toàn bộ contracts ghim (mục "Contracts ghim"); a11y không thụt lùi (WCAG AA 4.5:1 text); 0 npm dependency mới, 0 external asset/CDN (CSP chưa set — không mở), giữ system-ui font stack; pin matrix (react 19.3.0 / rspack 1.7.12 / MF enhanced 0.21.6) bất biến. MUST-NOT — không đụng BE/gateway/contracts/OpenAPI, không đổi MF registry, không thêm dark mode/i18n framework.
- **Input**: Không Figma (story không có nguồn thiết kế 1:1) → hướng thiết kế sinh qua **designer 3-hướng mock-prototype, USER CHỌN (gate bắt buộc)**, hand-off doc là source of truth. Code hiện có: 4 package FE ~1.150 LOC src, CSS 68 dòng 1 file.
- **Context**: Repo là boilerplate demo đã hoàn thiện (epic trước: microservice + MFE + Kafka saga). A11y baseline tốt bất thường (skip link, focus management, role=alert/status) — giữ nguyên semantics. Coupling ngầm CSS shell→remotes là nợ lớn nhất: remotes ăn global CSS của shell, standalone mất style; 11 chỗ inline style; 0 media queries.
- **Success criteria** (binary): (1) Login `alice@demo.local` → nav → Tasks CRUD (tạo/sửa tiêu đề/xoá/đổi status/phân trang/filter) → Activity feed phản ánh — toàn bộ trên UI mới qua `:8080`. (2) Saga demo 4b: assign `fail@demo.local` → badge "Gán thất bại" nhận diện rõ. (3) Kill 1 remote → fallback đẹp + retry hoạt động. (4) Standalone `:4001`/`:4002` có style. (5) 3 package: `pnpm test` + `pnpm typecheck` xanh (38 case cũ update đồng bộ + tests mới primitives). (6) Responsive: dùng được ở 375px (không overflow ngang). (7) Không deps mới — `pnpm-lock.yaml` không đổi.
- **Out-of-scope**: dark mode (tokens CSS vars để sẵn điểm cắm); i18n framework (giữ hardcode vi); icon library/CDN font; backend/API thay đổi; e2e browser tự động (mở rộng CI); nâng cấp bất kỳ dependency nào; scaffold script (tự thừa hưởng — verify thôi).

## Quyết định đã chốt (BALANCED — agent tự quyết theo conventions, flag cho user duyệt ở STORY-READY)

| # | Quyết định | Chọn | Flag |
|---|---|---|---|
| 1 | Phạm vi | Visual redesign + đóng UX gaps **bằng API hiện có** (limit≤100+offset, filter status, PATCH title/desc, DELETE, assignee/createdAt fields) — không tính năng ngoài contract | |
| 2 | Nguồn thiết kế | Không Figma → designer 3 hướng (mock-prototype) → **USER GATE chọn** → hand-off `docs/superpowers/designs/ui-redesign-direction.md` = source of truth mọi SF sau. **ĐÃ XỔI 2026-10-13 lúc CREATE (front-load design gate)**: user chọn **hướng B "Linear-referenced dark"** sau khi xem 3 bản draft (`designs/drafts/`) — gate record `designs/direction-approved.md`. SF-1 còn mỗi implement | ~~USER GATE~~ ĐÃ DUYỆT |
| 3 | Nơi đặt design system | `frontend/shared` thêm `src/styles/` (tokens.css + base.css) + `src/ui/` (React primitives) — mọi package import (giải luôn coupling standalone). **Ownership exception**: epic cấp cho SF-1 sở hữu 2 thư mục này; 4 file logic (api-client/token-storage/error-envelope/mf-bootstrap) vẫn READ-ONLY tuyệt đối | ⚠ ownership change |
| 4 | UI library ngoài | KHÔNG — CSS thuần + tokens + class utilities, SVG inline nếu cần icon. Lý do: 0 deps mới, boilerplate dễ copy | |
| 5 | Kiến trúc CSS | tokens.css (custom properties `:root`, idempotent — nhiều bản cùng giá trị vô hại) + base.css tối thiểu (`@layer reset,base` cùng thứ tự mọi bản) — shell import LÀM CHỦ global base; remote chỉ import tokens + scoped classes (tránh 2 bản base đè nhau) | |
| 6 | Dark mode / i18n | Out-of-scope (điểm cắm để sẵn trong tokens) | |
| 7 | Responsive | Include: breakpoints ≤768px / ≥1024px, nav wrap, list 1 cột mobile — verify thủ công 375px ở SF-5 (jsdom không assert media query) | |
| 8 | Chuỗi UI text Việt | Bộ aria-label/text nguyên văn hiện có là **contract có test** — giữ nguyên максимально; designer chỉ đề xuất đổi khi cần, đổi = cùng-commit với test | |
| 9 | Test đỏ phân mảnh | Quy tắc: SF đổi chuỗi nào thì update test chuỗi đó TRONG CÙNG SF — không để đỏ chờ SF khác | |

## Contracts ghim (CHECKLIST — SF agents đối chiếu trước khi code)

1. **MF registry** (conventions/08 + rspack exposes): name `tasks`/`activity`, file `remoteEntry.js`, expose `./TasksPage`/`./ActivityPage` (+ default export), URL prod `/remotes/<name>/remoteEntry.js`, env `REMOTE_TASKS_URL`/`REMOTE_ACTIVITY_URL`/`REMOTE_PUBLIC_PATH`. KHÔNG đổi.
2. **Async boundary** `shell/src/index.tsx` = `import('./bootstrap')` — giữ nguyên (RUNTIME-006).
3. **Singleton MF**: react/react-dom singleton; remotes `requiredVersion: false`. Pin matrix catalog bất biến.
4. **API client interface** từ fe-shared — `ApiClient` + signature các call HIỆN CÓ không đổi; remote-local `src/api.ts` **ĐƯỢC MỞ RỘNG** (thêm query params limit/offset/status + hàm mới vd `deleteTask`) đúng contract `tasks.yaml`; không gọi endpoint ngoài `/api/auth/login`, `/api/tasks*`, `/api/activity/*` (KHÔNG resolve tên assignee qua `/api/users` — ngoài pin + sai base URL dev của remote).
5. **A11y contracts** (có test, KHÔNG thụt lùi) — exhaustive: skip link `href="#main-content"` + text "Tới nội dung chính"; `main id="main-content" tabIndex={-1}` + focus khi đổi route; `role="alert"` mọi error banner; `role="status"` badge; aria-label nguyên văn: "Điều hướng chính", "Form đăng nhập", "Quản lý tasks", "Form tạo task", "Danh sách tasks", "Trạng thái task <title>", "Activity feed và thống kê", "Thống kê tasks", "Tổng số task", "Task Cần làm/Làm/Xong", "Sự kiện 24h qua", "Danh sách hoạt động"; `data-testid="nav-user"`.
6. **Test harness**: vitest + Testing Library jsdom; mock tầng `../src/api`; stub `__API_BASE_URL__` trong vitest define.
7. **Build/deploy**: Dockerfile multi-stage + nginx SPA fallback + security headers giữ cấu trúc; KHÔNG thêm asset ngoài (CSP chưa set); thêm `output.cssFilename: '[name].[contenthash].css'` prod để cache-busting khi re-deploy (CSS emit ở root path — KHÔNG nằm trong `/assets/` immutable; dời js+css vào `/assets/` = ngoài scope story này).
8. **Read-only tuyệt đối**: `frontend/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts`, `frontend/shared/package.json` trường `mfToolkit`, `contracts/**`, `platform/gateway/**`, `services/**`, `scripts/smoke/e2e.sh`, `platform/conventions/08`, `frontend/spike/**`, mọi Dockerfile/nginx.conf.
9. **CI e2e API-level không đổi** — story này human gate = browser walkthrough mục 4 + 4b.

## P0 impact — 10 chiều (tóm tắt, full trong context packs)

**Rủi ro đã phán** (P0 analyst, đọc code thật):

| # | Rủi ro | Sev | Mitigation (bắt buộc) | SF |
|---|---|---|---|---|
| R1 | Remotes rspack KHÔNG có css rule + experiments.css → import fe-shared CSS fail build ngay | **P0** | Copy y hệt rule của shell (`rspack.config.mjs:42-45,85-87`) vào 2 remote + `declare module '*.css'` vào env.d.ts ×3 | SF-1 |
| R2 | JSX trong fe-shared → `react/jsx-runtime` ngoài shared scope → duplicate react/hooks crash runtime lúc remote mount trong shell | **P0** | Thêm `'react/jsx-runtime': {singleton:true, requiredVersion:false}` vào shared CẢ 3 config + **spike build 3 package load thật soi console** trước khi restyle; fallback: primitives class-only (không JSX) | SF-1 |
| R3 | 2 bản base/tokens cùng load (shell + runtime remote CSS) — đè nhau / stale cache lệch version | P1 | tokens idempotent; base tối thiểu + `@layer` cùng thứ tự; shell làm chủ global base — remote chỉ tokens + scoped; cssFilename contenthash | SF-1 |
| R4 | Standalone :4001/:4002 mất style | P1 | remote `src/index.tsx` import base+tokens (sau R1) | SF-3/4 |
| R5 | Đổi chuỗi UI Việt → đỏ test phân mảnh | P1 | Quy tắc cùng-commit cùng-SF (quyết định #9) | mọi SF |
| R6 | A11y thụt lùi khi restyle | P1 | 3 test a11y là hard gate; palette hand-off phải đạt AA 4.5:1 (benchmark hiện tại `#742a2a`/`#fed7d7` đạt); animation mới → `prefers-reduced-motion` | mọi SF |
| R7 | fe-shared ownership (SF-1 cũ sở hữu) | P2 | Epic cấp ownership giới hạn `src/styles/`+`src/ui/` cho SF-1 mới; update comment pnpm-workspace.yaml + package.json description | SF-1 |
| R8 | Phình scope font/icon CDN → mở CSP | P2 | NO-GO by design: 0 external asset, system-ui stack | tất cả |
| R9 | Mất dấu badge `assignment_failed` (walkthrough 4b) | P2 | Badge = primitive bắt buộc trong hand-off; walkthrough chạy lại ở SF-5 | SF-5 |

**Facts SF agents phải mang theo**: (f1) css rule template shell:42-45,85-87; (f2) jsx-runtime sharing + spike trước restyle; (f3) cssFilename contenthash; (f4) kiến trúc CSS đích = fe-shared base.css nguồn element defaults, remote tokens + scoped; (f5) aria-label/text Việt = contract; (f6) CI không nhìn UI; (f7) 0 deps mới; (f8) ownership giới hạn; (f9) registry pin; (f10) thứ tự designer → nền móng → restyle song song → walkthrough.

## Kiến trúc đích (design system)

```
frontend/shared/src/
  styles/tokens.css   ← custom properties :root — màu (palette hand-off, AA), spacing scale,
  │                     type scale, radius, shadow, breakpoint vars, z-index. Idempotent.
  styles/base.css     ← @layer reset,base — reset tối thiểu + element defaults (body font,
  │                     form control, focus-visible, .error-banner, .skip-link…). Giống hệt
  │                     mọi bản — copy ×3 bundle vô hại khi cùng version.
  ui/Badge.tsx        ← status/action badge (role="status"), variant theo tokens — dùng cho
  ui/EmptyState.tsx   ←   task status + assignment_failed + activity action
  ui/Skeleton.tsx     ← loading skeleton (thay "Đang tải…" text-only) + aria-busy
  ui/Spinner.tsx      ← busy indicator nhỏ (per-item, submitting)
Consumers: shell/bootstrap.tsx import base+tokens (LÀM CHỦ global); remotes import tokens
trong page entry + scoped classes riêng; remote standalone src/index.tsx tự import base+tokens.
```

## SF split (5 SF — rubric C1-C5/V1-V3 + anti-duplicate)

**Anti-duplicate check (liệt kê tasks mọi SF trước khi chốt):** primitives/tokens/rspack-css/jsx-runtime/spike = CHỈ SF-1 (SF-2/3/4 consume — không tái hiện); restyle mỗi package = touch map disjoint (shell / tasks / activity); test updates = per-SF khu mình (Zweck); browser walkthrough = chỉ SF-5. Pattern lặp ≥2 SF: KHÔNG có. SF-2/3/4 cùng "loại" (restyle) nhưng khác surface + <50% tasks trùng loại thực tế (login/nav/fallback vs form/list/pagination vs feed/stats). SF nào cũng ≥8 tasks.

### Phase 1 — nền móng (checkpoint: 3 package build xanh + spike duplicate-react sạch + primitives có test)

**SF-1 · Design direction + design-system nền móng** (tier 0, ~14 tasks, design: mock-prototype — **USER GATE chọn hướng**)
- Designer (huashu-design): 3 hướng HTML prototype (login + tasks + activity 3 màn hình chính mỗi hướng) → user chọn → hand-off `docs/superpowers/designs/ui-redesign-direction.md` (palette AA contrast values, type/spacing scale, component spec, motion tối giản)
- `fe-shared/src/styles/tokens.css` + `base.css` (@layer reset,base) theo direction đã chọn
- Primitives `ui/`: Badge (role=status + variants), EmptyState, Skeleton (aria-busy), Spinner
- Barrel export + package.json exports map (chỉ đụng phần mới — 4 file logic READ-ONLY)
- Rspack: css rule + experiments.css cho 2 remotes (template shell), `declare module '*.css'` env.d.ts ×3 (defensive — tsc hiện PASS nhờ side-effect import, thêm phòng named import), `'react/jsx-runtime'` shared ×3
- **Spike R2 chạy SỚM** — ngay sau task config jsx-runtime ×3 với 1 JSX stub tối thiểu, TRƯỚC khi viết primitives (FAIL muộn = rewrite đắt nhất). Exit criteria: build 3 package → load shell + remote mount + 1 tương tác (đổi status) OK + console KHÔNG có "Invalid hook call"/"2 copies of React" → screenshot vào `docs/superpowers/evidence/`; FAIL → fallback primitives class-only (không JSX), hand-off ghi luôn API shape thay thế
- Primitives props API: document TS props từng primitive trong hand-off doc (Badge variant enum phủ 4 status extended tasks + 5 action labels activity) — SF-2/3/4 consume theo đúng shape này; tests primitives sống ở `frontend/shell/tests/` (fe-shared KHÔNG có vitest — thêm vào sẽ đụng lockfile)
- `output.cssFilename` contenthash ×3 (prod)
- Remotes standalone `src/index.tsx` import base+tokens (fix R4 một nửa — full fix visual ở SF-3/4)
- Tests: primitives (Badge role/status, EmptyState text, Skeleton aria-busy, Spinner label) + shell build smoke
- Ownership notes: pnpm-workspace.yaml comment + fe-shared README + description
- Demo: storybook-less — 1 trang demo HTML đơn giản trong hand-off hoặc standalone :4001 render primitives

### Phase 2 — 3 surface song song (checkpoint mỗi SF: package đó test+typecheck xanh + dev-server xem được UI mới)

**SF-2 · Shell — layout, login, nav, remote fallback** (tier 1, ~10 tasks — design theo hand-off SF-1, KHÔNG gate mock riêng)
- Layout: container max-width + header/page structure theo direction (giữ skip link + #main-content + focus logic NGUYÊN VẸN)
- NavBar: active state (`aria-current="page"` + visual), responsive wrap ≤768px
- NavBar: user chip + logout/login styling (giữ `data-testid="nav-user"`)
- HomePage: từ "Trang chủ" trống → dashboard chào + quick links 2 remote + demo hints (alice/fail@demo.local)
- LoginPage: card giữa màn hình + error banner styling + demo hint format đẹp — behavior + tests giữ (redirect, deep-link, error messages nguyên văn)
- RemoteSlot: Suspense fallback = Skeleton (thay `<p>Đang tải {name}…</p>` — không test nào assert chuỗi này, thay an toàn), error fallback visual (giữ text "Không tải được phần tasks…" + nút "Thử lại" — test contract)
- `shell/src/styles.css` rewrite → scoped classes + consume tokens (xóa element selectors toàn cục đã chuyển vào base.css)
- Tests tách theo surface: a11y 3 case giữ nguyên vẹn / login / remote-slot / integration update chuỗi nếu đổi
- Diff-hygiene cuối SF (không secrets, không exec-bit mới — phase-gate security của coordinator)

**SF-3 · Remote tasks — TasksPage redesign + UX gaps** (tier 1, ~13 tasks)
- Tách component: TaskForm / TaskList / TaskItem / StatusSelect (giữ export default + named cho MF)
- TaskItem: card layout responsive, StatusBadge dùng primitive Badge (giữ "Gán thất bại" role=status + text), per-item busy (Spinner + disable select) khi PATCH đang bay
- Edit inline title/description (PATCH có sẵn — nút sửa → input inline → save/cancel)
- Delete task (DELETE có sẵn — nút xoá + confirm dialog; task.deleted vào feed tự nhiên qua Kafka)
- Hiển thị assignee (UUID rút gọn monospace + tooltip full — KHÔNG resolve tên qua `/api/users`) + createdAt
- Pagination "Tải thêm" (limit ≤100 + offset — API có sẵn) + hiển thị "x/total"
- Filter theo status (?status= — API có sẵn) — chip/toggle bộ 3 writable status
- Loading = Skeleton list (primitive), empty = EmptyState (primitive), error banner giữ role=alert + message 503 spring
- `src/index.tsx` standalone: banner debug đẹp + đã có CSS (kế thừa SF-1)
- Scoped css riêng theo kiến trúc CSS đích (mục "Kiến trúc đích" — tokens từ fe-shared, KHÔNG element selectors toàn cục; SF-3∥SF-4 chạy song song nên không copy code nhau)
- Tests: update chuỗi nếu đổi + THÊM case mới (edit inline gọi PATCH đúng, delete gọi DELETE + confirm, load-more gọi offset, filter gọi ?status=, per-item busy)

**SF-4 · Remote activity — ActivityPage redesign** (tier 1, ~9 tasks)
- Stats: grid layout responsive + StatTile cards dùng tokens (giữ nguyên bộ aria-label)
- Feed: timeline theo nhóm ngày + item card (action badge primitive + userName/taskTitle)
- Feed item: time vi-VN + unknown action fallback nguyên văn
- Nút "Làm mới" styling + busy state (Spinner)
- Loading = Skeleton (feed + stats riêng biệt — giữ Promise.allSettled independence)
- Empty = EmptyState hướng dẫn sang Tasks
- Scoped css riêng (theo kiến trúc CSS đích), standalone banner debug
- Tests: update + thêm (stats card grid aria-label giữ, skeleton xuất hiện lúc loading)
- Diff-hygiene cuối SF (phase-gate security)

### Phase 3 — hội tụ (checkpoint: walkthrough người + full suite xanh)

**SF-5 · Convergence — browser walkthrough + docs + security** (tier 2, ~9 tasks)
- Rule 0 browser walkthrough trên compose `:8080`: login → nav active → Tasks CRUD (tạo/sửa/xoá/đổi status/filter/load-more) → Activity phản ánh (feed Kafka) → saga 4b (assign fail@demo.local → badge "Gán thất bại" nhận diện) → kill 1 remote dev → fallback + retry → standalone :4001/:4002 có style — screenshot evidence
- Responsive spot-check 375px (không overflow ngang) — 3 màn hình chính
- Full suite: `pnpm -r test` + `pnpm -r typecheck` 3 package + build prod 3 package
- Docs sync: walkthrough mục 4/4b đối chiếu UI mới (label đổi = update), README repo-map (fe-shared thêm design system), frontend READMEs
- Security pass: diff không chứa secrets, không exec-bit mới, không asset ngoài, CSP untouched, `.env` không commit
- Scaffold sanity: chạy scaffold copy → output có `frontend/shared/src/styles|ui` (design system theo project mới), build được
- Improvements-log: patterns story này
- Báo (không fix) bug product thấy được — SF owning xử lý

## Phased-release

- **Phase 1** = SF-1 (shippable: design system đứng cạnh UI cũ — UI cũ vẫn chạy dùng CSS riêng; không phá gì).
- **Phase 2** = SF-2 ∥ SF-3 ∥ SF-4 (mỗi SF shippable độc lập: package đó đã restyle, package kia vẫn cũ nhưng tokens không phá — khác surface). Visual transient GIỮA các merge trong Phase 2 là expected (shell merge trước → remotes cũ mất element styles cũ đã chuyển vào base.css tối thiểu — chấp nhận cho repo demo, tự hết khi cả 3 merge).
- **Phase 3** = SF-5 (walkthrough + docs — chỉ有意义 khi cả 3 surface xong).
- Release checkpoint sau mỗi phase; phase checkpoint kèm security-audit pass (P0/P1 sạch mới qua) — Phase 1/2: diff-hygiene checklist do SF cuối mỗi phase chạy (task có trong SF) + coordinator duyệt; Phase 3: security pass đầy đủ trong SF-5.

## Acceptance (epic-level, user-visible)

1. Mở `:8080` → login → 3 trang (Trang chủ / Tasks / Activity) nhất quán một design direction đã user-chọn — không còn mặc định trình duyệt trơ trụi.
2. Tasks: tạo → sửa tiêu đề inline → đổi status (per-item busy) → xoá (confirm) → filter status → "Tải thêm" — tất cả phản ánh BE thật; tổng số "x/total" đúng.
3. Activity: stats cards + timeline feed phản ánh mọi thao tác trên Tasks (qua Kafka), time vi-VN.
4. Saga 4b: assign `fail@demo.local` → task hiện badge "Gán thất bại" rõ ràng; re-assign bob + status todo → về luồng thường.
5. Kill remote-tasks → shell còn nguyên, slot tasks hiện fallback đẹp + "Thử lại" hoạt động; activity vẫn chạy.
6. Standalone `:4001` / `:4002` mở trực tiếp có style (không còn trơ).
7. 375px: 3 màn hình chính dùng được, không overflow ngang.
8. `pnpm -r test && pnpm -r typecheck` xanh; `pnpm-lock.yaml` không đổi; e2e smoke `scripts/smoke/e2e.sh` vẫn PASS (không đụng).

## Boundary epic-level

- KHÔNG đụng: BE services, gateway, contracts OpenAPI/DDL, `scripts/smoke/e2e.sh`, CI workflows, `platform/conventions/08`, pin matrix, Dockerfile/nginx cấu trúc (trừ cssFilename là rspack config).
- KHÔNG: dark mode, i18n framework, icon/font CDN, dependency mới, nâng cấp version, e2e browser tự động, đổi MF registry/exposes, đổi API call shapes.
- fe-shared: CHỈ được thêm `src/styles/` + `src/ui/` (+ barrel/exports phần mới) — 4 file logic READ-LOCKED.
- Design direction: chỉ user chọn (gate SF-1) — agent không tự chốt hướng cuối.
