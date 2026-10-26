# {{appName}} — React + Vite + @wakii/ui-kit (JavaScript)

Starter **JavaScript** scaffolded by `create-wakii-app` — React 19 + Vite 7 + Tailwind v4 +
[@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) (tokens-first React design
system, 90+ components antd-look, dark theme, motion). Bản TypeScript: `--lang ts` (template
`vite-ts`) — y hệt demo, chỉ khác types.

## Quick start

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # production build → dist/
pnpm preview  # xem build prod
```

## Có gì trong hộp

- **Dark toggle hoạt động thật** (nút moon trên header): `useAppTheme` (src/theme.js) persist
  `localStorage` + đặt `data-bp-theme` trên `<html>` — toàn bộ token của kit cascade theo,
  0 re-render, 0 flash.
- **Demo dogfooding**: Tag · Title/Text · 3 Button · Alert ×4 · Table (3 cột + Badge status) ·
  CountUp Statistic · Card — mọi thứ qua component của kit, tokens-only (0 hex).
- **Customize pass** (ui-kit 0.6+): mọi component nhận `classNames` slots + `style` passthrough —
  xem card "Customize pass" trong `src/App.jsx` (Input root pill, Button pill, Tag accent, Card hover).
- **CSS một file** (src/styles.css): tokens + base từ kit + Tailwind v4 utilities.

## Cấu trúc

```
├── index.html            # title = tên app
├── vite.config.mjs       # react + tailwindcss plugins
├── jsconfig.json         # checkJs: false (không type-check JS), jsx: react-jsx
└── src/
    ├── main.jsx          # import styles.css TRƯỚC render
    ├── styles.css        # tokens + base (kit) + tailwindcss + @source kit
    ├── theme.js          # useAppTheme — dark/light toggle (data-bp-theme)
    └── App.jsx           # trang demo — điểm bắt đầu sửa
```

## Tokens & dark theme trong 30 giây

Màu/bo góc/độ trễ/đổ bóng của mọi component đọc **CSS variables** từ
`@wakii/ui-kit/styles/tokens.css`. `data-bp-theme="dark"` trên `<html>` khiến `tokens.css`
đổi giá trị var (dark.css scope theo attribute) — component không hardcode màu nên cả app
đổi theme 1 dòng:

```html
<html data-bp-theme="dark">
```

Xem `src/theme.js` để thấy pattern đầy đủ (persist + set/remove attribute).

## Khác biệt so với bản TypeScript

| | vite-js (bản này) | vite-ts |
|---|---|---|
| Files | `.jsx` / `.js`, không types | `.tsx` / `.ts` |
| Config | `vite.config.mjs` | `vite.config.ts` + `tsconfig.json` |
| Type-check | `jsconfig.json` với `checkJs: false` | `tsc --noEmit` trong build |
| devDeps | vite + plugin-react + tailwind (không typescript/@types) | + typescript, @types/react(-dom) |

Hành vi demo y hệt — đổi ngôn ngữ bất cứ lúc nào bằng cách copy code qua bản TS.

## Đổi tên app

`{{appName}}` đã được `create-wakii-app` render lúc scaffold (package.json `name`,
`index.html` title, brand trên header). Đổi tay: sửa 3 chỗ đó.

## Tài liệu kit

- [Storybook live](https://storybook-static-khaki-two.vercel.app) — catalog mọi component
- [USAGE.md](https://github.com/wakii-dev/architecture-overview/blob/main/app/ui-kit/USAGE.md) — deep dive theo nhóm
- [CHANGELOG.md](https://github.com/wakii-dev/architecture-overview/blob/main/app/ui-kit/CHANGELOG.md) — releases
