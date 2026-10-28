// patches — in-place text edits registering the new remote across the stack.
// All functions are pure string → string so they unit-test without fixtures;
// a missing anchor returns the text unchanged (the caller detects "no change"
// and surfaces a warning instead of corrupting a drifted stack file).
// Anchor targets mirror the `tasks`/`activity` registrations exactly:
//   1. platform/docker-compose.yml          — service block
//   2. platform/gateway/nginx/nginx.conf    — $remote_up map entry
//   3. platform/gateway-traefik/traefik-dynamic.yml — router+service+strip
//   4. app/shell remote registry            — remote-urls.ts, env.d.ts,
//      rspack.config.mjs (remotes + DefinePlugin), vitest.config.ts stub
//   5. platform/.env.example                — port + URL + CORS dev origin
import type { RemoteNames } from './naming.js';

/** Insert `block` before the first line equal to `anchor` (keeps the anchor). */
function insertBeforeLine(text: string, anchor: string, block: string): string {
  const idx = text.indexOf(anchor);
  if (idx === -1) return text;
  return text.slice(0, idx) + block + text.slice(idx);
}

/** Insert `block` before the line matched by `lineRe` (regex may not be global). */
function insertBeforeLineRe(text: string, lineRe: RegExp, block: string): string {
  const match = lineRe.exec(text);
  if (!match) return text;
  const at = match.index + (match[1]?.length ?? 0);
  return text.slice(0, at) + block + text.slice(at);
}

/** Insert `block` right after the first line starting with `lineStart`. */
function insertAfterLineStart(text: string, lineStart: string, block: string): string {
  const idx = text.indexOf(lineStart);
  if (idx === -1) return text;
  const lineEnd = text.indexOf('\n', idx);
  const at = lineEnd === -1 ? text.length : lineEnd + 1;
  return text.slice(0, at) + block + text.slice(at);
}

/** Insert `block` before the first occurrence of a literal anchor. */
function insertBeforeLiteral(text: string, anchor: string, block: string): string {
  const idx = text.indexOf(anchor);
  if (idx === -1) return text;
  return text.slice(0, idx) + block + text.slice(idx);
}

/**
 * Compose service for the new remote — same shape as the template `remote-tasks`
 * block: repo-root build context, fixed container port, remoteEntry healthcheck.
 * Inserted before the TOP-LEVEL `volumes:` key (column 0 — a plain substring
 * match would also hit the nested `    volumes:` key inside the postgres
 * service and nest the new block under it); appended at EOF as a fallback.
 */
export function patchCompose(compose: string, names: RemoteNames, port: number): string {
  const block = [
    `  remote-${names.name}:`,
    `    build:`,
    `      context: .. # repo root — Dockerfile needs app/shared + workspace lockfile`,
    `      dockerfile: app/remotes/${names.name}/Dockerfile`,
    `    ports:`,
    `      - "\${${names.envPort}:-${port}}:${port}" # fixed container port (conventions/05)`,
    `    healthcheck:`,
    `      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:${port}/remoteEntry.js"]`,
    `      interval: 5s`,
    `      timeout: 3s`,
    `      retries: 12`,
    ``,
    ``,
  ].join('\n');
  const next = insertBeforeLineRe(compose, /(^|\n)volumes:\n/, block);
  if (next !== compose) return next;
  // no volumes section (e.g. postgres pruned) — append at the end
  const nl = compose.endsWith('\n') ? '' : '\n';
  return `${compose}${nl}\n${block.trimEnd()}\n`;
}

/**
 * nginx gateway registry entry — added to `map $uri $remote_up` BEFORE the
 * `default` fallback (map semantics: first matching regex wins, but placement
 * before default keeps the remote registry readable as a table). The opening
 * quote is column-aligned with the existing `~^/remotes/...` entries.
 */
