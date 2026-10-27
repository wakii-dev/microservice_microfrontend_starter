# Knowledge base — gotchas + where-is-what (for AI agents)

If-then directives. Every gotcha here is an incident that actually happened on this repo. IF you hit a symptom THEN follow the directive — do NOT re-investigate from scratch. One-line summary per trap: [AGENTS.md §6](../../AGENTS.md).

## Recipes (writing UI)

- IF writing UI THEN [recipes.md](recipes.md) (20 copy-paste recipes) + Part II of [AGENTS.md](../../AGENTS.md) (mandatory rules + anti-patterns).
- IF you need visual truth THEN `pnpm --filter ui-kit storybook` → http://localhost:6006.
- IF customizing a component THEN every component accepts `classNames` slots + `style` (see "Customize (from 0.7)" — Part II of AGENTS.md).

## Gotchas

### registry-propagation
- IF `npx`/`pnpm add` shows a stale version or 404 right after publish THEN the registry + CDN need 2–5 minutes to propagate → verify `npm view <pkg> versions` + dist-tags, wait. Do NOT re-publish thinking it failed.
- IF a missing file is discovered after publishing THEN never overwrite the same version (a taken version is taken forever) → fix + bump to a new version.

### kafka-topic-before-consumer
- IF the consumer group is `Stable` but with 0 fetch/0 commit and assignment/feed stays empty forever (NO crash) THEN the consumer joined before the topic auto-created → `docker compose down -v`; create topics `task-events` + `task-events.dlq` BEFORE booting (`kafka-init` compose one-shot + go-svc `EnsureTopics`).
- IF DLQ publish fails with "Unknown Topic" THEN same root cause — the `.dlq` topic must also exist first.

### pipe-swallows-exit-code
- IF verifying through `cmd | tail` / `| head` THEN `$?` belongs to the LAST command — phantom PASS → conclude PASS only from the real exit code (run without a pipe; `${pipestatus[1]}` zsh / `${PIPESTATUS[0]}` bash) or `pnpm verify:quick --json`.

### tarball-publish
- IF the publish script copies files by hand (`cp` by basename) THEN the tarball loses files (CSS tokens, docs/assets, the `+x` bit) — visible only to consumers, never in the repo → BEFORE every publish: `npm pack` + `tar -tzf` to inspect the contents; the publish script must keep its survival-file guard.

### port-conflict
- IF `EADDRINUSE`, or the browser shows a bizarre stale UI on a port THEN an old dev server is still hanging (a previous session died without cleanup) → `lsof -iTCP:<port> -sTCP:LISTEN` + kill the PID.
- IF the mission is done THEN shut down every server you started.

### docker-parallel-build
- IF 2 docker builds run in parallel on one engine THEN it overloads → hangs/crashes mid-build → build sequentially; IF the engine already crashed THEN restart Docker Desktop cleanly + `docker builder prune` + rebuild.

### branch-slug
- IF push is rejected with `branch … violates rule wakii-dev/…` THEN the slug breaks the regex `^wakii-dev/(story|sf|fix|docs|chore|feat)-[a-z0-9][a-z0-9-]*$` (contains `.`/`_`/uppercase) → `git branch -m <correct-name>` the moment you create the branch — do not wait for push to find out.

### manager-head-badge
- IF `app/ui-kit/.storybook/manager-head.html` turns dirty with nobody touching it THEN `scripts/stamp-build.cjs` rewrites the build badge (version + sha + time) on every `storybook dev`/`build` → do NOT commit this file; if it slipped into a commit, revert the badge part to its previous value.

### vitest-tz
- IF date/month boundary tests are red locally but green in CI (or vice versa) THEN the machine TZ shifts the day boundary → the TZ pin in `vitest.config.ts` (`test.env`) is mandatory, do NOT remove it; time tests inject `now`, never read the real clock.

### standalone-lockfile
- IF node-svc/auth-svc are installed from the workspace root THEN deps go missing / the service lockfile gets overwritten → `cd services/<svc> && pnpm install --frozen-lockfile --ignore-workspace` (run INSIDE the service directory).

### pgdata-volume
- IF boot lacks the saga-seed user / `auth_svc` role / `auth` schema THEN the old volume never got the new seeds (init scripts only run on a fresh volume) → `docker compose --env-file platform/.env down -v` once, then up again; add `AUTH_SVC_DB_PASSWORD` to old `.env` from `.env.example`.
- IF another worktree is running its stack THEN `down -v` kills that one too (the compose project is shared) → `docker ps` BEFORE downing.

