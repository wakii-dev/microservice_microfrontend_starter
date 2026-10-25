# create-wakii-app

[![npm](https://img.shields.io/npm/v/create-wakii-app?logo=npm&label=create-wakii-app)](https://www.npmjs.com/package/create-wakii-app)

CLI scaffold app React + [@wakii/ui-kit](https://www.npmjs.com/package/@wakii/ui-kit) — CRA-style: interactive prompts, non-interactive flags. **Published [`create-wakii-app@0.1.0`](https://www.npmjs.com/package/create-wakii-app) trên npmjs.org.**

## Dùng

```bash
npm create wakii-app@latest my-app     # chính thức
npx create-wakii-app my-app            # npx
pnpm create wakii-app my-app           # pnpm
yarn create wakii-app my-app           # yarn
```

Interactive flow — thiếu gì prompt nấy (tên project → react-router? → extras multiselect → confirm → scaffold), xong in next-steps:

```
cd my-app
pnpm install
pnpm dev
```

Non-interactive:

```bash
pnpm create wakii-app my-app --yes                                  # toàn default (ts + router, 0 extra)
pnpm create wakii-app my-app --yes --extras chart                   # default + demo chart route
pnpm create wakii-app ~/code/my-app --lang js --skip-install        # path + JavaScript, bỏ gợi ý install
```

## Flags

| Flag | Ý nghĩa | Default |
|---|---|---|
| `[appName]` (positional) | Tên **hoặc đường dẫn**: `my-app` → `./my-app`; `/a/b/my-app` → đích `/a/b/my-app`. Package name luôn lấy **basename** (path không lọt vào package.json) | prompt (`my-wakii-app`) |
| `--lang ts\|js` | TypeScript / JavaScript (nhận cả `--lang=js`) | `ts` |
| `--router` / `--no-router` | react-router v7 (prompt khi thiếu — trừ khi `--yes`) | có |
| `--extras <list>` | demo subpath: `chart · carousel · schedule · editor` (nhận cả `--extras=a`). Extras **kéo theo router** (demo subpath là route riêng) | none |
| `--yes` | bỏ prompt, lấy default | — |
| `--skip-install` | bỏ `pnpm install` ở next-steps | — |
| `-h`, `--help` | in hướng dẫn | — |

Lỗi có chủ đích: `--no-router` + `--extras` mâu thuẫn → CLI báo rõ và thoát (bỏ một trong hai). CLI **không tự install** — chỉ in next-steps (`cd` theo đúng đích đã tạo, kể cả khi dùng path).

## Template chứa gì

Base (ts/js) — app demo dogfooding **`@wakii/ui-kit` ^0.5.0** (pin 0.5.0: bản exports dist đầu tiên):

- **Dark toggle hoạt động thật** — `useAppTheme` (src/theme) persist `localStorage` + đặt `data-bp-theme` trên `<html>`; mọi component kit cascade theo, không re-render.
- **Demo components**: hero wash + Tag/Title/Text + 3 Button · Table 3 cột (Badge status) · Alert ×4 · CountUp Statistic · Card "What's inside" (links Storybook + npm).
- **Tokens-first**: một file styles.css (tokens + base từ kit + Tailwind v4 + `@source` kit) — 0 hex trong app.

Router (default CÓ, react-router v7): route `/` demo + `/about` giới thiệu kit (NavLink). Extras: mỗi extra thêm 1 route demo dùng đúng subpath (`@wakii/ui-kit/chart`, `./carousel`, `./schedule`, `./editor`) + peer dep tương ứng ghi vào package.json.

## Kiến trúc (repo)

- `src/options.ts` — parse flags tự viết (0 dep parser) + defaults + validate (`--no-router` × `--extras` throw)
- `src/scaffold.ts` — copy đệ quy template → render placeholder `{{appName}}` (binary bỏ qua) → áp overlays `router`/`extras/<name>` → merge deps vào package.json
- `src/index.ts` — flow prompt `@clack/prompts` + log + next-steps (wire UI thôi)

Nguồn template: `app/starter-templates/vite-ts|vite-js` + `template-feats/` (worker riêng sở hữu). Overlay dùng cho variant JS phải type-free (engine chỉ đổi đuôi `.tsx→.jsx`); nếu overlay có thư mục `vite-js/` riêng thì dùng nguyên thư mục đó.

## Phát triển

```bash
pnpm --filter create-wakii-app typecheck
pnpm --filter create-wakii-app test      # fixture templates giả trong tmp — không network
```

Publish lên npmjs: `./scripts/publish-npm.sh` — build (tsup) rồi bundle `dist` + **`starter-templates/`** (vite-ts + vite-js) vào package (`files` field — npm không nhận path `../`), set `publishConfig` public, publish bằng `NPM_TOKEN` (env) hoặc `_authToken` sẵn trong `~/.npmrc`.
