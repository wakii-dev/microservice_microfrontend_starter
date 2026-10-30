# MISSION: <tên ngắn>

## AGENTS/SKILLS (BẮT BUỘC — nạp TRƯỚC khi làm)
- Agent: `<tên>` (đọc .claude/agents/<tên>.md — định nghĩa métier + commands)
- Skill: `<tên>` (đọc .claude/skills/<tên>/SKILL.md — directives if-then)
<!-- Routing: docs/WORKFLOW.md §1 Agent routing table -->

## Worktree
`git fetch origin && git worktree add /tmp/wt-<tên> -b wakii-dev/<loại>-<slug> origin/main`

## Bối cảnh
<1-3 dòng: vì sao có mission này, liên kết report/PR trước nếu có>

## Việc
<scope rõ ràng từng mục, kèm tiêu chí hoàn thành>

## Ràng buộc
- Scope CHỈ <path-group>. CẤM đụng file ngoài scope.
- KHÔNG push, KHÔNG checkout worktree chung, KHÔNG tự mở terminal mới.
- Mọi output/comment ENGLISH 100%.

## Gate (exit codes thật, không `| tail`)
`<lệnh verify cụ thể theo brief>`

## Commit
`<loại>(<scope>): <mô tả>`. KHÔNG push.

## Báo cáo rồi DỪNG
`/tmp/worker-<tên>-report.md` (bằng chứng lệnh thật + exit codes). RỒI DỪNG.
