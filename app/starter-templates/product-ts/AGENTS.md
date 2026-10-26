# AGENTS.md — luật kiến trúc cho AI agents (và người mới)

File này là nguồn sự thật về CẤU TRÚC project. Đổi cấu trúc = sửa file này trước,
code theo sau. ESLint (`pnpm lint`) enforce phần lớn luật bằng
`eslint-plugin-boundaries` — vi phạm = lỗi lint, không phải chuyện "thích thì bỏ qua".

## Cấu trúc thư mục

```
src/
├── main.tsx            # Entry: MSW (dev) → styles.css → Providers → Router (chỉ wire)
├── env.ts              # Chốt biến môi trường bằng zod — fail nhanh khi sai
├── styles.css          # CSS kit (tokens/dark/base/tailwind) + @source — KHÔNG viết style mới ở đây
├── app/                # Wiring tầng app
│   ├── providers.tsx   # UiKitProvider → QueryClientProvider → ErrorBoundary
│   ├── query-client.ts # Instance TanStack Query dùng chung (defaults kê ở đây)
│   ├── router.tsx      # Header sticky + lazy Routes (Suspense Skeleton)
│   └── theme.ts        # useAppTheme() — dark mode qua data-bp-theme
├── routes/             # 1 file = 1 trang (default export), lazy-loaded
├── features/           # MỖI feature 1 thư mục, khép kín theo layers (bên dưới)
│   └── tasks/          # Feature mẫu — copy cấu trúc này cho feature mới
├── mocks/              # MSW: handlers CRUD giả + browser worker (CHỈ dev)
└── shared/
    ├── api/            # client.ts (fetch wrapper) + query-keys.ts (factory)
    ├── ui/             # Component UI xài chung (PageHeader…) — KHÔNG fetch data
    └── lib/            # Helper thuần (utils.ts) — không React, không DOM
```

## Feature anatomy (`features/<tên>/`)

```
features/tasks/
├── index.ts        # CỔNG DUY NHẤT ra ngoài — export containers + ui
├── schema/         # zod schema: type TS + parse response + validate form
├── api/            # tasks-api.ts: shared client + zod parse (THUẦN TS, cấm react)
├── hooks/          # useTasks (query + mutation optimistic), useTaskForm (useForm kit)
├── containers/     # nối hooks/api → ui qua props (duy nhất chỗ chạm data layer)
└── ui/             # presentational: nhận props, không tự fetch
```

Luồng phụ thuộc 1 chiều: `routes → index → containers → (hooks → api) → ui`,
mọi tầng được phép đọc `schema/`.

## Bảng luật import (enforce bằng eslint-plugin-boundaries)

Cột "được import" = nguồn ĐƯỢC phép; mọi thứ ngoài bảng = cấm (default disallow).

| Từ ↓ vào → | `routes/` | `features/*/index` | `containers/` | `hooks/` | `api/` | `schema/` | `shared/api` | `shared/ui` | `shared/lib` | `env.ts` |
|---|---|---|---|---|---|---|---|---|---|---|
| `main.tsx` (entry) | — | — | — | — | — | — | — | — | — | — |
| `app/` | ✅ | — | — | — | — | — | ✅ | ✅ | ✅ | ✅ |
| `routes/` | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ | — | ✅ | ✅ | — |
| `features/*/index` | — | — | ✅ | — | ✅ | ✅ | — | — | — | — |
| `containers/` | — | — | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | — |
| `hooks/` | — | — | — | — | ✅ | ✅ | ✅ | ❌ | ✅ | — |
| `api/` | — | — | — | — | — | ✅ | ✅ | ❌ | ✅ | ✅ |
| `schema/` | — | — | — | — | — | — | — | ❌ | ✅ | — |
| `shared/api` | — | — | — | — | — | — | — | ❌ | ✅ | ✅ |
| `shared/ui` | — | — | — | — | — | — | — | — | ✅ | — |

- `routes/` chỉ được import feature QUA `features/*/index.ts` — import lách vào
  `containers|ui|hooks|api` = lỗi lint (message sẽ nhắc đúng luật).
  \* routes→routes: trang dùng layout chung đặt trong `routes/` (vd admin layout).
