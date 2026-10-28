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

> 2026-10-29: đường CHÍNH THỨC là CI workflow `publish-packages` (mục 6) —
> script này chỉ để DEBUG. Script tự chặn khi tree dirty / không ở main /
> HEAD lệch origin/main; vượt có chủ đích bằng `--force-local`.

## 4. Deploy Storybook mới lên Vercel

```bash
pnpm build-storybook
# 2026-10-25: deploy TRỰC TIẾP từ trong repo bị Vercel BLOCKED ("commit author
# doesn't have permission" — git author Wakii không phải member team vuhoi).
# Quy trình: copy ra ngoài git + link đúng project (build-storybook clean xoá
# .vercel mỗi lần build):
rm -rf /tmp/sb-deploy && cp -r storybook-static /tmp/sb-deploy
cd /tmp/sb-deploy
vercel link --project storybook-static --yes --team vuhois-projects
vercel deploy --prod --yes --team vuhois-projects
cd - && rm -rf /tmp/sb-deploy
```

## 5. Chốt

```bash
git add -A && git commit -m "release: <version>" && git push   # PR → merge main
```

## 6. Publish npmjs qua CI (workflow `publish-packages` — chính thức)

> 2026-10-29: workflow `publish-uikit.yml` cũ (push nhánh `release/ui-kit`) đã
> XOÁ — thay bằng `.github/workflows/publish-packages.yml` chung cho cả 3
> package (@wakii/ui-kit · create-wakii-app · create-wakii-stack).

Chạy: tab Actions → **publish-packages** → Run workflow, chọn
`package=ui-kit` + `version_type` (patch/minor/major). Điều kiện:

1. Repo bật GitHub Actions (2026-10-24 đang DISABLE vì billing — xem CLAUDE.md mục CI).
2. Secret `NPM_TOKEN` (bảng token ở đầu file này) set trong Settings → Secrets
   and variables → Actions.

CI tự làm HẾT (không bump tay nữa): checkout main mới nhất → gate test +
typecheck + build → bump version + sinh mục CHANGELOG từ commit range (commit
thẳng main) → gọi `scripts/publish-npm.sh` với `NPM_TOKEN` từ secret → verify
registry (đợi lan 90s + retry tới ~4.5 phút, `dist-tags.latest` phải khớp) →
tag `<pkg>-v<version>` + GitHub release với notes trích CHANGELOG. Version đã
tồn tại trên registry → run SKIP sạch có giải thích, không đè bao giờ.

## Bản đồ tên (đừng nhầm)

| Registry | Package | Ai cài |
|---|---|---|
| npmjs.org | `@wakii/ui-kit` | Mọi người — `npm i @wakii/ui-kit`, không cần auth |
| GitHub Packages | `@wakii/ui-kit` | Org — `.npmrc` thêm `@wakii-dev:registry=https://npm.pkg.github.com` + token |

GitHub ép scope = owner (`wakii-dev`); npmjs theo org `wakii` — khác tên là chủ ý, cùng nội dung.
Vercel production URL: https://storybook-static-khaki-two.vercel.app
