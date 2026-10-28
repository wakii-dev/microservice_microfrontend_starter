# Fresh-clone walkthrough — from clone to a running demo

Checklist for newcomers copying the boilerplate. Every command below is something that actually
ran in CI (evidence: `docs/superpowers/evidence/sf-5-convergence/test-run.txt` — 11-service
convergence + two-way e2e; earlier SFs: `evidence/sf-*/`).

## 0. Toolchain you need

Read [toolchain.md](toolchain.md). Summary: Node 22 + pnpm 9 (corepack) + JDK 21 + Go 1.24 + bash/curl.
Docker is OPTIONAL (you can finish without it — pick route A or B below). NOTE: the saga demo (§4b)
+ DLQ need Kafka → route A (compose); route B covers the happy path only (`SMOKE_SAGA=0`).

## 1. Clone + install

```bash
git clone <repo> && cd <repo>
pnpm install --frozen-lockfile     # FE workspace (app/*)
cd services/node-svc && pnpm install --frozen-lockfile --ignore-workspace && cd ../..   # node-svc standalone lockfile
cd services/auth-svc && pnpm install --frozen-lockfile --ignore-workspace && cd ../..   # auth-svc standalone lockfile
```

## 2. Postgres + seed

You need Postgres 16 running with the platform init script (schemas + roles + readonly grants):

- **With Docker (easiest):** `cd platform && cp .env.example .env` (fill in the password) → `docker compose up -d postgres` — init script `platform/postgres/init/01-init.sh` runs on first boot.
- **Without Docker:** install or use a portable Postgres 16, `initdb` a data dir, then run the contents of `platform/postgres/init/01-init.sh` by hand (create db `boilerplate`, roles `node_svc`/`spring_svc`/`go_svc`/`go_readonly`/`auth_svc` with passwords matching .env, schemas + default privileges).

## 3. Pick a demo route

### Route A — Compose (Docker — recommended)

```bash
cd platform
cp .env.example .env                # fill in JWT_SECRET (openssl rand -base64 48) + passwords
docker compose down -v              # ⚠️ RUN ONCE after pulling if the machine has an OLD pgdata volume:
                                    #    (1) Flyway V2 seeds user svc-fail/svc-activity + (2) the init script
                                    #    creates schema `auth` + role `auth_svc` (auth-real SF-5) — these only
                                    #    run on a NEW volume — an old volume misses them → the saga dies at
                                    #    auth/validate, auth-svc dies on DATABASE auth (healthcheck /readyz red,
                                    #    gateway never comes up).
                                    # ⚠️ An `.env` created from an older version: add `AUTH_SVC_DB_PASSWORD`
                                    #    (copy from .env.example).
# Kafka has NO data volume — topics are lost on every `down` → create them explicitly
# BEFORE booting services (same as CI convergence.yml; avoids 2 races: the go consumer
# stuck in empty-assignment when subscribing before the topic + DLQ publish Unknown Topic):
docker compose up -d postgres kafka
until docker compose exec -T kafka /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 >/dev/null 2>&1; do sleep 2; done
for topic in task-events task-events.dlq; do
  docker compose exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
    --create --if-not-exists --topic "$topic" --partitions 1 --replication-factor 1
done
docker compose up -d --build        # health-gated chain waits in the right order (11 services, kafka lazy-connect)
bash ../scripts/smoke/e2e.sh        # from platform/ — script lives at repo root. PASS = 15 steps, 3 flows:
                                    #   happy     : login→task→feed THROUGH KAFKA (outbox → topic → go consumer)
                                    #   auth-real : register→refresh rotation→reuse→401→logout + RBAC (user DELETE 403, alice 204)
                                    #   saga      : assign svc-fail → task assignment_failed + original event in task-events.dlq
# Open a browser: http://localhost:8080/ → login alice@demo.local / demo-password
#                (or register a fresh account — Register tab, §4a)
```

### Route B — Native (no Docker — one service at a time)

