# create-wakii-app

CLI scaffold app React + **@wakii/ui-kit** — `pnpm create wakii-app my-app` (spec chung: `docs/` khi publish — hiện `/tmp/starter-spec.md`).

## Dùng

```bash
pnpm create wakii-app my-app                 # interactive (CRA-style)
pnpm create wakii-app my-app --yes           # toàn default (ts + router, 0 extra)
pnpm create wakii-app my-app --lang js --no-router --extras chart,carousel --skip-install
```

| Flag | Ý nghĩa | Default |
|---|---|---|
| `--lang ts\|js` | TypeScript / JavaScript variant | `ts` |
| `--router` / `--no-router` | react-router v7 | có |
| `--extras a,b` | demo subpath: `chart · carousel · schedule · editor` | none |
| `--yes` | bỏ prompt, lấy default | — |
| `--skip-install` | bỏ gợi ý `pnpm install` ở next-steps | — |

CLI KHÔNG tự install — chỉ in next-steps (`cd`, `pnpm install`, `pnpm dev`).

## Kiến trúc

- `src/options.ts` — parse flags tự viết (0 dep parser) + defaults + validate
- `src/scaffold.ts` — copy đệ quy template → render placeholder `{{appName}}` (binary bỏ qua) → áp overlays `router`/`extras/<name>` → merge deps vào package.json
- `src/index.ts` — flow prompt `@clack/prompts` + log + next-steps (wire UI thôi)

Nguồn template: `app/starter-templates/vite-ts|vite-js` + `template-feats/` (worker riêng sở hữu). Overlay dùng cho variant JS phải type-free (engine chỉ đổi đuôi `.tsx→.jsx`); nếu overlay có thư mục `vite-js/` riêng thì dùng nguyên thư mục đó.

## Phát triển

```bash
pnpm --filter create-wakii-app typecheck
pnpm --filter create-wakii-app test      # fixture templates giả trong tmp — không network
```

Build/publish wiring (bin → dist, files field gộp templates) là bước release — xem RELEASE khi publish.