### assignment-failed-reset
- IF re-assigning a task does not clear the "Assignment failed" badge THEN the status is system-owned and re-assign alone never resets it → PATCH explicitly `{assigneeId, status: "todo"}` (writable: `todo/in_progress/done`).

### network-and-env
- IF inter-service calls use `localhost` THEN they work natively but die inside compose → always use compose names `http://node-svc:3001`; browsers/FE only touch the gateway :8080.
- IF `.env` shows up in `git status` THEN do NOT commit it — config template: `platform/.env.example`.

### port-4-places
- IF changing a port THEN all 4 places in ONE commit: `platform/conventions/05-ports.md` + `.env.example` + `docker-compose.yml` + README. Missing one = review fail.

### react-query-mf-singleton
- IF a remote (in-shell) creates its own QueryClient THEN its cache splits from the host — creating a task while the activity feed never sees it → ONE QueryClient at the host (`app/shell/src/App.tsx`, module-level); remotes share it via MF; rspack shares `@tanstack/react-query` SYMMETRICALLY shell↔remote (`app/remotes/tasks/rspack.config.mjs`).

## Where-is-what — task X → file Y

| When you need… | Read / edit |
|---|---|
| API/contract change (endpoint, field, schema, event) | `contracts/openapi/*.yaml` · `contracts/db/tasks-schema.sql` · `contracts/events/task-events.md` (+ golden fixtures) — skill `sync-contracts`; codegen `pnpm --filter node-svc generate:types`; go snapshot `internal/api/openapi/` must stay bit-identical (drift-guard) |
| New code (service / app / feature) | `pnpm gen:service` · `gen:app` · `gen:feature` (`--json` → `{created, modified, next_steps}`) — code at `scripts/generators/`; agents `service-dev` (BE) / `ui-dev` (FE) |
| A brand-new service (full procedure) | skill `add-service` (`.claude/skills/`) — 4 SF + gates; conventions 01–09 |
| Verify / gate before merge | `pnpm verify:quick` (`--json` → `[{step,status,duration}]` + exit code) — agent `gate-keeper`; PR checklist: docs/WORKFLOW.md §2 |
| Kafka / outbox / saga / DLQ | skill `wakii-debug-kafka` + `platform/conventions/09` + `docs/adr/0008` + `contracts/events/task-events.md`; agent `e2e-runner` when a live stack is needed |
| Publishing an npm package | skill `wakii-publish` + agent `release-manager` + docs/WORKFLOW.md §4 + `app/ui-kit/RELEASE.md` |
| Feature → PR (gated lifecycle) | skill `wakii-ship-feature` + docs/WORKFLOW.md §2 |
| FE / Module Federation / design system | `docs/adr/0002` + `docs/adr/0009` + `app/ui-kit/README.md` + `app/shared/README.md`; recipes at [recipes.md](recipes.md); **read-locked** `app/shared/src/{api-client,token-storage,error-envelope,mf-bootstrap}.ts` — no edits outside an approved epic; react/rspack/MF upgrades → re-spike via `app/spike` |
| Tokens / theme / color | `app/ui-kit` (tokens + `UiKitProvider` + `themes/dark.css`) — tokens-only rules in AGENTS.md Part II |
| Team workflow / multi-session / epic-story | docs/WORKFLOW.md §1 + §6 · `docs/wakii-playbook.md` (4 SF-splitting archetypes) · board `docs/team/TEAM.md` |
| Demo / e2e / stack debugging | `run.compose` in `orca.yaml` · `scripts/smoke/e2e.sh` · `docs/walkthrough.md` |
| Scaffold a new project from the boilerplate | `bash scripts/scaffold/scaffold.sh <name>` · package `create-wakii-stack` (npx) |
| PR / merge / branch / commit | `docs/git-flow.md` + template `.github/pull_request_template.md` |
| Ports / config / healthcheck / logging / CORS / Dockerfile | `platform/conventions/01–09` (05 = ports) |
| Why the architecture is this way | `docs/adr/0001–0010` |
| AI agents + skills | `.claude/agents/` (fe-dev · be-dev · e2e-runner · contracts-keeper · service-dev · ui-dev · gate-keeper · release-manager) · `.claude/skills/` (add-service · sync-contracts · wakii-ship-feature · wakii-publish · wakii-debug-kafka · use-ui-kit) |
| Onboarding a new human / first run | `docs/walkthrough.md` + `docs/toolchain.md` |
