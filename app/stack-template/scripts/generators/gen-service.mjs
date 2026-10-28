#!/usr/bin/env node
// gen-service.mjs — `pnpm gen:service <name> [--lang ts|go|spring] [--port N] [--db shared|dedicated|none]`
// Generates services/<name>/ following the conventions (01 Dockerfile, 02 health,
// 03 logs, 04 envelope, 05 port, 06 env, 07 CORS, 08 gateway/prefix) and wires every
// surrounding piece: compose (via the yaml pkg — no hand-rolled regex), gateway nginx
// (GEN:services markers), .env.example, pnpm-workspace.yaml (ts), the conventions/05
// port table, a REAL CRUD contract stub, a per-service CI workflow, the postgres init
// script (schema-per-service or dedicated DB), and the stack manifest entry.
// Output contract for AI: --json → {created, removed, modified, next_steps} (lib/result.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {
  addServiceDependsOn,
  addServiceEnv,
  composeHasService,
  insertComposeService,
  insertWorkspacePackage,
  pickFreePort,
  usedHostPorts,
} from './lib/compose-yaml.mjs';
import { appendPortsTableRow } from './lib/docinsert.mjs';
import { appendEnvSection } from './lib/envfile.mjs';
import { exists, isDir, readText, writeNew, writeText } from './lib/io.mjs';
import { insertManifestService } from './lib/manifest.mjs';
import { insertApiLocation } from './lib/nginx.mjs';
import { camel, dbRole, parseArgs, pascal, requireValidName, screaming, snake } from './lib/naming.mjs';
import { emit, emitError, helpText, GenResult } from './lib/result.mjs';
import { openapiStub } from './tpl/openapi-stub.mjs';
import { serviceGoFiles } from './tpl/service-go.mjs';
import { serviceSpringFiles } from './tpl/service-spring.mjs';
import { serviceTsFiles } from './tpl/service-ts.mjs';
import { workflowYml } from './tpl/workflow.mjs';

const HELP = helpText({
  usage: 'usage: pnpm gen:service <name> [--lang ts|go|spring] [--port N] [--db shared|dedicated|none] [--root <dir>] [--json] [--help]',
  summary:
    'Generate a new service following platform/conventions/01–08: Fastify TS by default with REAL CRUD ' +
    '(paginated list / get / create / patch / delete on the default `items` resource), and wire compose + gateway + ' +
    '.env.example + contract stub + CI workflow + postgres init script + stack manifest entry. ' +
    'Idempotent-guard: anything that already exists → error, never overwritten.',
  flags: [
    '<name>                 kebab-case, e.g. notification-svc (required, first positional)',
    '--lang ts|go|spring    default ts (Fastify+TS, real CRUD). go = chi, spring = Boot 3 (skeletons)',
    '--port N               service port (conventions/05). Default: next free port in 3002–3199',
    '--db shared|dedicated  shared (default in interactive mode): one postgres, own schema <service> + role ' +
      '(schema-per-service, pattern of platform/postgres/init/01-init.sh) | dedicated: own DATABASE + role ' +
      '(env POSTGRES_<SVC>_DB/_USER/_DB_PASSWORD) | none: no database (in-memory repo)',
    '--root <dir>           repo root (default: cwd — run from the repo root)',
    '--json                 output JSON {created, removed, modified, next_steps} — AI contract',
    '--help                 this page',
  ],
  examples: [
    'pnpm gen:service notification-svc                          # TTY: prompts for db; non-TTY: --db none',
    'pnpm gen:service notification-svc --db shared              # shared postgres, own schema + role',
    'pnpm gen:service search-svc --lang go --port 3005          # go skeleton',
    'pnpm gen:service billing-svc --db dedicated --json         # dedicated database + role',
  ],
  refs: [
    'platform/conventions/01-dockerfile-pattern.md (multi-stage, healthcheck only in compose)',
    'platform/conventions/02-healthcheck.md (/healthz + /readyz naked + mirror, readyz probes REAL deps)',
    'platform/conventions/04-error-envelope.md · 05-ports.md · 06-configuration.md · 07-cors.md · 08-gateway-and-remotes.md',
    'platform/postgres/init/01-init.sh (schema-per-service + default-privileges pattern)',
  ],
});

const LANGS = new Set(['ts', 'go', 'spring']);
const DB_MODES = new Set(['shared', 'dedicated', 'none']);

