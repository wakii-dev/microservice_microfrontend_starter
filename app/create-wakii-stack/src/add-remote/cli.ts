// cli — `create-wakii-stack add-remote <name> [dest] [--port N]` flow: parse a
// tiny dedicated argv (kept separate from the scaffold flags), confirm target,
// run addRemote(), print a summary + the manual next steps (route + nav item).
import * as p from '@clack/prompts';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { addRemote, removeRemoteDir } from './addRemote.js';
import { validateRemoteName } from './naming.js';

export interface AddRemoteCliArgs {
  name?: string;
  dest?: string;
  port?: number;
  help?: boolean;
}

export type AddRemoteParseResult =
  | { ok: true; args: AddRemoteCliArgs }
  | { ok: false; message: string };

/** Parse the add-remote subcommand argv (everything after `add-remote`). */
export function parseAddRemoteArgs(argv: readonly string[]): AddRemoteParseResult {
  const args: AddRemoteCliArgs = {};
  let positionals = 0;
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--port') {
      const value = argv[i + 1];
      i += 1;
      const port = Number(value);
      if (!value || !Number.isInteger(port)) {
        return { ok: false, message: '--port needs an integer: --port 4003' };
      }
      args.port = port;
    } else if (arg?.startsWith('--port=')) {
      const port = Number(arg.slice('--port='.length));
      if (!Number.isInteger(port)) return { ok: false, message: '--port needs an integer: --port 4003' };
      args.port = port;
    } else if (arg?.startsWith('--')) {
      return { ok: false, message: `Unsupported flag: ${arg} (see --help)` };
    } else if (arg !== undefined) {
      if (positionals === 0) args.name = arg;
      else if (positionals === 1) args.dest = arg;
      else return { ok: false, message: 'Too many positional arguments (expected: <name> [dest])' };
      positionals += 1;
    }
    i += 1;
  }
  return { ok: true, args };
}

const USAGE = `create-wakii-stack add-remote — add a new MF remote to a scaffolded stack

Usage: create-wakii-stack add-remote <name> [dest] [flags]

Arguments:
  <name>  Remote name, kebab-case (e.g. inventory) — MF name + app/remotes/<name>
  [dest]  Stack root (default: current directory)

Flags:
  --port <n>  Dev-server port (default: first free port >= 4003 per conventions/05)
  -h, --help  Print this help

The template \`tasks\` remote is cloned (page renamed to <Name>Page) and every
registration point is patched: docker-compose, nginx gateway map, Traefik
config, shell remote registry, platform/.env.example.
`;

/** Entry point for `add-remote …` — returns an exit code. */
export async function runAddRemoteCli(argv: readonly string[]): Promise<number> {
  const parsed = parseAddRemoteArgs(argv);
  if (!parsed.ok) {
    p.log.error(parsed.message);
    console.error(USAGE);
    return 1;
  }
  if (parsed.args.help) {
    console.log(USAGE);
    return 0;
  }

  p.intro('create-wakii-stack — add-remote');

  let name = parsed.args.name;
  if (!name) {
    const asked = await p.text({
      message: 'Remote name (kebab-case, e.g. inventory)',
      validate: (value) => validateRemoteName(value ?? '') ?? undefined,
    });
    if (p.isCancel(asked) || typeof asked !== 'string') {
      p.cancel('Cancelled — nothing was written.');
      return 0;
    }
    name = asked.trim();
  }
  const nameError = validateRemoteName(name);
  if (nameError) {
    p.log.error(nameError);
    return 1;
  }

  const dest = resolve(parsed.args.dest ?? process.cwd());
  const remoteDir = resolve(dest, 'app/remotes', name);
  // Rollback is only safe when the dir did not exist before — addRemote throws
  // "Remote already exists" for pre-existing dirs and those must stay untouched.
  const remoteDirForRollback = existsSync(remoteDir) ? null : remoteDir;

  const s = p.spinner();
  try {
    s.start(`Adding remote '${name}'…`);
    const result = await addRemote({
      name,
      dest,
      port: parsed.args.port,
      lockfileSync: true,
      log: (message) => s.message(message),
    });
    s.stop(`Remote '${name}' ready — port ${result.port}, ${result.files.length} files, ${result.patched.length} stack files patched`);

    for (const line of result.patched) p.log.step(`  patched: ${line}`);
    for (const line of result.skipped) p.log.warn(`  skipped: ${line}`);
    if (result.lockfile === 'pnpm') {
      p.log.info('pnpm-lock.yaml regenerated (pnpm install --lockfile-only).');
    } else if (result.lockfile === 'unfrozen') {
      p.log.warn('pnpm unavailable — removed --frozen-lockfile from Dockerfiles instead. Run `pnpm install` at the stack root.');
    } else if (result.lockfile === 'skipped') {
      p.log.warn('pnpm-lock.yaml NOT regenerated — run `pnpm install` at the stack root before docker build.');
    }

    p.log.info('Manual steps to show the remote in the shell UI (details in the remote README):');
    p.log.step(`  1. app/shell/src/App.tsx — add a <RemoteSlot name="${name}" exposedModule="./${result.names.pageComponent}" /> route`);
    p.log.step('  2. app/shell/src/components/NavBar.tsx — add the nav link');
    p.log.info(`Registry contract: platform/conventions/08-gateway-and-remotes.md`);
    p.outro(`Dev run: pnpm --filter @wakii/remote-${name} dev  (http://localhost:${result.port})`);
    return 0;
  } catch (err) {
    s.stop('add-remote failed');
    p.log.error(err instanceof Error ? err.message : String(err));
    if (remoteDirForRollback) {
      await removeRemoteDir(remoteDirForRollback);
      p.log.warn(`Rolled back the partially written ${remoteDirForRollback}`);
    }
    return 1;
  }
}
