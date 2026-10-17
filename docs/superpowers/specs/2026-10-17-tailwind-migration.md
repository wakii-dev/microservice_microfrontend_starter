# Spec: Tailwind v4 migration — toàn bộ app styling

Ngày: 2026-10-17 · Trạng thái: APPROVED (chat cùng ngày) · Bổ sung cho: ui-kit-split spec + 4-phase plan (vẫn đúng, styling cơ chế đổi)

## Quyết định (user đã chọn)

1. **Tailwind áp dụng TOÀN BỘ app** — primitives ui-kit + pages shell/remotes; xoá dần
   scoped css `.tsk-*` / `.sh-*` / `.act-*` và section primitives `bp-*` của base.css.
2. **tokens.css giữ làm NGUỒN DUY NHẤT** — Tailwind v4 `@theme inline` map thẳng
   `var(--accent)`, `var(--ink2)`… → utilities (`bg-accent`, `text-ink2`) tự theo tokens;
   accent-override runtime (Phase theming) hoạt động không đổi config.
3. Tailwind **v4** (CSS-first, `@import "tailwindcss"`): PostCSS plugin cho 3 app Rspack
   (`@tailwindcss/postcss` + postcss-loader), Vite plugin cho Storybook (`@tailwindcss/vite`).
4. **Preflight KHÔNG bật** giai đoạn đầu — giữ reset hiện có của base.css để tránh visual
   shift hàng loạt; cân nhắc đổi sau khi mọi trang đã Tailwind (story riêng).
5. Phase 重排 (build Tailwind-first tránh double-styling):
   - **P0 infra**: @theme + postcss/vite wiring + `@source` cho app/ui-kit sources + proof
     1 primitive (Badge) end-to-end (test + storybook + app build)
   - **P1**: 4 primitives còn lại + `BusyBox` + `className/classNames/style` props + a11y
     addon gate; USAGE.md
   - **P2**: `Tag.Checkable` thay chips Tasks; `Button`; `Input/Textarea` (born Tailwind)
   - **P3**: refactor shell pages (styles.css → utilities, xoá sh-*)
   - **P4**: refactor tasks + activity pages (xoá tsk-*/act-*), base.css chỉ còn reset/global
   - **P5**: `UiKitProvider` accent-override + tokens docs page bản Tailwind
6. Mỗi phase = 1 PR riêng (git-flow), evidence đối chiếu storybook/screenshot giữ pixel
   direction B. Tests đang select theo class `bp-*`/`tsk-*` đổi sang role/structure/API props.

## Non-goals

- Không đổi design direction B (màu/spacing/radius/typography giữ tokens)
- Không dùng tailwind.config.js (v4 CSS-first); không CSS-in-JS runtime
- Không preflight trong phase đầu