export function parseAndValidate(argv) {
  const { flags, positionals } = parseArgs(argv);
  const name = positionals[0];
  if (!name || flags.help) return { help: true };
  const lang = flags.lang ?? 'ts';
  if (!LANGS.has(lang)) throw new Error(`--lang must be one of ${[...LANGS].join('|')}, got: "${lang}"`);
  requireValidName(name, 'service name');
  const port = flags.port == null ? null : Number(flags.port);
  if (flags.port != null && (!Number.isInteger(port) || port <= 1024 || port >= 65536)) {
    throw new Error(`--port is invalid: ${flags.port}`);
  }
  // --db: value form (--db shared / --db=dedicated) or bare --db → shared (flag default)
  let db;
  if (flags.db == null) db = undefined; // not provided — TTY prompt / none for non-TTY
  else if (flags.db === true) db = 'shared';
  else if (DB_MODES.has(flags.db)) db = flags.db;
  else throw new Error(`--db must be one of ${[...DB_MODES].join('|')}, got: "${flags.db}"`);
  return {
    help: false,
    name,
    lang,
    db,
    port,
    root: flags.root ?? process.cwd(),
    json: flags.json === true,
  };
}

/** Interactive db-mode prompt — ONLY on a TTY; AI/non-interactive runs must use --db. */
export async function promptDbMode(name) {
  if (!process.stdin.isTTY) return null;
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`Database for ${name}? shared | dedicated | none [shared]: `)).trim().toLowerCase();
    if (answer === '' || answer === 'shared') return 'shared';
    if (DB_MODES.has(answer)) return answer;
    throw new Error(`invalid db mode "${answer}" — use shared | dedicated | none`);
  } finally {
    rl.close();
  }
}

/** The postgres init script for the chosen db mode (docker-entrypoint-initdb.d, runs after 01-). */
export function initScriptSql(ctx) {
  const applyHint =
    '# On an EXISTING volume apply manually:\n' +
    '#   docker compose -f platform/docker-compose.yml --env-file platform/.env.example exec -T postgres \\\n' +
    '#     bash -c \'psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"\' < platform/postgres/init/02-' +
    ctx.name +
    '.sh\n';
  if (ctx.db === 'shared') {
    return (
      `#!/bin/bash
# ` +
      ctx.name +
      ` database init — generated by scripts/generators gen-service (--db shared).
# Pattern-matches platform/postgres/init/01-init.sh: one SCHEMA + one LOGIN role per
# service + the default-privileges idiom. Runs ONCE on a FRESH volume (02- sorts after 01-).
` +
      applyHint +
      `set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE SCHEMA IF NOT EXISTS ` +
      ctx.snake +
      `;

CREATE ROLE ` +
      ctx.dbRole +
      ` LOGIN PASSWORD '\${` +
      ctx.scream +
      `_DB_PASSWORD}';

GRANT USAGE, CREATE ON SCHEMA ` +
      ctx.snake +
      ` TO ` +
      ctx.dbRole +
      `;
ALTER ROLE ` +
      ctx.dbRole +
      ` SET search_path = ` +
      ctx.snake +
      `;

-- default resource table (rename for the real domain — see services/` +
      ctx.name +
      `/README.md)
CREATE TABLE IF NOT EXISTS ` +
      ctx.snake +
      `.` +
      ctx.snake +
      `_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ` +
      ctx.snake +
      `.` +
      ctx.snake +
      `_items OWNER TO ` +
      ctx.dbRole +
      `;
EOSQL

echo "[init] ` +
      ctx.name +
      `: schema + role + table ready"
`
    );
  }
  // dedicated
  return (
    `#!/bin/bash
# ` +
    ctx.name +
    ` database init — generated by scripts/generators gen-service (--db dedicated).
# Creates a DEDICATED database + LOGIN role + table. Runs ONCE on a FRESH volume
# (02- sorts after 01-). Requires POSTGRES_` +
    ctx.scream +
    `_DB/_USER/_DB_PASSWORD in the postgres container env (wired by gen-service).
` +
    applyHint +
    `set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE ROLE ` +
    ctx.dbRole +
    ` LOGIN PASSWORD '\${` +
    ctx.scream +
    `_DB_PASSWORD}';
EOSQL

# CREATE DATABASE cannot run inside a DO block — guard with a datname lookup
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc \\
  "SELECT 1 FROM pg_database WHERE datname = '\${POSTGRES_` +
    ctx.scream +
    `_DB}'" | grep -q 1 || \\
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \\
    -c "CREATE DATABASE \${POSTGRES_` +
    ctx.scream +
    `_DB} OWNER ` +
    ctx.dbRole +
    `"

# table inside the new database (owned by the role, public schema)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "\${POSTGRES_` +
    ctx.scream +
    `_DB}" <<EOSQL
CREATE TABLE IF NOT EXISTS public.` +
    ctx.snake +
    `_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.` +
    ctx.snake +
    `_items OWNER TO ` +
    ctx.dbRole +
    `;
EOSQL

echo "[init] ` +
    ctx.name +
    `: database + role + table ready"
`
  );
}