```bash
# 5 backend services — one terminal per command, env per .env.example (dev placeholders):
cd services/auth-svc && JWT_SECRET=<dev-secret> PORT=8090 \
  DATABASE_URL="postgres://auth_svc:<pw>@localhost:5432/boilerplate" \
  USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  AUTH_DEV_PASSWORD=demo-password pnpm dev

cd services/spring-svc && SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/boilerplate" \
  SPRING_DATASOURCE_USERNAME=spring_svc SPRING_DATASOURCE_PASSWORD=<pw> \
  JWT_SECRET=<dev-secret> SERVER_PORT=8081 USERS_FIXTURE_PATH=$(pwd)/../../contracts/auth/users.json \
  ./mvnw spring-boot:run        # Windows: ./mvnw.cmd

cd services/node-svc && JWT_SECRET=<dev-secret> PORT=3001 \
  DATABASE_URL="postgres://node_svc:<pw>@localhost:5432/boilerplate" \
  SPRING_SVC_URL=http://localhost:8081 GO_SVC_URL=http://localhost:8082 pnpm dev

cd services/go-svc && JWT_SECRET=<dev-secret> PORT=8082 \
  DATABASE_URL="postgres://go_svc:<pw>@localhost:5432/boilerplate" \
  DATABASE_READONLY_URL="postgres://<owner-user>:<owner-pw>@localhost:5432/boilerplate" \
  SPRING_SVC_URL=http://localhost:8081 go run ./cmd/server

cd services/dotnet-svc/src/DotnetSvc && JWT_SECRET=<dev-secret> DOTNET_SVC_PORT=8083 \
  DATABASE_URL="postgres://dotnet_svc:<pw>@localhost:5432/boilerplate" dotnet run   # needs .NET SDK 8 (unlike the other 4 services)

# FE (3 terminals):
cd app/shell   && pnpm dev   # :3000
cd app/remotes/tasks    && pnpm dev   # :4001
cd app/remotes/activity && pnpm dev   # :4002
```

Native mode has NO nginx gateway — the FE calls service ports directly per conventions/07 (dev
CORS is open). The 3-service chain "through one port" is a property of compose mode (route A) +
the CI e2e-smoke job.

### Verify the chain with the smoke script (both routes)

The script calls through the `/api/<svc>` prefix (mirrors gateway routing — conventions/08):
- Route A (from repo root, no need to cd platform): `bash scripts/smoke/e2e.sh` (default `GATEWAY_URL=http://localhost:8080`). By default it runs **two-way** — happy + saga with DLQ assert (needs docker to exec `kafka-console-consumer` inside the kafka container).
- Route B (native, no Kafka): `SMOKE_SAGA=0 bash scripts/smoke/e2e.sh` — happy + auth-real (skips saga + DLQ). There is no real gateway — prove the chain by calling services directly, or stand up a proxy mapping `/api/*` (SF-7 used a local mini Node proxy when verifying native — DO NOT commit it; it only exists for verify).

## 4. Browser walkthrough (human gate — NOT in CI)

On a machine with a live stack (route A or B + FE dev servers). The UI follows the light
**antd-look** (decision 2026-10-17 — spec `docs/superpowers/specs/2026-10-17-antd-look-tokens.md`):
canvas background `#f5f5f5`, white blocks `#ffffff`, a single accent `#1677ff`, dot color-badge
pills; dark (the older palette direction B) is a secondary theme via `UiKitProvider`
(`data-bp-theme`).

1. Open `http://localhost:8080/` (route A) or `http://localhost:3000/` (route B) → you land on a
   **welcome dashboard** with quick links Tasks/Activity + a **DEMO ACCOUNT** box (on-screen:
   `TÀI KHOẢN DEMO`) listing `alice@demo.local / demo-password` and `fail@demo.local`. Log in →
   the nav now shows the user chip (avatar + email) + the **Log out** button (`Đăng xuất`).
