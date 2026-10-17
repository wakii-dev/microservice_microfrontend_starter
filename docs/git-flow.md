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

## Checklist nhanh trước merge

- [ ] Suite local xanh (xem bảng lệnh trong CLAUDE.md — `test_all:` của orca.yaml)
- [ ] CI xanh trên nhánh/PR (kể cả `convergence`)
- [ ] Không đụng READ-LOCKED (`app/shared/src/*.ts` logic + `mfToolkit`) nếu chưa có epic duyệt
- [ ] Đụng contract → sync đủ bề mặt (xem agent `contracts-keeper`)
- [ ] Descriptor đồng bộ (CLAUDE.md / orca.yaml / agents) nếu đổi cấu trúc, port, lệnh
