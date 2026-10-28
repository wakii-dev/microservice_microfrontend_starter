# WORKFLOW — luồng làm việc trên wakii

Contract workflow cho **AI làm việc trên repo này** (người đọc theo được cùng luồng).
Style: directive if-then, ngắn, parse được. Vòng AI chi tiết: [docs/ai/workflow.md](ai/workflow.md) ·
quy tắc vận hành agent: [AGENTS.md](../AGENTS.md) · gotchas: [docs/ai/knowledge.md](ai/knowledge.md).

## 0. Chọn luồng

| if việc của bạn là… | thì dùng | đọc thêm |
|---|---|---|
| feature lớn, tách được nhiều lane song song | §1 Team Workflow | [wakii-playbook.md](wakii-playbook.md) |
| feature nhỏ/vừa, 1 session tự làm | §2 feature | [ai/workflow.md](ai/workflow.md) |
| bug | §3 bug | [ai/knowledge.md](ai/knowledge.md) |
| đổi API/contract | §2 + contract-first | skill `sync-contracts` · [conventions/04](../platform/conventions/04-error-envelope.md) |
| publish package npm | §4 publish | [app/ui-kit/RELEASE.md](../app/ui-kit/RELEASE.md) |
| >3 sub-feature hoặc >10 tasks | §5 story/epic | [wakii-playbook.md](wakii-playbook.md) |
| ≥2 AI/người cùng repo | §6 multi-session | [AGENTS.md §3](../AGENTS.md) |
| AI worker nhận mission từ lead | §1 + [ai/workflow.md](ai/workflow.md) | [CLAUDE.md — Team protocol](../CLAUDE.md) |

Rules ngang mọi luồng:

- if tạo nhánh → `git fetch origin && git checkout -b wakii-dev/<loại>-<slug> origin/main` · slug `[a-z0-9-]*` (không chấm, không hoa).
- if commit → `<type>(<scope>): <mô tả>` · type ∈ `feat|fix|refactor|docs|test|chore|style|perf|build|ci|revert` (khớp AGENTS.md §1).
- if đưa vào `main` → qua PR, không push thẳng.
- if báo PASS → đã chạy lệnh thật + kiểm exit code (không tin `cmd | tail` — nuốt exit-code).

## 1. Team Workflow — coordinator + worker lanes

- if feature tách được thành nhiều mission không chồng lấn file → dùng mô hình này. Việc nhỏ một session làm xong luôn → §2/§3, đừng đội team.
- COORDINATOR (×1): chia mission theo path-group → viết brief → dispatch → **gate độc lập** → commit/PR/merge → publish → log board. KHÔNG tự làm implementation (trừ fix ≤ vài dòng giữa gate, và việc chỉ coordinator làm: git/PR/merge/publish, browser verify).
- WORKER (×N terminal lane, mỗi lane một métier: ui-kit/hooks · docs/stories · remotes/compose…): làm đúng scope brief trong **worktree riêng** → verify theo brief → report → DỪNG. KHÔNG tự push · KHÔNG đụng file ngoài scope · KHÔNG checkout worktree chung.

Vòng đời mission:

```
coordinator : recon code thật -> chia path-group -> brief /tmp/worker-brief-<tên>.md (scope file + gate verify)
            -> dispatch terminal (mỗi lane 1 worktree riêng, nhánh wakii-dev/*)
worker      : làm theo brief -> verify theo brief -> report /tmp/worker-*-report.md (kèm bằng chứng lệnh thật) -> DỪNG
coordinator : gate độc lập trên diff thật (verify:quick + tests + build; + browser light/dark nếu đụng UI)
            -> pass ? ship : brief fix gửi lại lane
ship        : commit path-group (git add <path cụ thể>, không -A) -> PR -> merge -> log docs/team/TEAM.md
            -> ACK + dispatch mission kế NGAY (lane không idle khi còn backlog)
```

Rules:

1. if lane report xong → coordinator gate + ACK + giao việc kế trong cùng chu kỳ; if backlog rỗng → tự lấy từ stories ghi nhận/docs nợ.
2. if worker thấy việc ngoài brief → KHÔNG làm; ghi vào report.
3. if mission ACK xong → ĐÓNG session worker (TUI treo = nguồn rogue terminal tự mở terminal + push PR ngoài điều phối).
4. if coordinator còn lane chưa report → KHÔNG kết thúc phiên; poll định kỳ, xen kẽ việc gate/log.
5. if cần bảng tiến độ 1 lệnh → `bash scripts/team/lanes-status.sh` (terminals + reports + branch chưa merge + PR open + demo stack).
6. if cần theo dõi nền → `bash scripts/team/lane-watchdog.sh &` (quét 60s → notification macOS + `/tmp/lane-watchdog.log`; đọc log đầu mỗi vòng poll).
7. if trao đổi peer-to-peer → `docs/team/inbox/<tên>.md` (`[HH:MM] @<bạn> → nội dung`) · broadcast → `docs/team/CHANNEL.md`.
8. if xong mission → log [docs/team/TEAM.md](team/TEAM.md) — PO đọc board là thấy nhịp team.

## 2. Luồng feature

```
yêu cầu -> phân tích/đề xuất hướng (if lớn/mơ hồ/chạm kiến trúc -> chốt hướng với user TRƯỚC khi code)
        -> recon code thật (đọc file/spec/convention — không phán đoán mù)
        -> nhánh mới từ origin/main mới nhất
        -> làm nhỏ, commit theo mảnh logic
        -> pnpm verify:quick + tests đầy đủ vùng đụng
        -> PR (checklist: .github/pull_request_template.md) -> review -> merge
        -> if đụng BE/Kafka/compose -> bash scripts/smoke/e2e.sh
```

Contract-first (if đổi API/DDL/event):

- if đổi API → sửa `contracts/openapi/*.yaml` TRƯỚC → `pnpm lint:contracts` pass → `pnpm --filter node-svc generate:types` → sync snapshot go-svc (`internal/api/openapi/` bit-identical) → mới impl. Skill: `sync-contracts`.
- if đụng Kafka → topic tồn tại TRƯỚC khi service boot (`kafka-init` compose one-shot + `EnsureTopics` go-svc — [ADR-0008](adr/0008-kafka-outbox-saga.md)).
- if test saga/DLQ → `bash scripts/smoke/e2e.sh`, không test tay lẻ.

PR checklist 5 dòng (đầy đủ ở template): typecheck pass · tests pass (ghi số) · `verify:quick` PASS (paste output) · nội dung đúng scope path-group · convention liên quan đã đọc.

## 3. Luồng bug

```
report -> reproduce (bằng chứng thật: lệnh/log/screenshot — không fix theo mô tả suông)
       -> root cause (đọc code+log, đặt giả thuyết, KIỂM CHỨNG — không đoán-patch)
       -> fix nhỏ nhất + regression test (test fail trước fix, pass sau fix)
       -> pnpm verify:quick + tests vùng đụng
       -> PR fix(<scope>): body ghi ROOT CAUSE + evidence (bắt buộc) -> merge
       -> verify lại trên đường user đi (main/demo)
```

- if bẫy có thể đã biết (registry chậm, Kafka topic race, react-query singleton, pipe nuốt exit-code…) → tra [ai/knowledge.md](ai/knowledge.md) trước khi điều tra lại từ đầu.

## 4. Luồng publish npm

> **LƯU Ý TRƯỚC KHI ĐỌC (R5 onboarding 2026-10-28):** publish là việc của **REPO UPSTREAM** — repo thật
> chứa `app/ui-kit/` + `app/<pkg>/scripts/publish-npm.sh` + `RELEASE.md`. Project sinh ra bởi
> `create-wakii-stack` **KHÔNG chứa package nào publishable** (mọi `package.json` đều `private:true`,
> không có `app/ui-kit`) → **bỏ qua mục này** trừ khi bạn fork về đúng upstream flow. Ai duy trì upstream:
> làm theo flow dưới đây.