2. Nav → **Tasks** (accent active pill) — a **3-column Kanban board** (`Cần làm` / `Đang làm` /
   `Xong` — Todo / Doing / Done) + toolbar (debounced search · newest/oldest sort · **＋ Add**
   opens a create Modal) + an n/N-done progress bar. Keep going:
   - **Drag a card to another column** → status changes (framer-motion drag; the keyboard
     fallback is the status combobox on the card).
   - **Edit**: the *Edit* button on the card → edit Modal (title/description) → *Save* (a real PATCH).
   - **Change status without dragging**: the combobox on the card (`Todo` / `Doing` / `Done`).
   - **Server-side search**: the search box filters via `?q=` (ILIKE in node-svc) — tasks not yet
     loaded are found too; newest/oldest sort.
   - **Load more**: if total > loaded, a *Load more* button at the end of the list fetches the
     next page (real limit/offset); "x/total" grows until complete.
   - **Delete**: the *Delete* button → inline confirm ("Delete this task?" → *Confirm delete* /
     *Cancel*) — a real DELETE.
   - Each card shows the assignee (truncated monospace UUID, hover for the full value),
     "Unassigned" when empty, + createdAt formatted vi-VN.
3. Nav → **Activity**: **stats cards** (Total tasks / Todo / Doing / Done / Events in last 24h) +
   a **feed timeline grouped by day** reflecting every action from step 2 through Kafka (outbox →
   `task-events` → go consumer): "created / updated / assigned / deleted" badges in per-type
   colors, task name, vi-VN time. The *Refresh* button reloads.
4. **Remote-down fallback**: stop one remote and reload the shell — route A:
   `docker stop boilerplate-remote-tasks-1`; route B: Ctrl-C the `:4001` dev server. The shell
   stays intact (nav + user chip), the Tasks slot shows the fallback "Failed to load **tasks**…"
   + a **Retry** button; **Activity keeps working**. To recover: start the remote again
   (`docker start` / rerun `pnpm dev`) then hit *Retry* to reload the remote; if the button
   doesn't take (the MF runtime holds the old rejection) do a **full page reload** — the remote
   mounts normally again.

### 4a. Real auth — register / refresh / logout-all in 2 tabs (epic auth-real)

1. **Register**: open `http://localhost:8080/` → the **Register** tab on the login screen →
   new email + password (8–72 chars) + display name → the account is created and you are logged
   in right away (roles `["user"]`). Log out → log back in with the new account ✓.
2. **Refresh rotation (2 tabs)**: log in with the same account in 2 tabs. Leave tab 1 idle until
   the access token expires (30m) — tab 1's next request auto-refreshes (rotates) the token and
   retries, WITHOUT bouncing back to the login screen. (More sensitive: hand-call
   `POST /api/auth/refresh` with the refreshToken from `localStorage['bp.rt']` — the response
   returns a new pair; the old token can never be reused.)
3. **Logout-all (the acceptance — 1 tab dies, 1 tab survives)**: in tab 2 hit **Log out** (it
   only revokes that tab's refresh token — tab 1 STAYS alive because its 30m access token is
   still valid). To kill ALL tabs: call logout-all (no UI button yet — use the account's token).
   P2 security-audit SF-5: don't paste a token straight into a command (it lands in shell
   history) — use `read -rs`:
   ```bash
   read -rs TOKEN   # paste the access token then Enter (not echoed)
   curl -X POST http://localhost:8080/api/auth/logout-all -H "Authorization: Bearer $TOKEN"
   unset TOKEN
   ```
   Back in tab 1, trigger any next API call → 401 → auto-refresh fails (token revoked for all
   sessions) → back to the login screen. That is the CORRECT behavior (no cross-tab realtime —
   checked at the next request).
4. **RBAC demo**: log in `bob@demo.local` / `demo-password` (roles `["user"]`) → create a task →
   hit **Delete** → blocked (403 FORBIDDEN — an error is shown, the task is untouched). Log in
   `alice@demo.local` (roles `["admin"]`) → delete the same task → success. e2e asserts the same
   chain (steps 11–12).

### 4b. Saga demo (story FI-76 — needs route A, with Kafka)