- `ui/` cấm `containers|hooks|api` (data do container bơm qua props — UI thuần).
- `hooks/` cấm `ui/` (hook trả data/state, không render).
- `api/` cấm react/react-dom (override `no-restricted-imports` — tầng thuần TS).
- `shared/` "nguội": không import ngược lên app/routes/features.
- Ngoại lệ duy nhất: file `*.test.ts(x)` được import tự do.
- Import nội bộ dùng alias `@/` → `src/`; trong feature dùng đường dẫn tương đối
  (`../schema/schema`).

## Quy ước đặt tên

| Thứ | Tên | Ví dụ |
|---|---|---|
| Route page | kebab-case file, default export | `routes/task-detail.tsx` |
| Container | `XxxContainer` — cặp với UI `Xxx` | `TasksPageContainer` ↔ `TasksPage` |
| Component UI | PascalCase trùng tên file | `TaskForm.tsx` → `TaskForm` |
| Hook | `useXxx`, file trùng tên | `useTasks` |
| API của feature | `<tên>-api.ts`, object `<tên>sApi` | `tasks-api.ts` → `tasksApi` |
| Schema | `schema.ts` duy nhất mỗi feature | `taskSchema`, `taskFormSchema` |
| Query keys | instance `createQueryKeys('<resource>')` | `tasksKeys.list()` |
| Test | cạnh file, `+ .test.ts(x)` | `useTasks.test.tsx` |

Tầng nào có test mẫu trong feature tasks: api (msw node + zod), hooks
(renderHook + wrapper QueryClient), ui (RTL props cứng) — copy khi thêm feature.

## Recipe — thêm 1 feature mới (5 bước)

1. Tạo `features/<tên>/` theo anatomy trên (copy `tasks/` là nhanh nhất), sửa
   schema trước — zod schema là hợp đồng dữ liệu, mọi tầng code theo sau.
2. Viết `api/<tên>-api.ts`: call `apiFetch` từ `@/shared/api/client` + parse zod
   + export `xxxKeys = createQueryKeys('<tên>s')`.
3. Viết hooks: list query + mutation (optimistic khi hợp lý), form hook nếu có.
4. Viết `ui/` thuần props → `containers/` nối data → export tất cả qua `index.ts`.
5. Trang dùng feature: `routes/<trang>.tsx` import `{ ...Container }` từ
   `@/features/<tên>` + đăng ký route trong `app/router.tsx`. Viết 3 test
   (api/hooks/ui) cạnh file. Chốt: `pnpm lint && pnpm typecheck && pnpm test`.

## Data layer — vận hành

- **MSW (mock)**: dev chạy tự động (`main.tsx` bật khi `import.meta.env.DEV`) —
  handlers giả trong `src/mocks/`, data reset mỗi reload. Nối backend thật: đặt
  `VITE_API_URL` trong `.env.local` (MSW vẫn chạy dev — tắt bằng cách bỏ dynamic
  import trong main) hoặc build production (mock không có trong bundle).
- **client.ts**: mọi call đi qua đây — baseURL từ env, timeout 8s, lỗi envelope
  `{ message }` ném ra `ApiError` (bắt theo `status`).
- **query-keys**: invalidate theo tiền tố — `tasksKeys.lists()` invalidates mọi
  list nhưng không đụng detail.
- `public/mockServiceWorker.js` do `pnpm exec msw init public/` sinh — nâng cấp
  msw thì chạy lại lệnh đó.

## Quy ước UI (@wakii/ui-kit)

- Tokens-only: `bg-canvas/s1/s2/s3`, `text-ink/ink2/ink3`, `border-line`,
  `text-accent`, `bg-accent` — không hex trong className.
- Dark mode tự cascade qua `data-bp-theme` (đã wire trong `theme.ts`).
- Giữ dòng `@source '../node_modules/@wakii/ui-kit/src'` + `…/dist` trong
  `src/styles.css` — thiếu là utilities của kit không được generate (UI vỡ).
- Form: `useForm` + zod schema + `Field` + `Input` (recipe 1 kit) — xem
  `useTaskForm` + `TaskForm` làm mẫu.
- Icon: `<Icon name="…" size={n} />`; z-index chỉ `z-[var(--z-…)]`; motion
  150–200ms với easing token.
