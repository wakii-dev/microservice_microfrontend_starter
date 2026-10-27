# Git flow — architecture-overview

Quy ước nhánh + merge cho repo boilerplate. Mục tiêu: `main` luôn xanh CI + deployable,
mọi thay đổi đi qua PR để có evidence + review trail (CI chạy trên PR trước khi vào main).

## Nhánh

| Loại | Tên | Từ | Vào |
|---|---|---|---|
| Story (epic/SF) | `wakii-dev/story-<slug>` hoặc `wakii-dev/sf-N-<slug>` | `main` | PR → `main` |
| Fix | `wakii-dev/fix-<slug>` | `main` | PR → `main` |
| Docs/chore nhỏ | `wakii-dev/docs-<slug>` / `wakii-dev/chore-<slug>` | `main` | PR → `main` |

Quy tắc:

1. **Nhánh mới luôn từ `main` mới nhất** (`git fetch origin && git checkout -b <tên> origin/main`) — tránh mâu thuẫn với các merge đang lơ lửng.
2. **Không push thẳng `main`.** Từ 2026-10-17: thay đổi vào main qua PR (CI gates chạy trên PR). Ngoại lệ thực tế khẩn (CI infra chết) — merge trực tiếp + nêu rõ trong commit message.
3. **Một nhánh = một chủ đề.** Rename/chore lớn (vd `frontend/ → app/`) là commit riêng, không trộn với feature.
4. Worktree song song (Orca/Claude sessions): mỗi session một nhánh riêng; **đọc `git log` nhánh TRƯỚC khi commit** — branch có thể đã được session khác đẩy tiến.

## PR

- Mở bằng `gh pr create` — template tự áp dụng (`.github/pull_request_template.md`).
- **CI phải xanh trên PR trước merge** (convergence chạy mọi push; các workflow khác theo paths).
- **Merge = `--no-ff`**, message theo convention: `merge(<loại>): <tóm tắt>` + ghi rõ nguồn
  (vd `merge(feat): ui-kit — tách design system + Storybook 9 (ADR-0009)`).
- Sau merge: xoá nhánh remote (`git push origin --delete <nhánh>`) + local khi không còn dùng.
- Self-merge cho phép với docs/chore nhỏ; feature/fix đụng runtime cần ≥1 approve (reviewer
  là agent `code-reviewer` hoặc người).

## Commit message

- Convention: `<type>(<scope>): <mô tả>` — type: `feat|fix|refactor|docs|test|chore|merge`.
- Body ghi **root cause + evidence** khi là fix (mẫu: `fix(ci): convergence...` — nêu run ID,
  local repro); ghi **verified gì** khi là refactor/feat (số test, build PASS).
- Đổi behavior + story workflow → chụp evidence vào `docs/superpowers/evidence/`.

## Rule được ENFORCE (husky pre-push + commit-msg)

⚠️ 2026-10-17: GitHub Actions DISABLE (billing) → **hooks là lớp chính**. `.husky/pre-push`
chặn push vi phạm 2 rule sau + chạy FE checks (typecheck/vitest/build) cho package bị đổi:

1. **Branch name**: `wakii-dev/<story|sf|fix|docs|chore|feat>-<slug-kebab>`
   (vd `wakii-dev/fix-gosvc-recent-events`, `wakii-dev/sf-5-ui-redesign-conv`)
2. **Commit message**: `<type>(<scope>): <mô tả>` với type ∈
   `feat|fix|refactor|docs|test|chore|style|perf|build|ci|revert`
   (merge commits "Merge pull request #N" được ngoại lệ)

pre-push CHẠY THÊM FE checks (typecheck/vitest/build-storybook) cho package có file đổi
(so với origin/main) — thay thế lớp CI shell/remotes/ui-kit đã tắt.

Feedback sớm ngay tại máy — **husky** tự cài khi `pnpm install` (root `prepare` script
chạy `husky`, guard `test -d .git` để không chết trong docker/CI không có .git):

