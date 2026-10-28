# create-wakii-stack

[![npm](https://img.shields.io/npm/v/create-wakii-stack?logo=npm&label=create-wakii-stack&color=cb3837)](https://www.npmjs.com/package/create-wakii-stack)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)

Scaffold the **full Wakii architecture** (FE + BE + infra) as a pruned monorepo snapshot — CRA-style CLI: interactive multiselect, non-interactive flags. Strategy **Hybrid C**: copy the full template, then **prune against a manifest** (delete paths, cut compose blocks, clean `depends_on`, filter gateway conf/env keys) — no template engine, original content untouched.

<p align="center">
  <img src="https://unpkg.com/create-wakii-stack@latest/docs/assets/readme/stack-output.svg" width="880" alt="create-wakii-stack — real output + 3-step usage (animated)" />
</p>

## Usage

```bash
pnpm create wakii-stack my-stack                      # interactive (multiselect services)
pnpm create wakii-stack my-stack --all --yes          # every service, skip the confirm
pnpm create wakii-stack stacks/billing --services node-svc,shell,tasks --skip-install
```

Interactive flow — pick services from the manifest (**11**: `postgres · kafka · auth-svc · gateway · node-svc · spring-svc · go-svc · shell · remote-tasks · remote-activity · admin`, each labeled with its layer), confirm the summary, watch the scaffold spinner, then follow the generated next steps:

```
cd my-stack
cp platform/.env.example platform/.env   # fill in secrets before up
docker compose -f platform/docker-compose.yml --env-file platform/.env up -d

URLs: gateway http://localhost:8080 · shell http://localhost:3000 (if you picked FE)
```

## Flags

| Flag | Meaning | Default |
|---|---|---|
| `[stackName]` (positional) | A name **or a path** — the package/stack name is always the **basename** | prompt (`my-wakii-stack`) |
| `--services <list>` | comma-separated service ids (also accepts `--services=a,b`); unknown ids are rejected with the valid list | prompt multiselect |
| `--all` | select every service in the manifest | — |
| `--yes` | skip the confirm summary | — |
| `--skip-install` | omit the per-app `pnpm install` hint | — |
| `-h`, `--help` | print usage | — |

An **empty selection** (no `--all`, no `--services`, or an empty list) is an error — pick at least one service. The destination directory must not already exist non-empty.

## Tier rules (applied automatically from the manifest)

- **≥ 1 BE service** → automatically pulls `postgres` + `kafka` + `gateway` + `auth-svc`.
- **≥ 1 FE service** → automatically pulls `gateway`.
- **Per-service requires** close transitively — e.g. picking `shell` pulls `gateway` + `remote-tasks` + `remote-activity`.

## What you get

A monorepo snapshot pruned according to `stack-manifest.json`:

- `platform/docker-compose.yml` stays **YAML-valid** — unselected service blocks removed, `depends_on` references cleaned, pgdata volume dropped with a warning comment.
- `platform/gateway/nginx/nginx.conf` — only the routes of your services (brace-count pruning between markers).
- `platform/.env.example` — keys filtered per service (+ shared keys like `JWT_SECRET`).
- A generated **README** with the up command and ports (`gateway :8080`, `shell :3000`).
- Placeholders `__STACK_NAME__` / `__STACK_ORG__` rendered into package.json `name`, the compose project `name:`, the README H1, and docs org — **service names inside `services/` are never rewritten** so the stack runs as-is.
- **FE deps come from the npm registry** — `app/ui-kit` is pruned from the output; FE apps install `@wakii/ui-kit` from npm (dist-tag `latest`, engine rewrites `workspace:*` → `latest` and re-syncs the lockfile; upgrade later with `pnpm update @wakii/ui-kit`). No design-system source ships in the stack. `app/shared` (fe-shared) is still embedded, consumed via source. See [ADR 0010](../../docs/adr/0010-stack-fe-npm-deps.md).
- FE-only SPA outside a stack? Use [`create-wakii-app`](https://www.npmjs.com/package/create-wakii-app) instead.

## Architecture (repo)

- `src/manifest.ts` — loads + validates `stack-manifest.json` (schema documented as JSDoc in-file: services/layer/paths/envKeys/gatewayBlocks + files + ports + smoke). **Contract with worker-compose** — the engine only knows the schema, never hardcodes a service.
- `src/options.ts` — flag parsing + tier-1 rules
- `src/scaffold.ts` — full copy → renders `__STACK_NAME__`/`__STACK_ORG__` (binaries skipped) → prunes paths/compose (text indentation-based: 2-space blocks, 6-space `depends_on` entries + reference cleanup + pgdata removal + warning comment) / gateway conf (brace-count between markers) / env keys → generates the README
- `src/index.ts` — the `@clack/prompts` flow

## Development

```bash
pnpm --filter create-wakii-stack typecheck
pnpm --filter create-wakii-stack test   # 3-service fixture template in tmp — no network
```

## License

MIT — see [LICENSE](./LICENSE).
