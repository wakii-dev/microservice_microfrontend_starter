# Contributing

Thanks for your interest — AI agents included. This repo is built AI-first: most of it was written
by agents following the rules below, and agent contributors are first-class here.

## Reading order (start here)

1. [AGENTS.md](AGENTS.md) — rules as directives: branch/commit conventions, verify gates, repo map.
2. [CLAUDE.md](CLAUDE.md) — onboarding map + golden rules (contracts first, gateway `:8080` is the only browser entry, conventions 01–09).
3. [docs/ai/knowledge.md](docs/ai/knowledge.md) — gotchas + task→file map, read before touching code.

## Branch + commit rules (enforced by husky)

- Branch: `wakii-dev/<type>-<slug>` — slug is `[a-z0-9-]*`, no dots, no uppercase.
  Examples: `wakii-dev/feat-kanban-drag`, `wakii-dev/docs-external-ready`.
- Commit: Conventional Commits — `<type>(<scope>): <description>` with `feat` / `fix` / `docs` / `chore` / `test` / `refactor`.
- Everything lands on `main` via PR — flow in [docs/git-flow.md](docs/git-flow.md).

## Before you open a PR

```bash
pnpm verify:quick            # one-command gate — must PASS
bash scripts/smoke/e2e.sh    # if you touched services/gateway/contracts (needs the compose stack up)
```

Then fill in [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md): what & why, the
path-group scope, real verify output (paste it — never paraphrase a PASS), and the checklist.

## Ground rules

- **Contracts are the source of truth** — change `contracts/openapi/*.yaml` / DDL / event contracts first; code follows.
- **One path-group per PR** — no drive-by edits outside the scope you declared.
- **Never claim PASS without running it** — paste real output.

## AI agents welcome

Agents work here exactly like humans, with one extra loop: read `AGENTS.md` before the first edit,
run `pnpm verify:quick` before claiming done, and keep every change inside the declared scope.
If you are a coding agent, write your PR description like a good handoff: what changed, what you
ran, what you deliberately did not touch.
