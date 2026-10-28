// addRemote — generate a new MF remote into an ALREADY-scaffolded stack by
// cloning the template `tasks` remote (stack-template/app/remotes/tasks) and
// patching every registration point the way `tasks`/`activity` are wired:
// compose service, nginx gateway map, Traefik parity config, shell remote
// registry (remote-urls/env.d.ts/rspack/vitest) and platform/.env.example.
// File layout mirrors scaffold.ts: engine here, prompts in cli.ts.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DEFAULT_TEMPLATE_ROOT, syncLockfile, type LockfileSyncMode } from '../scaffold.js';
import { remoteNames, validateRemoteName, type RemoteNames } from './naming.js';
import { assertPortFree, nextFreePort } from './ports.js';
import { renamedFilePath, renameRemoteContent, rewriteRegistryDep } from './renames.js';
import {
  patchCompose,
  patchEnvExample,
  patchNginxGateway,
  patchShellEnvTypes,
  patchShellRemoteUrls,
  patchShellRspack,
  patchShellVitest,
  patchTraefik,
  wireIntoShellSection,
} from './patches.js';

export interface AddRemoteInput {
  /** Remote name (kebab-case) — MF name + `app/remotes/<name>` dir. */
  name: string;
  /** Stack root (scaffolded dest). Defaults to cwd in the CLI. */
  dest: string;
  /** Dev-server port. Omit to auto-pick the first free port ≥ 4003 (conventions/05 band). */
  port?: number;
  /** Template source root (owns app/remotes/tasks). Defaults to the bundled template. */
  templateRoot?: string;
  /** Regenerate pnpm-lock.yaml after adding the workspace importer (CLI: true). */
  lockfileSync?: boolean;
  log?: (message: string) => void;
}

export interface AddRemoteResult {
  names: RemoteNames;
  port: number;
  /** Relative paths of files written under the new remote dir. */
  files: string[];
  /** Stack files patched in place (absolute). */
  patched: string[];
  /** Stack-level patches skipped because their anchor/file was absent. */
  skipped: string[];
  lockfile: LockfileSyncMode | 'no-lockfile';
}

const TEMPLATE_REMOTE_DIR = 'app/remotes/tasks';
/** Artifact dirs that must never leak from a dev-machine template snapshot. */
const SKIP_DIRS = new Set(['node_modules', '.git']);
const SKIP_FILES = new Set(['.DS_Store']);

async function copyRenamedTree(
  srcDir: string,
  destDir: string,
  names: RemoteNames,
  port: number,
  files: string[],
  /** Path relative to the remote root — drives whole-file renames. */
  relDir = '',
): Promise<void> {
  await mkdir(destDir, { recursive: true });
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    if (SKIP_FILES.has(entry.name) || SKIP_DIRS.has(entry.name) || entry.isSymbolicLink()) continue;
    const srcPath = join(srcDir, entry.name);
    const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await copyRenamedTree(srcPath, join(destDir, entry.name), names, port, files, relPath);
      continue;
    }
    const destName = renamedFilePath(relPath, names).split('/').pop() ?? entry.name;
    const destPath = join(destDir, destName);
    const buffer = await readFile(srcPath);
    if (buffer.includes(0)) {
      await writeFile(destPath, buffer); // binary — copy byte-for-byte
    } else {
      let text = renameRemoteContent(buffer.toString('utf8'), names, port);
      if (entry.name === 'package.json') text = rewriteRegistryDep(text);
      await writeFile(destPath, text);
    }
    files.push(destPath);
  }
}

/** Read a text file or null when absent; throws on unreadable existing files. */
async function readTextOrNull(path: string): Promise<string | null> {
  if (!existsSync(path)) return null;
  return readFile(path, 'utf8');
}

/** Apply one patcher, writing back only when the text changed. */
async function applyPatch(
  path: string,
  patch: (text: string) => string,
  label: string,
  patched: string[],
  skipped: string[],
  log?: (message: string) => void,
): Promise<void> {
  const before = await readTextOrNull(path);
  if (before === null) {
    skipped.push(label);
    log?.(`skip (file not found): ${label}`);
    return;
  }
  const after = patch(before);
  if (after === before) {
    skipped.push(label);
    log?.(`skip (anchor not found — file may have drifted): ${label}`);
    return;
  }
  await writeFile(path, after);
  patched.push(label);
  log?.(`patched: ${label}`);
}

