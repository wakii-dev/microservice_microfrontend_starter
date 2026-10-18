# RELEASE — quy trình publish version mới

2 registry, 2 token, 3 lệnh. Tokens (lưu an toàn, đừng commit):

| Env | Token | Tạo ở đâu |
|---|---|---|
| `GH_PACKAGES_TOKEN` | `ghp_...` (Classic, `write:packages`) — account **wakii-dev** | github.com/settings/tokens (wakii-dev) |
| `NPM_TOKEN` | `npm_...` (Classic **Automation** — bypass 2FA) — account npm **wakii** | npmjs.com/settings/wakii/tokens |

## 1. Chuẩn bị

```bash
cd app/ui-kit
pnpm test && pnpm typecheck        # 540 tests phải xanh
# bump version trong package.json (vd 0.1.4 → 0.2.0 / 1.0.0)
```

## 2. Publish GitHub Packages (chính thức — tên @wakii-dev/ui-kit, hiện trên repo)

```bash
GH_PACKAGES_TOKEN=ghp_xxx pnpm --filter "@wakii-dev/ui-kit" publish --no-git-checks
```

## 3. Publish npmjs.org (public — tên @wakii/ui-kit)

```bash
NPM_TOKEN=npm_xxx ./scripts/publish-npm.sh    # tự build + đổi scope + publish
```

## 4. Deploy Storybook mới lên Vercel

```bash
pnpm build-storybook
cd storybook-static && vercel deploy --prod --team vuhois-projects && cd ..
```

## 5. Chốt

```bash
git add -A && git commit -m "release: <version>" && git push   # PR → merge main
```

## Bản đồ tên (đừng nhầm)

| Registry | Package | Ai cài |
|---|---|---|
| npmjs.org | `@wakii/ui-kit` | Mọi người — `npm i @wakii/ui-kit`, không cần auth |
| GitHub Packages | `@wakii-dev/ui-kit` | Org — `.npmrc` thêm `@wakii-dev:registry=https://npm.pkg.github.com` + token |

GitHub ép scope = owner (`wakii-dev`); npmjs theo org `wakii` — khác tên là chủ ý, cùng nội dung.
Vercel production URL: https://storybook-static-khaki-two.vercel.app