1. In **Tasks**, create a task (e.g. `saga-demo`) then assign it to the fail fixture user:
   **`fail@demo.local`** — the UI shows the assignee read-only (truncated UUID); assignment goes
   through the API: `PATCH /api/tasks/{id}` with
   `assigneeId=55555555-5555-4555-8555-555555555555` (swagger at `:8080/api/tasks/docs`, or curl
   with a Bearer token).
2. The go consumer deliberately fails ×3 (simulate hook — assignee matches svc-fail) → publishes
   the compensating event `task.assignment_failed` to the shared topic → the node compensation
   consumer updates the status.
3. Watch **Tasks**: the task switches to the **"Gán thất bại"** badge (assignment failed — red
   pill with a red dot, easy to spot; a task in this state no longer offers a status select —
   it is system-owned). The original event (task.assigned) sits in `task-events.dlq`:
   ```bash
   docker compose -f platform/docker-compose.yml --env-file platform/.env.example exec -T kafka \
     /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
     --topic task-events.dlq --from-beginning --timeout-ms 15000
   # each line = 1 DLQ message: {"schemaVersion":1,"originalEvent":"{...task.assigned...}","error":{"reason":...,"retries":3,...}}
   ```
4. **Recovery**: re-assign to a valid user (bob, id `22222222-2222-4222-8222-222222222222`) →
   the saga reruns from the start (bob ≠ svc-fail, the go handler processes normally). NOTE:
   `assignment_failed` is system-owned — re-assigning does NOT reset the status by itself (the
   repo `update()` only sets fields present in the patch); to bring the task back to the normal
   flow, PATCH explicitly `{"assigneeId":"<bob-id>","status":"todo"}` (status accepts exactly 3
   writable values — PATCHing `assignment_failed` is forbidden). In the UI the task gets its
   "Todo" badge + status select back.

> ℹ️ BUG-1 standalone prod white screen (report VU-53, 2026-10-14) **IS FIXED** (sf-5b): shared
> `eager:true` + `standalone` static entry + nginx alias `/remotes/<name>/` — standalone
> :4001/:4002 render fully in the prod build. Evidence:
> `docs/superpowers/evidence/sf-5b-ui-redesign-fix/` (browser walkthrough + phantom-grep
> before/after).

> ℹ️ The `convergence/e2e-smoke` job (GitHub Actions) asserts the saga chain — status + DLQ via
> `kafka-console-consumer` (no browser needed) — **the workflow is currently DISABLED (billing,
> see CLAUDE.md)**; the gate on push is `.husky/pre-push` (FE checks only, no e2e). To verify the
> saga, run it by hand: `bash scripts/smoke/e2e.sh` (see "Verify the chain with the smoke script" above).

### 4c. Storybook — the living design system (Templates + 129 titles)

The shell/remotes UI is built from `@wakii/ui-kit` — browse everything and try the precomposed
templates:

```bash
pnpm --filter @wakii/ui-kit storybook   # → http://localhost:6006 (script stamps the version itself)
```

Real numbers (Storybook index 2026-10-18): **129 titles · 623 story exports**, including the
**Templates** group — 6 templates of "real pages" (live controlled state, not mock renders):

| Template | Story path (`?path=/story/…`) | Composed from |
|----------|-------------------------------|---------|
| Admin dashboard | `templates-dashboard--dashboard` | `Layout` (Sider+Header) + Row/Col + Card/Statistic + Table + Timeline + Chart |
| Project kanban | `templates-kanban-project--project-board` | `KanbanBoard` (4 columns + WIP limit) + Segmented/Input.Search/Select filters + `Timesheet` + `message` toast on move |
| CRUD table | `templates-crud-table--full-demo` | `Table` (3-state sort/selection/expandable/fixed header/summary) + `Drawer` form (useForm+zod) + `Popconfirm` + `message` |
| Auth | `templates-auth--sign-in` · `--sign-up` · `--split-layout` | `useForm` + zod + Field/Input/Button + `Layout` split |
| Landing | `templates-landing--landing-alive` | `Parallax` + `Reveal` + `CountUp`/`Statistic` + `Grid` |
| Settings | `templates-settings--settings` | `Tabs` + `Switch` + `Field` + live theme toggle |

