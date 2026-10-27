// naming.mjs — name validation + transformations for scripts/generators.
// Names are kebab-case (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`) and are used as: service/app
// directory, compose key, MF remote name, API prefix /api/<name>. RESERVED = names
// already owned by the boilerplate (platform/conventions/05-ports.md) — generating a
// duplicate would overwrite existing components.

/** Names already taken by existing services/apps — the generator refuses them. */
export const RESERVED_NAMES = new Set([
  'postgres',
  'kafka',
  'gateway',
  'shell',
  'node-svc',
  'spring-svc',
  'go-svc',
  'auth-svc',
  'remote-tasks',
  'remote-activity',
  'admin',
  'shared',
  'ui-kit',
  'spike',
  'contracts',
  'platform',
  'scripts',
  'docs',
]);

export function isValidName(name) {
  return typeof name === 'string' && /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/** Validate a kebab name — throws with a clear message (CLI prints it to stderr). */
export function requireValidName(name, kind = 'name') {
  if (!isValidName(name)) {
    throw new Error(
      `${kind} is invalid: "${name}" — must be kebab-case ([a-z0-9-], starts with a letter), e.g. notification-svc`,
    );
  }
  if (RESERVED_NAMES.has(name)) {
    throw new Error(`${kind} "${name}" collides with an existing boilerplate component — pick another name`);
  }
  if (name.length > 40) {
    throw new Error(`${kind} is too long (>${40} chars): "${name}"`);
  }
  return name;
}

/** notification-svc → NOTIFICATION_SVC (env var prefix, conventions/06). */
export function screaming(name) {
  return name.replace(/-/g, '_').toUpperCase();
}

/** notification-svc → notification_svc (snake_case). */
export function snake(name) {
  return name.replace(/-/g, '_').toLowerCase();
}

/** DB role: name ending in svc keeps its snake form (node-svc→node_svc); otherwise append _svc (billing→billing_svc). */
export function dbRole(name) {
  return name.endsWith('svc') ? snake(name) : `${snake(name)}_svc`;
}

/** notification-svc → NotificationSvc (class/component/Page name). */
export function pascal(name) {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/** notification-svc → notificationSvc (camelCase variable name). */
export function camel(name) {
  const p = pascal(name);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

/** Parse `--flag value` / `--flag=value` out of argv. Returns { flags, positionals }. */
export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      positionals.push(a);
      continue;
    }
    const eq = a.indexOf('=');
    if (eq !== -1) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags[a.slice(2)] = next;
      i++;
    } else {
      flags[a.slice(2)] = true;
    }
  }
  return { flags, positionals };
}
