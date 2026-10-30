# Goal State (coordinator đọc ĐẦU MỌI turn)

## Đích hiện tại
<mô tả mục tiêu>

## Tasks đang chạy
| Task | Worker | Worktree | Files |
|---|---|---|---|
| <T1> | <agent> | <worktree> | <N> |

## Đã hoàn thành
- <task hoàn thành + commit hash>

## CHỜ-OWNER
1. <item chờ owner>

## Wake mechanism
Primary: `orca orchestration check --run <RUN> --wait --types worker_done,escalation,question --timeout-ms 480000`