Áp dụng `@wakii/ui-kit` · `create-wakii-app` · `create-wakii-stack` — mỗi package có `app/<pkg>/scripts/publish-npm.sh`; ui-kit có checklist đầy đủ ở [RELEASE.md](../app/ui-kit/RELEASE.md). Đường CHÍNH THỨC (2026-10-29): CI workflow `.github/workflows/publish-packages.yml` (Actions → Run workflow; inputs `package` + `version_type`; gate→bump→publish→verify; cần secret `NPM_TOKEN`). Publish tay bằng script chỉ để DEBUG — script tự chặn khi tree dirty / HEAD lệch origin/main (`--force-local` để vượt có chủ đích).

```
code merged main + tests xanh -> git fetch + pull (publish CHỈ từ main mới nhất)
     -> bump version + CHANGELOG
     -> npm pack tự kiểm tarball (files đủ: css/tokens/assets/template — pack --dry-run từng bắt bug mất CSS)
     -> bash app/<pkg>/scripts/publish-npm.sh (tự build + guard + npm publish --access public)
     -> CHỜ registry lan 2-5 phút
     -> npm view <pkg> versions + dist-tags (verify từ registry, không tin cache local)
     -> log TEAM.md + báo user kết quả thật
```

- if vừa publish thấy bản cũ/404 → ĐỪNG publish lại; đợi 2–5 phút rồi `npm view` (knowledge.md #1).
- if publish cần token/auth/duyệt → dừng đúng điểm đó, trình user — không tự vượt gate quyền.

## 5. Luồng story/epic (Linear)

- if việc >3 sub-feature hoặc >10 tasks, hoặc 2 việc phụ thuộc tier (một cái unblock hẳn cái kia) → story mode:

```
feature lớn -> epic Linear + mindmap .wakii (docs/superpowers/mindmaps/<slug>.wakii)
            -> chia SF theo archetype (wakii-playbook.md — slice sai = chi phí lớn nhất)
            -> SF = sub-issue Linear -> dựng DAG deps
            -> dispatch SF theo tier: mỗi SF chạy đúng vòng §1/§2 (độc lập -> lane song song)
            -> gate từng SF -> merge từng PR -> epic done khi mọi SF merged + smoke xanh
```

## 6. Luồng multi-session (nhiều AI/người song song)

```
bắt đầu MỌI việc: git fetch origin
  -> gh pr list --state merged --limit 5 (đọc PR vừa merge)
  -> đọc file cần sửa trên origin/main (if hướng đã đổi bởi session khác -> theo bản user duyệt mới nhất)
  -> git worktree add /tmp/wt-<tên> -b wakii-dev/<loại>-<slug> origin/main
  -> làm trong worktree đó (KHÔNG checkout worktree chung — mất file WIP của lane khác)
  -> PR nhỏ theo path-group (1 PR = 1 nhóm file không chồng lấn lane khác)
  -> xong: đóng session (không để TUI treo)
```

- if điều phối qua Orca terminal → dùng `orca-cli` (worktree/terminal/artifact) — không raw `git worktree` khi Orca đang quản.

## Output contract (áp dụng mọi script/docs mới viết cho repo)

- Script cho AI phải có `--json`: JSON là contract chính (text là default xem nhanh). Exit code luôn THẬT.
- Script dạng generator (`gen:*`) xuất `{created: [...files], modified: [...], next_steps: [...]}` — `next_steps` là directive AI thực hiện được (đường dẫn + hành động), không phải hướng dẫn người đọc.
- Docs viết directive if-then; không văn xuôi trang trí, không sơ đồ chỉ để ngắm.

---

*Vòng AI từng bước + bảng "việc thường gặp → lệnh": [docs/ai/workflow.md](ai/workflow.md) · nhánh/merge chi tiết: [docs/git-flow.md](git-flow.md) · bản đồ repo: [CLAUDE.md](../CLAUDE.md).*
