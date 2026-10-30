# Agents vs Skills vs Tools

```
AGENT  = NGƯỜI (actor) — "AI LÀM"
SKILL  = CẨM NANG (playbook) — "LÀM THẾ NÀO"
TOOL   = DỤNG CỤ (instrument) — "LÀM BẰNG GÌ"
```

| Agents (.claude/agents/) | Skills (.claude/skills/) | Tools (Claude Code built-in) |
|---|---|---|
| be-dev — Backend | add-service | Bash, Read/Write/Edit |
| fe-dev — Frontend | sync-contracts | /goal (agent loop) |
| service-dev — gen:service | use-ui-kit | /loop (scheduled) |
| ui-dev — UI kit | wakii-debug-kafka | /agent (switch agent) |
| forge — DevOps | wakii-publish | Agent tool (spawn) |
| mason — QA | wakii-ship-feature | Skill tool (load) |
| contracts-keeper | | |
| gate-keeper — Verify | | |
| e2e-runner — E2E | | |
| release-manager | | |

**Cách dùng:** Agent definitions (`.claude/agents/`) cho Claude Code biết AI là ai. Skills (`.claude/skills/`) dạy cách làm việc cụ thể. Tools là built-in commands.