export function patchNginxGateway(conf: string, names: RemoteNames, port: number): string {
  const key = `~^/remotes/${names.name}/`;
  const upstream = `"http://remote-${names.name}:${port}"`;
  // align with existing map entries: max end-column of the key part
  let quoteCol = 0;
  for (const match of conf.matchAll(/^[ \t]+~\^\/remotes\/[^\s"]+/gm)) {
    quoteCol = Math.max(quoteCol, match[0].length);
  }
  const pad = ' '.repeat(Math.max(1, quoteCol - (8 + key.length)));
  const line = `        ${key}${pad}${upstream};\n`;
  // anchor the `default` line INSIDE the map block — a bare "default" indexOf
  // would hit `default_type application/octet-stream;` higher up in the file
  const next = insertBeforeLineRe(conf, /(^|\n)[ \t]+default[ \t]+"http:\/\/shell:3000";/, line);
  return next === conf ? conf : next;
}

/** Traefik parity: strip middleware + router + loadBalancer service. */
export function patchTraefik(text: string, names: RemoteNames, port: number): string {
  let out = text;
  // middleware — at the end of the middlewares block (right before `routers:`,
  // keeping the blank-line separator the template uses before top-level keys)
  out = insertBeforeLine(
    out,
    '  routers:\n',
    `    strip-remotes-${names.name}:\n      stripPrefix:\n        prefixes: ["/remotes/${names.name}"]\n\n`,
  );
  // router — grouped with the other remotes, right before the catch-all shell router
  out = insertBeforeLiteral(
    out,
    '    shell:\n      rule: "PathPrefix(`/`)"',
    [
      `    remotes-${names.name}:`,
      `      rule: "PathPrefix(\`/remotes/${names.name}\`)"`,
      `      service: remote-${names.name}`,
      `      middlewares: [body-limit-2m, strip-remotes-${names.name}]`,
      `      priority: 50`,
    ].join('\n') + '\n',
  );
  // service — before the shell service entry (keeps shell last, like the template)
  out = insertBeforeLiteral(
    out,
    '    shell:\n      loadBalancer:',
    [
      `    remote-${names.name}:`,
      `      loadBalancer:`,
      `        servers: [{ url: "http://remote-${names.name}:${port}" }]`,
    ].join('\n') + '\n',
  );
  return out;
}

/** Shell remote registry (`registerBuildtimeRemoteUrls` map). */
export function patchShellRemoteUrls(text: string, names: RemoteNames): string {
  return insertAfterLineStart(
    text,
    '    activity: __REMOTE_ACTIVITY_URL__,',
    `    ${names.name}: __${names.envUrl}__,\n`,
  );
}

/** Build-time global declarations for the shell typecheck. */
export function patchShellEnvTypes(text: string, names: RemoteNames): string {
  const anchor = 'declare const __REMOTE_ACTIVITY_URL__: string;';
  const idx = text.indexOf(anchor);
  if (idx === -1) return text;
  const at = idx + anchor.length;
  return `${text.slice(0, at)}\ndeclare const __${names.envUrl}__: string;${text.slice(at)}`;
}

/**
 * Shell rspack config — three synchronized edits so the URL has one source of
 * truth, mirroring tasks/activity: the `remote<Name>Url` const, the DefinePlugin
 * entry (missing define = runtime ReferenceError in the built shell) and the MF
 * `remotes` map entry.
 */
export function patchShellRspack(text: string, names: RemoteNames): string {
  let out = text;
  out = insertAfterLineStart(
    out,
    "const remoteActivityUrl = process.env.REMOTE_ACTIVITY_URL || '/remotes/activity/remoteEntry.js';",
    `const remote${names.pascal}Url = process.env.${names.envUrl} || '/remotes/${names.name}/remoteEntry.js';\n`,
  );
  out = insertAfterLineStart(
    out,
    '      __REMOTE_ACTIVITY_URL__: JSON.stringify(remoteActivityUrl),',
    `      __${names.envUrl}__: JSON.stringify(remote${names.pascal}Url),\n`,
  );
  out = insertAfterLineStart(
    out,
    '        activity: `activity@${remoteActivityUrl}`,',
    `        ${names.name}: \`${names.name}@\${remote${names.pascal}Url}\`,\n`,
  );
  return out;
}

/** Shell vitest stub for the build-time define (remote-urls.test reads it). */
export function patchShellVitest(text: string, names: RemoteNames, port: number): string {
  return insertAfterLineStart(
    text,
    `    __REMOTE_ACTIVITY_URL__: "'http://buildtime:4002/remoteEntry.js'",`,
    `    __${names.envUrl}__: "'http://buildtime:${port}/remoteEntry.js'",\n`,
  );
}

/**
 * platform/.env.example — conventions/05 rule 4 (a new port ships with its env
 * entries): port line in the ports block, inter-service URL line, and the dev
 * origin appended to CORS_DEV_ORIGIN (native dev: the remote origin calls
 * node-svc directly — conventions/07).
 */
export function patchEnvExample(env: string, names: RemoteNames, port: number): string {
  let out = env;
  const portAnchor =
    findLineStart(out, 'REMOTE_ACTIVITY_PORT=') ?? findLineStart(out, 'REMOTE_TASKS_PORT=');
  if (portAnchor) out = insertAfterLineStart(out, portAnchor, `${names.envPort}=${port}\n`);
  const urlAnchor =
    findLineStart(out, 'REMOTE_ACTIVITY_URL=') ?? findLineStart(out, 'REMOTE_TASKS_URL=');
  if (urlAnchor) {
    out = insertAfterLineStart(out, urlAnchor, `${names.envUrl}=http://remote-${names.name}:${port}\n`);
  }
  const cors = findLineStart(out, 'CORS_DEV_ORIGIN=');
  if (cors && !cors.includes(`:${port}`)) {
    out = out.replace(`${cors}\n`, `${cors},http://localhost:${port}\n`);
  }
  return out;
}

/** Whole line beginning with `prefix` (including the trailing newline-less tail). */
function findLineStart(text: string, prefix: string): string | undefined {
  const idx = text.indexOf(prefix);
  if (idx === -1) return undefined;
  const lineEnd = text.indexOf('\n', idx);
  return lineEnd === -1 ? text.slice(idx) : text.slice(idx, lineEnd);
}

/**
 * Section appended to the copied remote README — what was patched automatically
 * and the two manual steps (route + nav item) that make the remote visible in
 * the shell UI, pointing at the conventions/08 registry contract.
 */
export function wireIntoShellSection(names: RemoteNames, port: number): string {
  return `

## Wired into the stack by \`create-wakii-stack add-remote\`

Generated into an existing stack — these registration points were patched automatically:

- \`platform/docker-compose.yml\` — service \`remote-${names.name}\` (port ${port})
- \`platform/gateway/nginx/nginx.conf\` — \`$remote_up\` map entry for \`/remotes/${names.name}/\`
- \`platform/gateway-traefik/traefik-dynamic.yml\` — router + service + strip-prefix middleware
- \`app/shell\` — remote registry (\`remote-urls.ts\`, \`env.d.ts\`, \`rspack.config.mjs\` remotes + DefinePlugin, \`vitest.config.ts\` stub)

### Make it visible in the shell UI (manual)

1. \`app/shell/src/App.tsx\` — add a route like the \`tasks\` one:
   \`<Route path="/${names.name}" element={<RequireAuth><RemoteSlot name="${names.name}" exposedModule="${names.exposeKey}" /></RequireAuth>} />\`
2. \`app/shell/src/components/NavBar.tsx\` — add the nav link to \`/${names.name}\`.

Registry rules (remote name + expose key are a contract): \`platform/conventions/08-gateway-and-remotes.md\`.

### Before first build

Run \`pnpm install\` at the stack root once so \`pnpm-lock.yaml\` gains the \`app/remotes/${names.name}\` importer — docker builds use \`--frozen-lockfile\` and fail without it (the CLI does this automatically when pnpm is available).

### Native dev (outside compose)

\`\`\`bash
pnpm --filter ${names.pkgName} dev   # http://localhost:${port}
# boot the shell against it:
REMOTE_${names.upper}_URL=http://localhost:${port}/remoteEntry.js pnpm --filter @wakii/shell dev
\`\`\`

> The page is a clone of the \`tasks\` board (same \`/api/tasks\` backend, \`tsk-*\` scoped CSS
> classes). Adapt page + API to your domain and rename the \`tsk-\` class prefix before
> loading this remote side-by-side with \`tasks\` in the shell (in-shell both style
> bundles share one document).
`;
}
