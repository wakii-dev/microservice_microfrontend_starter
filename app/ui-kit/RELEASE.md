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

## 2. Publish GitHub Packages (chính thức — tên @wakii/ui-kit, hiện trên repo)

```bash
GH_PACKAGES_TOKEN=ghp_xxx pnpm --filter "@wakii/ui-kit" publish --no-git-checks
```

## 3. Publish npmjs.org (public — tên @wakii/ui-kit)

```bash
./scripts/publish-npm.sh
# 2026-10-24: token wakii đã lưu trong ~/.npmrc (user duyệt) — chạy thẳng
# không cần env. NPM_TOKEN=npm_xxx vẫn ưu tiên nếu có.
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

## 6. Publish npmjs qua CI (GitHub Action — nhánh `release/ui-kit`)

Workflow `.github/workflows/publish-uikit.yml` tự publish khi push vào nhánh
`release/ui-kit` (hoặc chạy tay qua tab Actions → Run workflow). Điều kiện:

1. Repo bật GitHub Actions (2026-10-24 đang DISABLE vì billing — xem CLAUDE.md mục CI).
2. Secret `NPM_TOKEN` (bảng token ở đầu file này) set trong Settings → Secrets
   and variables → Actions.
3. Bump version trong `app/ui-kit/package.json` + thêm mục CHANGELOG.md, rồi
   push/merge vào `release/ui-kit`.

CI tự làm: install workspace → gate test + typecheck + build → gọi
`scripts/publish-npm.sh` với `NPM_TOKEN` từ secret → tag `v<version>` +
GitHub release với notes trích từ CHANGELOG.md (tag đã tồn tại = bỏ qua,
chạy lại an toàn).

## Bản đồ tên (đừng nhầm)

| Registry | Package | Ai cài |
|---|---|---|
| npmjs.org | `@wakii/ui-kit` | Mọi người — `npm i @wakii/ui-kit`, không cần auth |
| GitHub Packages | `@wakii/ui-kit` | Org — `.npmrc` thêm `@wakii-dev:registry=https://npm.pkg.github.com` + token |

GitHub ép scope = owner (`wakii-dev`); npmjs theo org `wakii` — khác tên là chủ ý, cùng nội dung.
Vercel production URL: https://storybook-static-khaki-two.vercel.app
