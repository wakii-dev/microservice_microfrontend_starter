// options — parse argv tự viết (mirror create-wakii-app): positional appName
// (tên hoặc path — basename rule) + --services list + --all + --yes/--skip-install/-h.
// resolveOptions áp RULES TẦNG 1 theo manifest layer: BE ⇒ infra+gateway+auth,
// FE ⇒ gateway, rỗng ⇒ lỗi.
export type StackLayer = 'core' | 'infra' | 'be' | 'fe';

export interface CliOptions {
  appName?: string;
  /** --services a,b — undefined = chưa chỉ định (prompt; --all thì all). */
  services?: string[];
  all: boolean;
  yes: boolean;
  skipInstall: boolean;
  help?: boolean;
}

export type ParseResult = { ok: true; options: CliOptions } | { ok: false; message: string };

/** Lựa chọn hoàn chỉnh sau rules tầng 1 — đầu vào scaffold(). */
export interface StackSelection {
  appName: string;
  services: string[];
  skipInstall: boolean;
}

/** Inputs rules tầng 1 — services hợp lệ + layer tra từ manifest. */
export interface SelectionContext {
  validServices: string[];
  layerOf: (service: string) => StackLayer | undefined;
}

function parseServicesList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse argv — lỗi đầu tiên trả ngay (mirror create-wakii-app). */
export function parseArgs(argv: readonly string[]): ParseResult {
  const options: CliOptions = { all: false, yes: false, skipInstall: false };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--yes') {
      options.yes = true;
    } else if (arg === '--skip-install') {
      options.skipInstall = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--services') {
      const value = argv[i + 1];
      i += 1;
      if (!value) return { ok: false, message: '--services cần danh sách phẩy: --services node-svc,shell' };
      options.services = parseServicesList(value);
    } else if (arg?.startsWith('--services=')) {
      options.services = parseServicesList(arg.slice('--services='.length));
    } else if (arg?.startsWith('--')) {
      return { ok: false, message: `Flag không hỗ trợ: ${arg} (xem --help)` };
    } else if (arg !== undefined) {
      if (options.appName !== undefined) return { ok: false, message: 'Chỉ nhận MỘT tên stack (positional đầu tiên)' };
      options.appName = arg;
    }
    i += 1;
  }
  return { ok: true, options };
}

/**
 * Rules tầng 1 (đóng gói từ manifest layer):
 * - chọn rỗng (không --all, không --services, hoặc list rỗng) → lỗi "chọn ít nhất 1 service"
 * - service lạ (không trong manifest) → lỗi rõ
 * - ≥1 BE (layer 'be') ⇒ tự kèm postgres + kafka + gateway + auth-svc
 * - ≥1 FE (layer 'fe') ⇒ tự kèm gateway
 * Trả services sorted + appName theo basename rule (path → basename, y create-wakii-app).
 */
export function resolveOptions(options: CliOptions, ctx: SelectionContext): StackSelection {
  let selected: string[];
  if (options.all) {
    selected = [...ctx.validServices];
  } else if (options.services === undefined || options.services.length === 0) {
    throw new Error('Chọn ít nhất 1 service — dùng --all hoặc --services node-svc,shell,…');
  } else {
    const unknown = options.services.filter((s) => !ctx.validServices.includes(s));
    if (unknown.length > 0) {
      throw new Error(`Service không có trong manifest: ${unknown.join(', ')} — hợp lệ: ${ctx.validServices.join(', ')}`);
    }
    selected = [...options.services];
  }

  const set = new Set(selected);
  const hasLayer = (layer: StackLayer) => selected.some((s) => ctx.layerOf(s) === layer);
  const add = (name: string) => {
    if (ctx.validServices.includes(name)) set.add(name);
  };
  if (hasLayer('be')) {
    for (const name of ['postgres', 'kafka', 'gateway', 'auth-svc']) add(name);
  }
  if (hasLayer('fe')) add('gateway');

  const rawName = options.appName ?? 'my-wakii-stack';
  const appName = /[\\/]/.test(rawName) ? (rawName.split(/[\\/]/).pop() ?? 'my-wakii-stack') : rawName;
  return { appName, services: [...set].sort(), skipInstall: options.skipInstall };
}