/**
 * Render the compose service block in the repo's house style (inline flow arrays,
 * aligned comments) — insertion is a text splice so the rest of the file stays
 * byte-identical. Mirrors the node-svc/spring-svc entries (conventions/01/02/05/06).
 */
export function composeServiceBlock(ctx, lang) {
  const { name, scream, snake, dbRole, port, db } = ctx;
  const lines = [];
  lines.push(`  # gen:service ${ctx.date} — conventions/01/02/05/06 (details: services/${name}/README.md)`);
  lines.push(`  ${name}:`);
  lines.push(`    build: ../services/${name}`);
  lines.push(`    environment:`);
  lines.push(lang === 'spring' ? `      SERVER_PORT: ${port} # container port FIXED (conventions/05)` : `      PORT: ${port} # container port FIXED (conventions/05)`);
  if (db === 'shared') {
    if (lang === 'spring') {
      lines.push(`      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/\${POSTGRES_DB:?set in .env}?currentSchema=${snake}`);
      lines.push(`      SPRING_DATASOURCE_USERNAME: ${dbRole}`);
      lines.push(`      SPRING_DATASOURCE_PASSWORD: \${${scream}_DB_PASSWORD:?set in .env}`);
    } else {
      lines.push(`      DATABASE_URL: postgres://${dbRole}:\${${scream}_DB_PASSWORD:?set in .env}@postgres:5432/\${POSTGRES_DB:?set in .env}`);
    }
  } else if (db === 'dedicated') {
    if (lang === 'spring') {
      lines.push(`      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/\${POSTGRES_${scream}_DB:?set in .env}`);
      lines.push(`      SPRING_DATASOURCE_USERNAME: \${POSTGRES_${scream}_USER:?set in .env}`);
      lines.push(`      SPRING_DATASOURCE_PASSWORD: \${${scream}_DB_PASSWORD:?set in .env}`);
    } else {
      lines.push(`      DATABASE_URL: postgres://\${POSTGRES_${scream}_USER:?set in .env}:\${${scream}_DB_PASSWORD:?set in .env}@postgres:5432/\${POSTGRES_${scream}_DB:?set in .env}`);
    }
  }
  lines.push(`      JWT_SECRET: \${JWT_SECRET:?set in .env}`);
  lines.push(`      CORS_DEV_ORIGIN: \${CORS_DEV_ORIGIN:-}`);
  lines.push(`      LOG_LEVEL: \${LOG_LEVEL:-info}`);
  lines.push(`    ports:`);
  lines.push(`      - "\${${scream}_PORT:-${port}}:${port}" # host-side`);
  if (db !== 'none') {
    lines.push(`    depends_on:`);
    lines.push(`      postgres:`);
    lines.push(`        condition: service_healthy`);
  }
  if (lang !== 'go') {
    lines.push(`    healthcheck: # health-gated /readyz (conventions/02) — alpine base has busybox wget`);
    lines.push(`      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:${port}/readyz"]`);
    lines.push(`      interval: 5s`);
    lines.push(`      timeout: 3s`);
    lines.push(`      retries: 12`);
    lines.push(`      start_period: ${lang === 'spring' ? '30s' : '20s'}${lang === 'spring' ? ' # Flyway/JVM boot' : ''}`);
  }
  return lines.join('\n') + '\n';
}

