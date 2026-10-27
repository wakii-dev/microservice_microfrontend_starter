---
name: wakii-ship-feature
description: Use when shipping a feature from idea to PR on the wakii repo — "build this feature", "ship this change", "open a PR". Gated lifecycle per docs/WORKFLOW.md §2 (feature flow) + §6 (multi-session). Do NOT use for package publishing (skill wakii-publish), Kafka debugging (skill wakii-debug-kafka), or large features needing story/epic splits (docs/wakii-playbook.md).
---

# wakii-ship-feature — feature → gated PR

## Overview

The standard docs/WORKFLOW.md §2 lifecycle rewritten as directives for AI. Every step has a gate — do NOT move to the next step before the gate passes. For multi-session, combine with §6 (one worktree per mission).

## Directives

1. IF the feature is vague / touches architecture THEN present 2–3 options + trade-offs → LOCK THE DIRECTION with the user before coding.
2. THEN recon the real code: read the relevant files/specs/conventions — never guess. Task→file map: [docs/ai/knowledge.md](../../../docs/ai/knowledge.md).
3. THEN isolate the workspace: `git fetch origin && git worktree add /tmp/wt-<name> -b wakii-dev/<type>-<slug> origin/main` — slug must match `^wakii-dev/(story|sf|fix|docs|chore|feat)-[a-z0-9][a-z0-9-]*$`.
4. IF changing an API/contract THEN contract-first FIRST: `contracts/openapi/*.yaml` → `pnpm lint:contracts` PASS → codegen (`pnpm --filter node-svc generate:types`) → go snapshot bit-identical → only then code.
5. THEN code SMALL, commit in logical slices: `<type>(<scope>): <description>`; `git add <explicit-path>` — `git add -A` forbidden.
6. IF done THEN gate: `pnpm verify:quick --json` PASS (trust only JSON + exit code — pipes swallow exit codes) + the touched area's suite green; BE/Kafka/compose touched → `bash scripts/smoke/e2e.sh`.
7. THEN PR: the `.github/pull_request_template.md` applies automatically + paste the 5-line checklist (docs/WORKFLOW.md §2) into the body → do NOT self-merge (the coordinator merges `--no-ff`).
8. THEN if running the team workflow: log `docs/team/TEAM.md` + report with real verify evidence → STOP.

## Common traps (details: docs/ai/knowledge.md)

| IF | THEN |
|---|---|
| verifying through `\| tail` | the exit code belongs to `tail` — phantom PASS; use `--json` |
| branch slug has `.`/uppercase | pre-push rejects at push — `git branch -m` immediately |
| shared worktree has someone running on it | do NOT checkout — use your own worktree |
| `manager-head.html` dirty | auto-generated badge — do NOT commit |
