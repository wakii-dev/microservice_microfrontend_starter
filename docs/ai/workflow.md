# AI workflow — vòng đời một việc

Chi tiết hoá [docs/WORKFLOW.md](../WORKFLOW.md) cho AI executor: nếu bạn là AI (Claude/Codex/
worker lane) nhận một việc — đi đúng vòng dưới đây, không bỏ bước verify. Style: if-then,
lệnh chạy được, output parse được.

## Vòng AI chuẩn

```
1. recon      : đọc code/spec thật ở vùng sẽ sửa (grep + Read) — KHÔNG phán đoán từ tên file
2. if đổi API : contract-first (mục dưới) — TRƯỚC khi impl
3. nhánh      : git fetch origin && git checkout -b wakii-dev/<loại>-<slug> origin/main
4. làm NHỎ    : một mảnh logic một commit; if thấy việc ngoài scope -> ghi vào report, KHÔNG làm
5. verify:quick: pnpm verify:quick  (theo phạm vi diff; --json để parse: [{step,status,duration}])
6. tests      : chạy đủ suite vùng đụng — lệnh theo bảng ở cuối file này
7. PR         : conventional commit + branch slug đúng + checklist .github/pull_request_template.md
8. if đụng BE/Kafka/compose : bash scripts/smoke/e2e.sh (15 bước: happy + auth + saga + DLQ)
```

Rules:

- if báo PASS → đã chạy lệnh thật, đã nhìn exit code. KHÔNG tin `cmd | tail` — `$?` là của `tail`
  (3 lần trả giá thật: typecheck tưởng PASS → conflict marker lọt main → #133). Công thức an toàn:
  `pnpm --filter <pkg> typecheck 2>&1 | grep -c 'error TS'` (số 0 = pass) hoặc chạy không pipe.
- if verify:quick FAIL → đọc 30 dòng cuối log (script in sẵn ở stderr), fix, chạy lại. KHÔNG commit lên cây đỏ.
- if dùng worktree chung → check `git status` từng file TRƯỚC khi đụng; WIP người khác không đụng, không commit (`git add <path cụ thể>`, không `git add -A`).
- if đổi behavior đáng kể theo story workflow → chụp evidence vào `docs/superpowers/evidence/`.

## Contract-first (if đổi API/DDL/event)

```
sửa contracts/openapi/*.yaml (hoặc db/*.sql, events/*) TRƯỚC
  -> pnpm lint:contracts                    (spectral — phải pass)
  -> pnpm --filter node-svc generate:types  (từ tasks.yaml)
  -> sync snapshot go-svc: internal/api/openapi/ bit-identical (CI drift-guard)
  -> if event đổi payload -> fixtures golden contracts/events/ cập nhật 2 đầu
  -> SAU ĐÓ mới impl theo spec
```

## Gate Kafka (if đụng Kafka/outbox/saga/DLQ)

- if service consume/produce → topic phải tồn tại TRƯỚC khi boot: `kafka-init` (compose one-shot)
  + `EnsureTopics` go-svc — [ADR-0008](../adr/0008-kafka-outbox-saga.md), [conventions/09](../../platform/conventions/09-async-messaging.md).
- if test saga/DLQ → `bash scripts/smoke/e2e.sh` — không test tay lẻ, không tin log một chiều.
- if boot compose → chạy theo `run.compose` trong [orca.yaml](../../orca.yaml) (thứ tự: tạo topic TRƯỚC khi boot services).

## Checklist PR (5 dòng — paste vào PR body)

```
[ ] typecheck pass            — pnpm --filter <pkg> typecheck
[ ] tests pass                — suite vùng đụng, GHI SỐ test vào PR
[ ] pnpm verify:quick PASS    — paste output (text SUMMARY hoặc --json)
[ ] nội dung đúng scope       — path-group khai trong PR, không drive-by edit
[ ] convention liên quan đọc  — platform/conventions/01-09 nếu đụng service
```

Template đầy đủ tự áp khi `gh pr create`: `.github/pull_request_template.md`.

## Việc thường gặp → lệnh

| Việc | Lệnh/skill |
|---|---|
| Thêm service mới vào `services/` | skill `add-service` (`.claude/skills/`) — thủ tục 4 SF + lệnh verify |
| Thêm FE remote | playbook FE archetype trong [docs/wakii-playbook.md](../wakii-playbook.md) |
| Đổi port | sửa 4 chỗ CÙNG commit: `platform/conventions/05-ports.md` + `.env.example` + compose + README |
| Đổi API/contract | skill `sync-contracts` — flow contract-first ở trên |
| Story/epic mới | skill `story-workflow` + [docs/wakii-playbook.md](../wakii-playbook.md) (chọn archetype chia SF) |
| Publish package npm | `bash app/<pkg>/scripts/publish-npm.sh` — luồng đầy đủ WORKFLOW.md §4; ui-kit: [app/ui-kit/RELEASE.md](../../app/ui-kit/RELEASE.md) |
| Scaffold project mới | `bash scripts/scaffold/scaffold.sh <tên-mới>` |
| Chạy demo full stack | `run.compose` trong [orca.yaml](../../orca.yaml) → login `alice@demo.local` / `demo-password` |
| Verify nhanh theo diff | `pnpm verify:quick` (text) · `pnpm verify:quick --json` (contract: `[{step,status,duration}]` + exit code) |
| Xem nhịp team lanes | `bash scripts/team/lanes-status.sh` · nền: `bash scripts/team/lane-watchdog.sh &` |

## Output contract cho script/docs AI

- Script mới phải có `--json` — JSON là contract chính; text là default. Exit code THẬT, không nuốt qua pipe.
- Script generator (`gen:*`) xuất `{created: [...files], modified: [...], next_steps: [...]}` —
  `next_steps` = directive AI chạy được tiếp (đường dẫn + hành động), ví dụ:
  `"next_steps": ["sửa services/foo-svc/src/config.ts — đọc PORT từ env", "thêm healthcheck vào Dockerfile theo conventions/02"]`.
- Docs viết if-then; sơ đồ dạng arrow-flow 1 khối text; không ASCII trang trí.
