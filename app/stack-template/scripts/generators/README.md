# generators — `pnpm gen:service | gen:app | gen:feature | remove:service`

Generate boilerplate-compliant scaffolds (platform/conventions/01–09) for AI and humans. One command = a new service/app/feature PLUS every surrounding wiring (compose · gateway nginx · .env.example · pnpm-workspace · port table · contract stub · CI workflow · postgres init script · stack manifest).

## Output contract (AI-first)

`--json` → `{created: string[], removed: string[], modified: string[], next_steps: string[]}` — `next_steps` holds AI-actionable directives (verb-first + path + action). Default text mode: one `created:/removed:/modified:/next:` line per item. Errors → stderr `error: ...` (or `{"error":{"message}}` with --json), exit 1. Idempotent-guard: existing artifacts → error, never overwritten (remove:* is idempotent in the opposite direction: missing pieces are skipped).

## Commands

```bash
pnpm gen:service <name> [--lang ts|go|spring] [--port N] [--db shared|dedicated|none]
pnpm gen:app <name> [--remote] [--port N]
pnpm gen:feature <name> --app <app>
pnpm remove:service <name>
```

| Generator | Generates | Wires |
|---|---|---|
| `gen:service` (ts default) | `services/<name>/` Fastify TS with REAL CRUD on the default `items` resource: paginated list (`?limit/&offset`, tasks pattern) + get + create + patch + delete, pg repo (schema-qualified table `<service>_items`), repo interface for test fakes, health naked+mirror (02), envelope (04), CORS (07), JWT verify (08), Dockerfile (01), tests, README. go = chi skeleton; spring = Boot 3 skeleton | compose (yaml pkg), nginx (`# GEN:services` markers), .env.example, pnpm-workspace (ts), conventions/05 table, `contracts/openapi/<name>.yaml` (real CRUD paths, spectral-pass), CI workflow, postgres init script `02-<name>.sh`, stack manifest entry |
| `gen:app` | SPA: Vite + ui-kit Layout + dark toggle (the app/admin pattern). `--remote`: 2-entry MF remote + rspack + nginx.conf + Dockerfile (the remotes/tasks pattern) | `--remote`: compose `remote-<name>` (next free port 4003+), nginx `$remote_up` map (`# GEN:remotes`), .env `REMOTE_*`, conventions/05 |
| `gen:feature` | `src/pages/<Pascal>Page.tsx` (Card+Table+Alert), `src/api/<name>.ts` (decodes envelope 04), smoke test, FEATURE.md | Route into `src/App.tsx` (`GEN:routes` marker → fallback before the catch-all `path="*"`) or the exposes entry of a remote's `rspack.config.mjs`; uncertain anchor → files only + next_steps manual instructions |
| `remove:service` | — (inverse of gen:service) | removes the service dir + every generated wiring listed above; protected default services are refused; idempotent |

## Database choice (`--db`)

| Mode | Postgres layout | Wiring |
|---|---|---|
| `shared` (default in interactive TTY; bare `--db`) | one postgres DB, own SCHEMA `<service>` + LOGIN role (schema-per-service, the 01-init.sh pattern incl. default privileges) | `DATABASE_URL` role-based; `<NAME>_DB_PASSWORD` env; init `02-<name>.sh` creates schema + role + table |
| `dedicated` | own DATABASE + role | `DATABASE_URL` built from `POSTGRES_<NAME>_DB/_USER` + `<NAME>_DB_PASSWORD`; all three passed into the postgres container; init `02-<name>.sh` creates DATABASE + role + table |
| `none` | no database yet | in-memory repo keeps the service runnable; readyz stays honest (no fake 200) |

Interactive TTY runs prompt for the mode; AI/non-TTY runs must pass the flag (no flag = `none`). The init scripts run on a FRESH postgres volume (docker-entrypoint-initdb.d, `02-` sorts after `01-`); on an existing volume apply them manually (the command is in each script header). The generated TS service is runnable right after gen: unit tests use an in-memory repo fake; `docker compose up postgres <name>` on a fresh volume gives you a working CRUD API end to end.

Port picking: scans compose (host+container) — BE services 3002+ · FE remotes 4003+ · SPA dev 5174+ (admin owns 5173). `--port` overrides (occupied → error).

## Developing the generators

```bash
node --test scripts/generators/lib/insert.test.mjs   # unit tests for the insert/remove primitives (node:test, 0 deps; explicit FILE path — a dir arg does not scan on node 24)
node scripts/generators/gen-service.mjs --help       # usage of each generator
```

Test the generators for real inside a /tmp fixture (NEVER run them against this repo):

```bash
mkdir -p /tmp/fx/platform/gateway/nginx /tmp/fx/contracts/openapi /tmp/fx/platform/conventions /tmp/fx/services/go-svc
cp platform/docker-compose.yml platform/.env.example /tmp/fx/platform/
cp platform/gateway/nginx/nginx.conf /tmp/fx/platform/gateway/nginx/
cp pnpm-workspace.yaml /tmp/fx/ && cp platform/conventions/05-ports.md /tmp/fx/platform/conventions/ && cp .spectral.yaml /tmp/fx/
cp services/go-svc/go.mod /tmp/fx/services/go-svc/
node scripts/generators/gen-service.mjs demo-svc --db shared --root /tmp/fx --json
docker compose -f /tmp/fx/platform/docker-compose.yml --env-file /tmp/fx/platform/.env.example config -q
pnpm exec spectral lint --ruleset /tmp/fx/.spectral.yaml /tmp/fx/contracts/openapi/demo-svc.yaml
node scripts/generators/remove-service.mjs demo-svc --root /tmp/fx --json   # then diff /tmp/fx vs the copies → must be clean
```

## Technical notes

- compose insertion/removal uses the `yaml` package Document API (comments/formatting preserved, `lineWidth: 0` — no reflow of existing long lines). NO hand-rolled regex on the compose.
- nginx insertion uses the `# >>> GEN:services|remotes` marker comments around stable anchors of the conf (first run CREATES the markers; later runs insert inside the region); removal operates strictly inside the markers.
- `.env.example`: sections append at EOF (easy to review); existing keys are never overwritten; removal drops the generated section + stray keys only.
- The generators only ADD new files + edit the infra files listed above. Existing apps/services are never touched (except route/expose insertion by gen:feature — only at an exact anchor).
- Ports/MF pins are READ-LOCKED (conventions/05, mfToolkit): templates never bump versions — upgrades require a re-spike.
