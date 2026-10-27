---
name: wakii-ship-feature
description: Use khi ship một feature từ ý tưởng đến PR trên repo wakii — "làm feature này", "ship thay đổi", "tạo PR". Vòng đời có gate theo docs/WORKFLOW.md §2 (luồng feature) + §6 (multi-session). KHÔNG dùng khi publish package (skill wakii-publish), debug Kafka (skill wakii-debug-kafka), hay feature lớn cần chia story/epic (docs/wakii-playbook.md).
---

# wakii-ship-feature — feature → PR có gate

## Overview

Vòng đời chuẩn docs/WORKFLOW.md §2 viết lại dạng directive cho AI. Mỗi bước có gate — KHÔNG sang bước sau khi gate chưa PASS. Multi-session thì kết hợp §6 (worktree riêng mỗi mission).

## Directives

1. IF feature mơ hồ / chạm kiến trúc THEN trình 2–3 phương án + trade-off → CHỐT HƯỚNG với user trước khi code.
2. THEN recon code thật: đọc file/spec/convention liên quan — không phán đoán mù. Map việc→file: [docs/ai/knowledge.md](../../../docs/ai/knowledge.md).
3. THEN tách workspace: `git fetch origin && git worktree add /tmp/wt-<tên> -b wakii-dev/<loại>-<slug> origin/main` — slug match `^wakii-dev/(story|sf|fix|docs|chore|feat)-[a-z0-9][a-z0-9-]*$`.
4. IF đổi API/contract THEN contract-first TRƯỚC: `contracts/openapi/*.yaml` → `pnpm lint:contracts` PASS → codegen (`pnpm --filter node-svc generate:types`) → go snapshot bit-identical → mới code.
5. THEN code NHỎ, commit theo mảnh logic: `<type>(<scope>): <mô tả>`; `git add <path-cụ-thể>` — cấm `git add -A`.
6. IF xong THEN gate: `pnpm verify:quick --json` PASS (chỉ tin JSON + exit code — pipe nuốt exit code) + suite vùng đụng xanh; đụng BE/Kafka/compose → `bash scripts/smoke/e2e.sh`.
7. THEN PR: template `.github/pull_request_template.md` tự áp + checklist 5 dòng (docs/WORKFLOW.md §2) vào body → KHÔNG tự merge (coordinator merge `--no-ff`).
8. THEN nếu chạy team workflow: log `docs/team/TEAM.md` + report kèm bằng chứng verify thật → DỪNG.

## Bẫy thường gặp (chi tiết: docs/ai/knowledge.md)

| IF | THEN |
|---|---|
| verify qua `\| tail` | exit code là của `tail` — PASS ảo; dùng `--json` |
| branch slug có `.`/chữ hoa | pre-push chặn lúc push — `git branch -m` ngay |
| worktree chung có người chạy | KHÔNG checkout — dùng worktree riêng |
| `manager-head.html` dirty | badge tự sinh — KHÔNG commit |
