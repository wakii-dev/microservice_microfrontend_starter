// options — parse argv tự viết (0 dep parser, spec engine): flag đơn giản +
// defaults + validate. `router`/`appName` có thể undefined = CHƯA chỉ định →
// CLI flow prompt; `--yes` lấy default qua resolveOptions.
export const EXTRAS = ['chart', 'carousel', 'schedule', 'editor'] as const;
export type Extra = (typeof EXTRAS)[number];
export type Lang = 'ts' | 'js';

export interface CliOptions {
  /** Positional đầu tiên — undefined → CLI prompt (default 'my-wakii-app'). */
  appName?: string;
  lang: Lang;
  /** undefined = chưa chỉ định (prompt); true/false = --router/--no-router. */
  router?: boolean;
  extras: Extra[];
  yes: boolean;
  skipInstall: boolean;
  /** --help — index.ts in usage (options không tự in). */
  help?: boolean;
  /** --extras có mặt trên argv — CLI flow dùng để bỏ prompt multiselect. */
  extrasProvided?: boolean;
}

export type ParseResult = { ok: true; options: CliOptions } | { ok: false; message: string };

/** Plan hoàn chỉnh sau khi đổ default — đầu vào của scaffold(). */
export interface ScaffoldPlan {
  appName: string;
  lang: Lang;
  router: boolean;
  extras: Extra[];
  skipInstall: boolean;
}

function parseExtrasList(raw: string): { ok: true; extras: Extra[] } | { ok: false; message: string } {
  const names = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const extras: Extra[] = [];
  for (const name of names) {
    if (!(EXTRAS as readonly string[]).includes(name)) {
      return { ok: false, message: `Extra không hỗ trợ: '${name}' — hợp lệ: ${EXTRAS.join(', ')}` };
    }
    if (!extras.includes(name as Extra)) extras.push(name as Extra);
  }
  return { ok: true, extras };
}

/** Parse argv (đã cắt program name) — lỗi đầu tiên trả ngay (không gom). */
export function parseArgs(argv: readonly string[]): ParseResult {
  const options: CliOptions = { lang: 'ts', extras: [], yes: false, skipInstall: false };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--yes') {
      options.yes = true;
    } else if (arg === '--skip-install') {
      options.skipInstall = true;
    } else if (arg === '--router') {
      options.router = true;
    } else if (arg === '--no-router') {
      options.router = false;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--lang') {
      const value = argv[i + 1];
      i += 1;
      if (value !== 'ts' && value !== 'js') {
        return { ok: false, message: `--lang chỉ nhận 'ts' | 'js' — nhận: ${value ?? '(thiếu giá trị)'}` };
      }
      options.lang = value;
    } else if (arg?.startsWith('--lang=')) {
      const value = arg.slice('--lang='.length);
      if (value !== 'ts' && value !== 'js') {
        return { ok: false, message: `--lang chỉ nhận 'ts' | 'js' — nhận: ${value}` };
      }
      options.lang = value;
    } else if (arg === '--extras') {
      const value = argv[i + 1];
      i += 1;
      if (!value) return { ok: false, message: '--extras cần danh sách phẩy: --extras chart,carousel' };
      const parsed = parseExtrasList(value);
      if (!parsed.ok) return parsed;
      options.extras = parsed.extras;
      options.extrasProvided = true;
    } else if (arg?.startsWith('--extras=')) {
      const parsed = parseExtrasList(arg.slice('--extras='.length));
      if (!parsed.ok) return parsed;
      options.extras = parsed.extras;
      options.extrasProvided = true;
    } else if (arg?.startsWith('--')) {
      return { ok: false, message: `Flag không hỗ trợ: ${arg} (xem --help)` };
    } else if (arg !== undefined) {
      if (options.appName !== undefined) return { ok: false, message: 'Chỉ nhận MỘT tên project (positioned đầu tiên)' };
      options.appName = arg;
    }
    i += 1;
  }
  return { ok: true, options };
}

/** Đổ default cho các field chưa chỉ định — dùng khi `--yes` hoặc sau prompts.
 * Extras cần router (demo subpath là route riêng — quyết định thiết kế
 * 2026-10-24: copy-overlay không thể mở route khi thiếu BrowserRouter):
 * có extras mà router bị TẮT TƯỜNG MINH → lỗi rõ cho user bỏ một trong hai. */
export function resolveOptions(options: CliOptions): ScaffoldPlan {
  if (options.extras.length > 0 && options.router === false) {
    throw new Error('--no-router mâu thuẫn với --extras (demo subpath cần route để mở) — bỏ --no-router hoặc bỏ extras');
  }
  return {
    appName: options.appName ?? 'my-wakii-app',
    lang: options.lang,
    router: options.extras.length > 0 ? true : (options.router ?? true),
    extras: options.extras,
    skipInstall: options.skipInstall,
  };
}
