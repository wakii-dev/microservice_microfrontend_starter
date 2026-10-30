# Orca Cheat Sheet (cho AI agents trong scaffolded project)

## Identity
```bash
echo $ORCA_AGENT_PANE    # pane UUID (nếu chạy trong Orca)
echo $ORCA_WORKTREE_ID   # worktree hiện tại
```

## Hire worker (1 lệnh)
```bash
orca orchestration worker-start \
  --task <task_id> \
  --worktree new-top-level \
  --agent claude \
  --name <prefix>-<slug> \
  --repo id:<repoId> \
  --run <run_id> --json
```

## Task lifecycle
```bash
RUN=$(orca orchestration run-create --objective "<mô tả>" --json | jq -r '.result.run.id')
TASK=$(orca orchestration task-create --task-title "<title>" --spec "<spec>" --run "$RUN" --json | jq -r '.result.task.id')
orca orchestration task-update --id "$TASK" --status ready --json
# → worker-start
# → khi xong:
orca orchestration task-update --id "$TASK" --status completed --json
```

## Wake/Wait
```bash
orca orchestration check --run <RUN> --wait --types worker_done,escalation,question --timeout-ms 480000 --json
```

## Gates
```bash
GATE=$(orca orchestration gate-create --task <TASK_ID> --question "<q>" --options '["approved","changes_requested"]' --json | jq -r '.result.gate.id')
orca orchestration gate-resolve --id "$GATE" --resolution approved --json
```

## Worktree
```bash
orca worktree create --repo id:<repoId> --name <slug> --no-parent --agent claude --prompt "<brief>" --json
orca worktree remove --worktree <id> --force --json  # SAU MERGE
```

## Terminal
```bash
orca terminal read --terminal <handle> --limit 100 --json  # .result.terminal.tail[]
orca terminal close --terminal <handle> --json
```

## Linear
```bash
orca linear create --title "<title>" --team <team> --project <project> --json
orca linear status set <issue> --to "In Progress" --json
orca linear comment add <issue> --body "<audit>" --json
orca linear status set <issue> --to "Done" --json
```