/**
 * Clone the template `tasks` remote into `<dest>/app/remotes/<name>` and wire
 * it into the stack. Throws (before touching anything) on invalid name,
 * missing/foreign dest, existing remote dir, or a colliding explicit port.
 */
export async function addRemote(input: AddRemoteInput): Promise<AddRemoteResult> {
  const { dest, log } = input;
  const nameError = validateRemoteName(input.name);
  if (nameError) throw new Error(nameError);
  const names = remoteNames(input.name);

  const templateRoot = input.templateRoot ?? DEFAULT_TEMPLATE_ROOT;
  const templateRemote = join(templateRoot, TEMPLATE_REMOTE_DIR);
  if (!existsSync(templateRemote)) {
    throw new Error(`Template remote not found: ${templateRemote} (expected the bundled stack-template)`);
  }
  if (!existsSync(dirname(dirname(templateRemote)))) {
    // guard: templateRoot must contain app/remotes — catches fixture misuse early
    throw new Error(`templateRoot does not look like a stack template: ${templateRoot}`);
  }

  const composePath = join(dest, 'platform/docker-compose.yml');
  if (!existsSync(composePath)) {
    throw new Error(
      `Not a scaffolded stack (missing ${composePath}) — run this inside a stack generated by create-wakii-stack`,
    );
  }
  const remoteDir = join(dest, 'app/remotes', names.name);
  if (existsSync(remoteDir)) {
    throw new Error(`Remote already exists: ${remoteDir}`);
  }

  const compose = await readFile(composePath, 'utf8');
  const port = input.port ?? nextFreePort(compose);
  if (input.port !== undefined) assertPortFree(input.port, compose);

  const files: string[] = [];
  const patched: string[] = [];
  const skipped: string[] = [];
  const rel = (p: string) => p.slice(dest.length + 1);

  log?.(`copy ${TEMPLATE_REMOTE_DIR} → app/remotes/${names.name} (port ${port})`);
  await copyRenamedTree(templateRemote, remoteDir, names, port, files);

  await applyPatch(
    composePath,
    (text) => patchCompose(text, names, port),
    'platform/docker-compose.yml',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'platform/gateway/nginx/nginx.conf'),
    (text) => patchNginxGateway(text, names, port),
    'platform/gateway/nginx/nginx.conf ($remote_up map)',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'platform/gateway-traefik/traefik-dynamic.yml'),
    (text) => patchTraefik(text, names, port),
    'platform/gateway-traefik/traefik-dynamic.yml',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'app/shell/src/remote-urls.ts'),
    (text) => patchShellRemoteUrls(text, names),
    'app/shell/src/remote-urls.ts',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'app/shell/src/env.d.ts'),
    (text) => patchShellEnvTypes(text, names),
    'app/shell/src/env.d.ts',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'app/shell/rspack.config.mjs'),
    (text) => patchShellRspack(text, names),
    'app/shell/rspack.config.mjs (remotes + DefinePlugin)',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'app/shell/vitest.config.ts'),
    (text) => patchShellVitest(text, names, port),
    'app/shell/vitest.config.ts (build-time define stub)',
    patched,
    skipped,
    log,
  );
  await applyPatch(
    join(dest, 'platform/.env.example'),
    (text) => patchEnvExample(text, names, port),
    'platform/.env.example',
    patched,
    skipped,
    log,
  );

  // next-steps appendix on the copied README (manual route + nav registration)
  const readmePath = join(remoteDir, 'README.md');
  const readme = await readTextOrNull(readmePath);
  if (readme !== null) {
    await writeFile(readmePath, readme + wireIntoShellSection(names, port));
  }

  // the new workspace importer must be in pnpm-lock.yaml before docker build
  // (--frozen-lockfile) — same regeneration path the scaffold uses
  let lockfile: AddRemoteResult['lockfile'] = 'no-lockfile';
  if (existsSync(join(dest, 'pnpm-lock.yaml'))) {
    lockfile = input.lockfileSync ? await syncLockfile(dest, log) : 'skipped';
  }

  log?.(`done: ${files.length} files in app/remotes/${names.name}, ${patched.length} stack files patched`);
  return {
    names,
    port,
    files: files.map(rel),
    patched,
    skipped,
    lockfile,
  };
}

/** Best-effort rollback — used by the CLI when a patch step throws mid-flight. */
export async function removeRemoteDir(remoteDir: string): Promise<void> {
  if (existsSync(remoteDir)) await rm(remoteDir, { recursive: true, force: true });
}