- `.husky/commit-msg` — validate conventional commit TRƯỚC khi commit tạo (mirror
  git-guard; merge commits được ngoại lệ; thoát khẩn `git commit --no-verify` — CI vẫn chặn)
- CI `git-guard` vẫn là lớp enforce cuối cùng (hook chỉ là feedback sớm, ai tắt hook
  cũng không qua nổi PR)

Worktree (Orca/Claude session): `pnpm install` trong worktree cũng chạy root `prepare`
→ husky tự active theo worktree đó. Bỏ qua khẩn: `git push --no-verify` (tự chịu trách
nhiệm — KHÔNG có lớp CI phía sau cho đến khi billing được khôi phục).

## Checklist nhanh trước merge

- [ ] Suite local xanh (xem bảng lệnh trong CLAUDE.md — `test_all:` của orca.yaml)
- [ ] CI xanh trên nhánh/PR (kể cả `convergence`)
- [ ] Không đụng READ-LOCKED (`app/shared/src/*.ts` logic + `mfToolkit`) nếu chưa có epic duyệt
- [ ] Đụng contract → sync đủ bề mặt (xem agent `contracts-keeper`)
- [ ] Descriptor đồng bộ (CLAUDE.md / orca.yaml / agents) nếu đổi cấu trúc, port, lệnh

## Luồng AI-team (coordinator + worker lanes — mô hình docs/WORKFLOW.md §1)

Khác với luồng nhánh thường ở trên, khi chạy theo mô hình team AI (1 coordinator + N worker
lanes song song):

1. **Mỗi lane một nhánh riêng** `wakii-dev/<loại>-<slug>` cắt từ `origin/main` mới nhất, làm
   trong worktree riêng — không 2 lane chung nhánh/worktree.
2. **PR NHỎ theo path-group**: 1 PR = 1 nhóm file không chồng lấn với lane khác. PR đụng file
   lane khác sở hữu → dừng, phối qua `docs/team/inbox/`, không tự sửa.
3. **Merge SQUASH cho PR lane** (`gh pr merge --squash`): mission nhỏ nhiều PR → giữ main
   tuyến tính 1 commit/PR. (Luồng nhánh thường — feature/fix lớn — vẫn merge `--no-ff` như
   mục PR ở trên.)
4. **Commit trong lane**: chỉ file lane sở hữu (`git add <path cụ thể>`); message conventional
   như thường — squash giữ lại tiêu đề PR làm commit message, nên đặt tiêu đề PR đúng
   `<type>(<scope>): <mô tả>`.
5. **Gate trước PR là của coordinator** (độc lập trên diff thật: `pnpm verify:quick` + tests +
   build + browser khi đụng UI) — report của worker là đầu vào, không phải kết luận.

## Versioning & release (package npm)

Áp dụng `@wakii/ui-kit` · `create-wakii-app` · `create-wakii-stack` (semver):

| Quy tắc | Chi tiết |
|---|---|
| Bump + CHANGELOG cùng PR | tăng `version` + thêm mục `CHANGELOG.md` trong cùng PR chứa thay đổi — không bump tay lẻ |
| BREAKING → major | đổi exports/barrel/entry (vd gỡ component khỏi barrel) = major + ghi migration trong CHANGELOG |
| Publish chỉ từ `main` mới nhất | `git fetch` + pull TRƯỚC khi publish; cắt nhánh stale để publish = đè version người khác (bài học rogue publish 0.6.3/0.6.4) |
| Lockstep — 1 luồng publish tại 1 thời điểm | coordinator sở hữu publish; version xung đột → dồn về 1 bản chuẩn, không double-publish |
| Sau publish: chờ + verify registry | registry lan 2–5 phút → `npm view <pkg> versions` / `dist-tags` / `npx` thử (knowledge.md #1) — đừng publish lại vì tưởng 404 |
| Checklist chi tiết | ui-kit: `app/ui-kit/RELEASE.md` (2 registry, token, dry-run `npm pack` bắt bug tarball) · create-*: `scripts/publish-npm.sh` (tự build + guard file sống còn) |
