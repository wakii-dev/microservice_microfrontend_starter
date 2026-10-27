#!/usr/bin/env node
// gen-app.mjs — `pnpm gen:app <name> [--remote] [--port N]`
// Non-remote: a Vite TS SPA + @wakii/ui-kit + Layout kit + dark toggle (the app/admin
// pattern) — dev-only, compose/nginx untouched.
// --remote: an MF Rspack remote (the app/remotes/tasks pattern) + a compose static
// entry (next free port 4003+) + the gateway /remotes/<name>/ map line + REMOTE_* env —
// the shell slot stays a TODO directive (the shell is never auto-edited).
// Output contract for AI: --json → {created, removed, modified, next_steps}.
import fs from 'node:fs';
import path from 'node:path';
import { composeHasService, insertComposeService, pickFreePort, usedHostPorts } from './lib/compose-yaml.mjs';
import { appendPortsTableRow } from './lib/docinsert.mjs';
import { appendEnvSection } from './lib/envfile.mjs';
import { exists, isDir, readText, writeNew, writeText } from './lib/io.mjs';
import { insertRemoteMapLine } from './lib/nginx.mjs';
import { camel, parseArgs, pascal, requireValidName, screaming } from './lib/naming.mjs';
import { emit, emitError, helpText, GenResult } from './lib/result.mjs';
import { appRemoteFiles } from './tpl/app-remote.mjs';
import { appSpaFiles } from './tpl/app-spa.mjs';

const HELP = helpText({
  usage: 'usage: pnpm gen:app <name> [--remote] [--port N] [--root <dir>] [--json] [--help]',
  summary:
    'Generate a new FE app: a Vite TS SPA + @wakii/ui-kit (Layout kit + dark toggle, the app/admin pattern).' +
    ' --remote generates an MF Rspack remote (the app/remotes/tasks pattern) + compose static entry + gateway /remotes/<name>/ + .env wiring.',
  flags: [
    '<name>          kebab-case, e.g. reports (required, first positional)',
    '--remote        generate an MF remote at app/remotes/<name> (default: SPA at app/<name>, dev-only)',
    '--port N        port. SPA dev: next free 5174+. Remote: next free 4003+ in compose',
    '--root <dir>    repo root (default: cwd)',
    '--json          output JSON {created, removed, modified, next_steps} — AI contract',
    '--help          this page',
  ],
  examples: ['pnpm gen:app reports', 'pnpm gen:app invoices --remote', 'pnpm gen:app dashboard --remote --port 4010'],
  refs: [
    'platform/conventions/05-ports.md (FE remote 40xx) · 08-gateway-and-remotes.md (remote registry + map)',
    'docs/adr/0002 (MF) · docs/adr/0009 (ui-kit) — READ-LOCKED pins: react/rspack upgrades require a re-spike',
  ],
});

export function parseAndValidate(argv) {
  const { flags, positionals } = parseArgs(argv);
  const name = positionals[0];
  if (!name || flags.help) return { help: true };
  requireValidName(name, 'app name');
  if (name.startsWith('remote-')) throw new Error('app names must not start with "remote-" — compose adds the remote- prefix itself');
  const port = flags.port == null ? null : Number(flags.port);
  if (flags.port != null && (!Number.isInteger(port) || port <= 1024 || port >= 65536)) {
    throw new Error(`--port is invalid: ${flags.port}`);
  }
  return {
    help: false,
    name,
    remote: flags.remote === true,
    port,
    root: flags.root ?? process.cwd(),
    json: flags.json === true,
  };
}

/** SPA dev ports — scans the `scripts.dev --port N` of existing app/* packages. */
export function usedSpaDevPorts(root) {
  const ports = new Set([5173]); // 5173 = admin already owns it
  const appsDir = path.join(root, 'app');
  if (!isDir(appsDir)) return ports;
  for (const d of fs.readdirSync(appsDir)) {
    const pkgPath = path.join(appsDir, d, 'package.json');
    if (!exists(pkgPath)) continue;
    try {
      const dev = JSON.parse(readText(pkgPath)).scripts?.dev ?? '';
      const m = dev.match(/--port (\d+)/);
      if (m) ports.add(Number(m[1]));
    } catch {
      // odd package.json — skip, never block the generator
    }
  }
  return ports;
}

