// naming.mjs — validate + biến đổi tên cho scripts/generators.
// Tên kebab-case (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`) — dùng làm: thư mục service/app,
// key compose, remote MF name, prefix API /api/<name>. RESERVED = các thành phần
// đã tồn tại của boilerplate (platform/conventions/05-ports.md) — sinh trùng = đè nhau.

/** Tên đã bị services/app có sẵn chiếm — generator từ chối để tránh đè. */
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

/** Validate tên kebab — throw với message rõ (CLI in thẳng stderr). */
export function requireValidName(name, kind = 'tên') {
  if (!isValidName(name)) {
    throw new Error(
      `${kind} không hợp lệ: "${name}" — phải kebab-case ([a-z0-9-], bắt đầu bằng chữ), vd: notification-svc`,
    );
  }
  if (RESERVED_NAMES.has(name)) {
    throw new Error(`${kind} "${name}" trùng thành phần có sẵn của boilerplate — chọn tên khác`);
  }
  if (name.length > 40) {
    throw new Error(`${kind} quá dài (>${40} ký tự): "${name}"`);
  }
  return name;
}

/** notification-svc → NOTIFICATION_SVC (env var prefix, conventions/06). */
export function screaming(name) {
  return name.replace(/-/g, '_').toUpperCase();
}

/** notification-svc → notification_svc (tên DB role/username — pattern node_svc). */
export function snake(name) {
  return name.replace(/-/g, '_').toLowerCase();
}

/** DB role: name có đuôi svc → nguyên snake (node-svc→node_svc); không → thêm _svc (billing→billing_svc). */
export function dbRole(name) {
  return name.endsWith('svc') ? snake(name) : `${snake(name)}_svc`;
}

/** notification-svc → NotificationSvc (tên class/component/Page). */
export function pascal(name) {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

/** notification-svc → notificationSvc (tên biến camelCase). */
export function camel(name) {
  const p = pascal(name);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

/** Parse `--flag value` / `--flag=value` khỏi argv. Trả { flags, positionals }. */
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