export async function runGenService(opts) {
  const { name, lang } = opts;
  const root = opts.root;
  const res = new GenResult();

  // --- db mode: flag wins; otherwise prompt on a TTY; non-TTY without flag → none ---
  const db = opts.db ?? (await promptDbMode(name)) ?? 'none';

  // --- read the base files + run ALL guards before writing anything ---
  const composePath = path.join(root, 'platform/docker-compose.yml');
  const nginxPath = path.join(root, 'platform/gateway/nginx/nginx.conf');
  const envPath = path.join(root, 'platform/.env.example');
  const workspacePath = path.join(root, 'pnpm-workspace.yaml');
  const portsDocPath = path.join(root, 'platform/conventions/05-ports.md');
  const manifestPath = path.join(root, 'app/stack-template/stack-manifest.json');
  for (const p of [composePath, nginxPath, envPath]) {
    if (!exists(p)) {
      throw new Error(`not the boilerplate repo — missing ${path.relative(root, p)} (run from the repo root or pass --root <dir>)`);
    }
  }
  const composeText = readText(composePath);
  const nginxText = readText(nginxPath);
  const date = new Date().toISOString().slice(0, 10);

  const svcDir = path.join(root, 'services', name);
  if (isDir(svcDir)) throw new Error(`services/${name} already exists — idempotent-guard (delete it manually to regenerate)`);
  if (composeHasService(composeText, name)) throw new Error(`compose already has service "${name}"`);
  if (exists(path.join(root, 'contracts/openapi', `${name}.yaml`))) throw new Error(`contracts/openapi/${name}.yaml already exists`);
  if (exists(path.join(root, '.github/workflows', `services-${name}.yml`)))
    throw new Error(`.github/workflows/services-${name}.yml already exists`);
  if (db !== 'none' && exists(path.join(root, 'platform/postgres/init', `02-${name}.sh`)))
    throw new Error(`platform/postgres/init/02-${name}.sh already exists`);
  if (exists(manifestPath)) {
    const manifest = JSON.parse(readText(manifestPath));
    if (Array.isArray(manifest.services) && manifest.services.some((s) => s.id === name)) {
      throw new Error(`stack manifest already has service "${name}" — idempotent-guard`);
    }
  }

  // --- port (conventions/05): --port or the next free port in 3002–3199 ---
  const used = usedHostPorts(composeText);
  let port = opts.port;
  if (port == null) port = pickFreePort(used, 3002, 3199);
  else if (used.has(port)) throw new Error(`port ${port} is already used in compose — pick a free one (conventions/05)`);

  const ctx = {
    name,
    camel: camel(name),
    pascal: pascal(name),
    scream: screaming(name),
    snake: snake(name),
    dbRole: dbRole(name),
    port,
    db,
    date,
    pkg: 'com.example.' + camel(name),
    goModule: null,
  };

  // --- files per language ---
  let files;
  if (lang === 'go') {
    const goModPath = path.join(root, 'services/go-svc/go.mod');
    if (!exists(goModPath)) throw new Error('services/go-svc/go.mod not found — a sample Go service is required to derive the module base');
    ctx.goModule = (readText(goModPath).match(/^module (\S+)/m)?.[1] ?? '').replace(/\/services\/go-svc$/, '');
    if (!ctx.goModule) throw new Error('could not parse the module base from services/go-svc/go.mod');
    files = serviceGoFiles(ctx);
  } else if (lang === 'spring') {
    files = serviceSpringFiles(ctx);
  } else {
    files = serviceTsFiles(ctx);
  }

  // --- compose block (text-rendered in house style; range splice = lossless round-trip) ---
  const gatewayCondition = lang === 'go' ? 'service_started' : 'service_healthy';
  let newCompose = insertComposeService(composeText, name, composeServiceBlock(ctx, lang));
  newCompose = addServiceDependsOn(newCompose, 'gateway', name, gatewayCondition, 'gen: gated on the new service readiness');
  if (db === 'shared') {
    newCompose = addServiceEnv(newCompose, 'postgres', `${ctx.scream}_DB_PASSWORD`, '${' + ctx.scream + '_DB_PASSWORD:?set in .env}');
  } else if (db === 'dedicated') {
    for (const key of [`POSTGRES_${ctx.scream}_DB`, `POSTGRES_${ctx.scream}_USER`, `${ctx.scream}_DB_PASSWORD`]) {
      newCompose = addServiceEnv(newCompose, 'postgres', key, '${' + key + ':?set in .env}');
    }
  }

  const nginxRes = insertApiLocation(nginxText, name, port);
  if (!nginxRes) {
    throw new Error(
      `nginx.conf has neither the "401 body" anchor nor the GEN:services marker — insert the /api/${name} block manually per platform/conventions/08, then rerun`,
    );
  }

  // --- .env.example vars per db mode ---
  const envVars = [
    {
      key: `${ctx.scream}_PORT`,
      value: String(port),
      comment: `host-side port — the container port is fixed at ${port} (conventions/05)`,
    },
  ];
  if (db === 'shared') {
    envVars.push({ key: `${ctx.scream}_DB_PASSWORD`, value: `change-me-${name}`, comment: `password of role ${ctx.dbRole} (created by the init script)` });
  } else if (db === 'dedicated') {
    envVars.push(
      { key: `POSTGRES_${ctx.scream}_DB`, value: ctx.snake, comment: 'dedicated database name (created by the init script)' },
      { key: `POSTGRES_${ctx.scream}_USER`, value: ctx.dbRole, comment: 'dedicated database role (created by the init script)' },
      { key: `${ctx.scream}_DB_PASSWORD`, value: `change-me-${name}`, comment: `password of role ${ctx.dbRole} (created by the init script)` },
    );
  }
  const envRes = appendEnvSection(envPath, { header: `gen: ${name}`, vars: envVars });

  let newWorkspace = null;
  if (lang === 'ts' && exists(workspacePath)) {
    newWorkspace = insertWorkspacePackage(readText(workspacePath), `services/${name}`);
  }

  let newPortsDoc = null;
  if (exists(portsDocPath)) {
    newPortsDoc = appendPortsTableRow(readText(portsDocPath), name, port, lang === 'ts' ? 'Fastify + TS' : lang === 'go' ? 'Go chi' : 'Spring Boot 3');
  }

  // --- WRITE: service tree first, then the edited infra files ---
  for (const [rel, content] of Object.entries(files)) {
    res.createdFile(path.relative(root, writeNew(path.join(svcDir, rel), content)));
  }
  if (lang === 'spring') {
    // mvnw + .mvn cannot be generated — COPY them from the spring-svc sample (the Dockerfile needs mvnw)
    const springSample = path.join(root, 'services/spring-svc');
    for (const item of ['mvnw', 'mvnw.cmd', '.mvn']) {
      const src = path.join(springSample, item);
      const dst = path.join(svcDir, item);
      if (exists(src)) {
        fs.cpSync(src, dst, { recursive: true });
        res.createdFile(path.relative(root, dst));
      } else {
        res.next(`copy ${item} from the spring-svc sample into services/${name}/ (the Dockerfile needs mvnw)`);
      }
    }
  }

  writeText(composePath, newCompose);
  res.modifiedFile('platform/docker-compose.yml');
  writeText(nginxPath, nginxRes.text);
  res.modifiedFile('platform/gateway/nginx/nginx.conf');
  if (nginxRes.created) res.next('review: nginx.conf got the GEN:services markers — later gen runs insert inside that region automatically');
  if (envRes.added.length > 0) res.modifiedFile('platform/.env.example');
  if (newWorkspace != null) {
    writeText(workspacePath, newWorkspace);
    res.modifiedFile('pnpm-workspace.yaml');
  }
  if (newPortsDoc != null) {
    writeText(portsDocPath, newPortsDoc);
    res.modifiedFile('platform/conventions/05-ports.md');
  } else {
    res.next(`edit: platform/conventions/05-ports.md — add the port row ${name} = ${port} to the table (old anchor not found)`);
  }
  if (db !== 'none') {
    res.createdFile(path.relative(root, writeNew(path.join(root, 'platform/postgres/init', `02-${name}.sh`), initScriptSql(ctx))));
    fs.chmodSync(path.join(root, 'platform/postgres/init', `02-${name}.sh`), 0o755);
  }
  res.createdFile(path.relative(root, writeNew(path.join(root, 'contracts/openapi', `${name}.yaml`), openapiStub({ ...ctx }))));
  res.createdFile(path.relative(root, writeNew(path.join(root, '.github/workflows', `services-${name}.yml`), workflowYml(lang, ctx))));
  if (exists(manifestPath)) {
    insertManifestService(manifestPath, {
      id: name,
      type: 'be',
      description: `${ctx.pascal} — generated by gen-service (${lang})${db !== 'none' ? `; db ${db}` : ''}.`,
      paths: [`services/${name}/**`],
      composeService: name,
      gatewayBlocks: [`location = /api/${name} → ${name}:${port}`, `location /api/${name}/ → ${name}:${port}`],
      envKeys:
        db === 'dedicated'
          ? [`${ctx.scream}_PORT`, `POSTGRES_${ctx.scream}_DB`, `POSTGRES_${ctx.scream}_USER`, `${ctx.scream}_DB_PASSWORD`]
          : db === 'shared'
            ? [`${ctx.scream}_PORT`, `${ctx.scream}_DB_PASSWORD`]
            : [`${ctx.scream}_PORT`],
      requires: db !== 'none' ? ['postgres'] : [],
      devLocal: false,
    });
    res.modifiedFile('app/stack-template/stack-manifest.json');
  }

  // --- next_steps: AI-actionable directives (verb-first + path + action) ---
  if (lang === 'ts') {
    res.next(
      'run: pnpm install  # refresh pnpm-lock.yaml importer services/' + name + ' — CI --frozen-lockfile needs the new lock',
      `run: cd services/${name} && pnpm install --ignore-workspace  # generate the standalone pnpm-lock.yaml (conventions/01 rule 7)`,
      `verify: pnpm --filter ${name} test  # convention + CRUD smoke PASS`,
    );
  } else if (lang === 'go') {
    res.next(
      `run: cd services/${name} && go mod tidy && go build ./...  # generate go.sum, build the scaffold`,
      `add: services/${name}/main_test.go — httptest health shape + 401 envelope (conventions/02+04); port the real CRUD from the TS template`,
    );
  } else {
    res.next(`verify: cd services/${name} && ./mvnw -B test  # HealthCheckTest smoke (needs the copied mvnw)`);
  }
  res.next(
    'run: pnpm lint:contracts  # spectral lint of contracts/openapi/' + name + '.yaml PASSes',
    `run: docker compose -f platform/docker-compose.yml --env-file platform/.env.example config -q  # compose VALID`,
    `edit: contracts/openapi/${name}.yaml — rename the default \`items\` resource to the real domain (contract-first) then pnpm --filter ${name} generate:types`,
    `edit: services/${name}/src/repo.ts + src/repo.pg.ts + src/routes/items.ts — rename fields/queries to the real domain (CRUD already works)`,
  );
  if (db === 'shared') {
    res.next(
      `db=shared chosen: one postgres, own schema ${ctx.snake} + role ${ctx.dbRole} (schema-per-service, 01-init.sh pattern)`,
      `apply: platform/postgres/init/02-${name}.sh runs on a FRESH volume; on an existing volume apply it manually (command in the script header)`,
      `note: after touching init scripts → docker compose down -v once to re-run init (CLAUDE.md gotchas)`,
    );
  } else if (db === 'dedicated') {
    res.next(
      `db=dedicated chosen: own DATABASE ${ctx.snake} + role ${ctx.dbRole} (env POSTGRES_${ctx.scream}_DB/_USER/_DB_PASSWORD already wired into compose + .env.example)`,
      `apply: platform/postgres/init/02-${name}.sh creates the DATABASE + role + table on a fresh volume; apply manually on an existing volume (command in the header)`,
      `note: after touching init scripts → docker compose down -v once to re-run init (CLAUDE.md gotchas)`,
    );
  } else {
    res.next('db=none chosen: the service runs on an in-memory repo — re-run with --db shared|dedicated (or wire PgItemsRepo) when a database is needed');
  }
  res.next(`verify: docker compose -f platform/docker-compose.yml --env-file platform/.env.example up -d ${db !== 'none' ? 'postgres ' : ''}${name} then curl localhost:${port}/readyz`);

  return res;
}

// --- CLI entry ---
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.length === 0) {
  process.stdout.write(HELP + '\n');
  process.exit(0);
}
try {
  const opts = parseAndValidate(argv);
  if (opts.help) {
    process.stdout.write(HELP + '\n');
    process.exit(0);
  }
  const result = await runGenService(opts);
  emit(result, { json: opts.json });
} catch (err) {
  emitError(err, { json: argv.includes('--json') });
  process.exit(1);
}
