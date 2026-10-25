# Decision: design language = antd look (light default) — supersede direction B làm theme phụ

Ngày: 2026-10-17 · Trạng thái: APPROVED (chat) · Supersede phần visual của direction B (VU-53)

## Quyết định

User chốt: "UI cần giống y như antd" + chọn phương án **Clone antd look trên components
tự viết + Tailwind** (không install antd, không giữ dark-only).

1. **tokens.css đổi GIÁ TRỊ sang visual language antd v5/v6 default (light)** — var names
   GIỮ NGUYÊN (components/tests/tailwind @theme không đụng mã):
   - accent `#1677ff` (antd colorPrimary), hover `#4096ff`
   - canvas `#f5f5f5` (colorBgLayout), container `#ffffff`, hover-fill `#fafafa`
   - ink `rgba(0,0,0,.88)` / `.65` / `.45`; line `#d9d9d9` / line2 `#f0f0f0`
   - status: todo gray `#bfbfbf`, doing `#faad14`, done `#52c41a`, fail `#ff4d4f`
   - font stack antd, base 14px; radius 4/6/8 giữ
2. **Direction B hiện tại (dark) trở thành THEME PHỤ** — `styles/themes/dark.css` scoped
   `[data-bp-theme='dark']` (giá trị = tokens direction B cũ y nguyên). Switching =
   Phase theming (UiKitProvider theme='light'|'dark').
3. Structural antd-ness (shadow popover/modal, hover lifts) đi kèm phase migrate
   components/pages — token `--shadow-1` thêm khi phase đó cần.
4. Token docs page + storybook preview chuyển light default, giữ story dark demo.

## Hệ quả

- Pixel của VU-53 evidence (screenshots dark) không còn là current look — archive giữ
  nguyên trong docs/superpowers/evidence (lịch sử).
- prefers-color-scheme / theme switching: Phase theming quyết (không auto-switch giờ).