export function runGenApp(opts) {
  const { name, remote } = opts;
  const root = opts.root;
  const res = new GenResult();
  const composePath = path.join(root, 'platform/docker-compose.yml');
  const nginxPath = path.join(root, 'platform/gateway/nginx/nginx.conf');
  const envPath = path.join(root, 'platform/.env.example');
  const portsDocPath = path.join(root, 'platform/conventions/05-ports.md');

  const dir = remote ? path.join(root, 'app/remotes', name) : path.join(root, 'app', name);
  if (isDir(dir)) throw new Error(`${path.relative(root, dir)} already exists — idempotent-guard`);

  const ctx = { name, camel: camel(name), pascal: pascal(name), scream: screaming(name), port: opts.port ?? 0, date: new Date().toISOString().slice(0, 10) };
  let files = remote ? appRemoteFiles(ctx) : appSpaFiles(ctx);

  let newCompose = null;
  let newNginx = null;
  let envRes = null;
  let newPortsDoc = null;

  if (remote) {
    for (const p of [composePath, nginxPath, envPath]) {
      if (!exists(p)) throw new Error(`not the boilerplate repo — missing ${path.relative(root, p)} (run from the repo root or pass --root)`);
    }
    const composeText = readText(composePath);
    const svcName = `remote-${name}`;
    if (composeHasService(composeText, svcName)) throw new Error(`compose already has service "${svcName}"`);
    const used = usedHostPorts(composeText);
    if (ctx.port === 0) ctx.port = pickFreePort(used, 4003, 4199);
    else if (used.has(ctx.port)) throw new Error(`port ${ctx.port} is already used in compose — pick a free one (conventions/05)`);
    files = appRemoteFiles(ctx); // regenerate with the resolved port (templates embed it)

    // house-style block (the remote-tasks pattern) — text splice, lossless round-trip
    const remoteBlock =
      `  # gen:app --remote ${ctx.date} — MF remote static (conventions/05+08; remote-tasks pattern)
  ${svcName}:
    build:
      context: .. # repo root — Dockerfile needs app/shared + workspace lockfile
      dockerfile: app/remotes/${name}/Dockerfile
    ports:
      - "\${REMOTE_${ctx.scream}_PORT:-${ctx.port}}:${ctx.port}" # container port fixed at ${ctx.port} (conventions/05)
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:${ctx.port}/remoteEntry.js"]
      interval: 5s
      timeout: 3s
      retries: 12
`;
    newCompose = insertComposeService(composeText, svcName, remoteBlock);
    // NO gateway depends_on entry — parity with remote-tasks/remote-activity (static FE;
    // the gateway 502s until it exists, conventions/08; the healthcheck serves `compose ps`).

    const nginxText = readText(nginxPath);
    newNginx = insertRemoteMapLine(nginxText, name, ctx.port);
    if (!newNginx) {
      throw new Error(`nginx.conf has no $remote_up map anchor — add the /remotes/${name}/ map line manually per conventions/08`);
    }

    envRes = appendEnvSection(envPath, {
      header: `gen: remote ${name}`,
      vars: [
        { key: `REMOTE_${ctx.scream}_PORT`, value: String(ctx.port), comment: `host-side port — container fixed at ${ctx.port} (conventions/05)` },
        { key: `REMOTE_${ctx.scream}_URL`, value: `http://remote-${name}:${ctx.port}`, comment: 'URL inside the compose network (shell MF registry — conventions/08)' },
      ],
    });
    if (exists(portsDocPath)) {
      newPortsDoc = appendPortsTableRow(
        readText(portsDocPath),
        `\`remote ${name}\` (FE)`,
        ctx.port,
        `dev server; gateway \`/remotes/${name}/\``,
      );
    }
  } else {
    if (ctx.port === 0) ctx.port = pickFreePort(usedSpaDevPorts(root), 5174, 5199);
    files = appSpaFiles(ctx);
  }

  // --- WRITE ---
  for (const [rel, content] of Object.entries(files)) {
    res.createdFile(path.relative(root, writeNew(path.join(dir, rel), content)));
  }
  if (remote) {
    writeText(composePath, newCompose);
    res.modifiedFile('platform/docker-compose.yml');
    writeText(nginxPath, newNginx.text);
    res.modifiedFile('platform/gateway/nginx/nginx.conf');
    if (newNginx.created) res.next('review: nginx.conf got the GEN:remotes markers inside the $remote_up map — later gen runs insert inside that region');
    if (envRes.added.length > 0) res.modifiedFile('platform/.env.example');
    if (newPortsDoc != null) {
      writeText(portsDocPath, newPortsDoc);
      res.modifiedFile('platform/conventions/05-ports.md');
    } else {
      res.next(`edit: platform/conventions/05-ports.md — add the remote ${name} = ${ctx.port} row (old anchor not found)`);
    }
    res.next(
      'run: pnpm install  # refresh pnpm-lock.yaml with the app/remotes/' + name + ' importer — the Dockerfile frozen-lockfile needs it',
      `verify: pnpm --filter @wakii/remote-${name} test && pnpm --filter @wakii/remote-${name} typecheck`,
      `verify: pnpm --filter @wakii/remote-${name} build  # rspack build PASS (2 entries: index + standalone)`,
      `edit: app/shell — add the remote slot: Route path "/${name}" + RemoteSlot name="${name}" exposedModule="./${ctx.pascal}Page" + NavBar item (registry conventions/08; the shell MF bootstrap is READ-LOCKED — only touch slots/routes)`,
      `edit: platform/.env.example CORS_DEV_ORIGIN — add http://localhost:${ctx.port} if the FE dev calls APIs directly (conventions/07)`,
      'note: the Dockerfile at app/remotes/' + name + ' COPYs every importer — extend it manually when the repo gains new packages',
    );
  } else {
    res.next(
      'run: pnpm install  # new workspace deps (workspace:* + catalog:)',
      `verify: pnpm --filter ${name} test && pnpm --filter ${name} typecheck`,
      `verify: pnpm --filter ${name} dev  # http://localhost:${ctx.port} — dark toggle + Layout kit`,
      'add: new pages with pnpm gen:feature <name> --app ' + name + ' (inserts the route at the GEN:routes marker)',
    );
  }
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
  emit(runGenApp(opts), { json: opts.json });
} catch (err) {
  emitError(err, { json: argv.includes('--json') });
  process.exit(1);
}
