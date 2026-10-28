# AGENTS.md — luật kiến trúc cho AI agents (và người mới)

File này là nguồn sự thật về CẤU TRÚC project. Đổi cấu trúc = sửa file này trước,
code theo sau. ESLint (`pnpm lint`) enforce phần lớn luật bằng
`eslint-plugin-boundaries` — vi phạm = lỗi lint, không phải chuyện "thích thì bỏ qua".

## Cấu trúc thư mục

```
src/
├── main.jsx            # Entry: styles.css → Providers → BrowserRouter → Router (chỉ wire)
├── env.js              # Chốt biến môi trường bằng zod — fail nhanh khi sai
├── styles.css          # CSS kit (tokens/dark/base/tailwind) + @source — KHÔNG viết style mới ở đây
├── app/                # Wiring tầng app: providers, router, theme
│   ├── providers.jsx   # ErrorBoundary + UiKitProvider — thêm provider mới ở đây
│   ├── router.jsx      # Header sticky + lazy Routes (Suspense Skeleton)
│   └── theme.js        # useAppTheme() — dark mode qua data-bp-theme
├── routes/             # 1 file = 1 trang (default export component), lazy-loaded
└── shared/
    ├── ui/             # Component UI xài chung (PageHeader…) — KHÔNG fetch data
    └── lib/            # Helper thuần (utils.js) — không React, không DOM
```

## Bảng luật import (enforce bằng eslint-plugin-boundaries)

Cột "được import" = nguồn ĐƯỢC phép; mọi thứ ngoài bảng = cấm (default disallow).

| Từ ↓ vào → | `app/` | `routes/` | `shared/ui` | `shared/lib` | `env.js` |
|---|---|---|---|---|---|
| `main.jsx` (entry) | ✅ | — | — | — | — |
| `app/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `routes/` | ❌ | — | ✅ | ✅ | ❌ |
| `shared/ui` | ❌ | ❌ | — | ✅ | ❌ |
| `shared/lib` | ❌ | ❌ | ❌ | ✅* | ❌ |

\* lib tự import lẫn nhau trong shared. Đọc ngược bảng: `routes/` KHÔNG được
import lên `app/` (router điều phối routes, không chiều ngược lại); `shared/`
"nguội" — không biết gì về app/routes, do đó tái sử dụng được mọi nơi.

- Import giữa các module dùng alias `@/` → `src/` (vd `@/shared/ui/PageHeader`).
- Ngoại lệ duy nhất: file `*.test.js(x)` được import tự do (fixture, nội bộ).
- External packages (react, react-router, @wakii/ui-kit, zod…) không bị luật này ràng.

## Quy ước đặt tên

| Thứ | Tên | Ví dụ |
|---|---|---|
| Route page | kebab-case file, default export | `routes/task-detail.jsx` → `export default function TaskDetailPage()` |
| Component | PascalCase trùng tên file | `PageHeader.jsx` → `PageHeader` |
| Hook | `use` + camelCase, file trùng tên | `useAppTheme` |
| Helper | camelCase | `cx` |
| Props | JSDoc `@param` cùng file (bản JS không có interface) | `PageHeader` |
| Test | cạnh file, `+ .test.js(x)` | `home.test.jsx` |

Khi project phình (nhiều feature có data/API/form), nâng cấp theo cấu trúc
feature của preset `product` (`pnpm create wakii-app --preset product` để xem mẫu):
`src/features/<tên>/{containers,ui,hooks,api,schema}` — page chỉ import qua
`features/<tên>/index.ts`, luồng phụ thuộc: container → (hooks → api) → ui.

## Recipe — thêm 1 trang mới (5 bước)

1. Tạo `src/routes/<tên>.jsx`, default export component trang. Trang chỉ dựng
   layout từ `@wakii/ui-kit` + `@/shared/ui` — không import gì từ `app/`.
2. Đăng ký route trong `src/app/router.jsx`: thêm `lazy(() => import('@/routes/<tên>'))`
   + 1 dòng `<Route element={…} path="/…" />`.
3. Cần link trong header? Thêm `NavLink` trong `router.jsx` (xem product-ts khi
   có >2 route — lúc đó nên chuyển sang Menu/Sidebar của kit).
4. Cần dữ liệu từ backend? Đừng fetch trong page — đó là lúc nâng cấp sang cấu
   trúc `features/` (mục Quy ước trên).
5. Viết test cạnh file (`<tên>.test.jsx`): render + assert theo role/text, chạy
   `pnpm test`. Chốt: `pnpm lint` phải xanh trước khi commit (bản JS — jsconfig
   để `checkJs: false`, không có bước typecheck).

## Quy ước UI (@wakii/ui-kit)

- Tokens-only: `bg-canvas/s1/s2/s3`, `text-ink/ink2/ink3`, `border-line`,
  `text-accent`, `bg-accent` — không hex trong className.
- Dark mode tự cascade qua `data-bp-theme` (đã wire trong `theme.js`) — không
  code riêng cho dark.
- Giữ dòng `@source '../node_modules/@wakii/ui-kit/src'` + `…/dist` trong
  `src/styles.css` — thiếu là utilities của kit không được generate (UI vỡ).
- Icon: `<Icon name="…" size={n} />` từ bộ của kit; z-index chỉ dạng
  `z-[var(--z-…)]`; motion 150–200ms với easing token.