Tip: the Storybook toolbar has a **dark toggle** (`data-bp-theme` on the preview body — every
component is token-driven, so the whole index re-themes in one click). AI agents: read
[AGENTS.md](../AGENTS.md) + [docs/ai/recipes.md](ai/recipes.md) — a when-to-use map + 12
copy-paste recipes. Template details: `app/ui-kit/README.md` § Templates.

## 5. Copy/scaffold a new project

```bash
bash scripts/scaffold/scaffold.sh my-project
cd my-project
pnpm install --no-frozen-lockfile   # first run is non-frozen — see SCAFFOLD.md
# then repeat sections 2–4 in the new project
```

Output structure depends on the scaffold mechanism:

- **`npm create wakii-stack`** (official CLI, engine prune): `app/ui-kit` is **gone** from the
  generated project — FE apps install `@wakii/ui-kit` from the npm registry (dist-tag `latest`,
  lockfile pins the exact version at scaffold time; upgrading = `pnpm update @wakii/ui-kit`).
  `app/shared` (fe-shared) is still included, consumed-via-source. Details:
  [ADR-0010](adr/0010-stack-fe-npm-deps.md).
- **`scripts/scaffold/scaffold.sh`** (copies the live repo for internal dev — the command above):
  still includes both `app/shared` + `app/ui-kit` via source.

Continue developing the new project with the story workflow (Wakii): see
[wakii-playbook.md](wakii-playbook.md) — story/single/fix decision tree + 4 SF-split archetypes + gates.

## 6. What CI proves

| Workflow | Runs when | Evidence |
|----------|---------|-----------|
| `contracts` | contracts/**, platform/** change | spectral + gitleaks + compose config + boot-smoke auth-svc + schemathesis FULL (auth.yaml v2) |
| `services-*` / `shell` / `remotes-*` | the matching folder changes | build + test + docker build + boot-smoke (node/go include a kafka boot-smoke) |
| `convergence` (SF-5, story FI-76) | every push | two-way e2e on the 11-service compose (happy via Kafka + saga → `assignment_failed` + DLQ assert) + copy-dir standalone + scaffold output builds |

## 7. Team journey — app-fit 4 apps + internal docs (2026-10-18)

**App-fit**: all 4 FE apps migrated to `@wakii/ui-kit` (tokens + components via source):

| App | What was fitted |
|-----|--------|
| `app/shell` (MF host :3000) | layout + nav + tokens from the previous iteration |
| `app/remotes/tasks` (:4001) | `TaskForm`/`TaskItem` moved to `useForm` + zod + `Field`/`Input`/`Textarea` (+`useFieldArray` already in the kit); `TaskList` keeps the contract (EmptyState at page level) |
| `app/remotes/activity` (:4002) | `ActivityPage` + `StatTile` → `Card`/`Statistic` from ui-kit |
| `app/admin` | dashboard layout `Grid`/`Card`/`Statistic` keeps stat-intent |

**Templates**: 6 precomposed sample pages in Storybook (table in §4c) — copy them as starting
points for real pages; recipes at [docs/ai/recipes.md](ai/recipes.md).

**Toward 0.3.0**: the megagate of 32 commits (241416f..HEAD) is gated green — release notes
drafted at
[`docs/superpowers/specs/2026-10-18-0.3.0-release-notes.md`](superpowers/specs/2026-10-18-0.3.0-release-notes.md) —
merging the PR finalizes the release (ui-kit is consumed via source, so "release" = the merge
point, see the CHANGELOG head).

**Internal team docs (local-only, gitignored — never in a PR)**: `docs/team/` holds
[RULES.md](team/RULES.md) (operating charter: roles, work cycle, T1→T3 trust ladder, file
ownership), `TEAM.md` (roster + standup + report log), `DECISIONS.md` (pre-approvals),
`inbox/` (peer-to-peer mail), `CHANNEL.md`. The in-repo summary for fresh sessions:
[CLAUDE.md](../CLAUDE.md) § "Team protocol".
