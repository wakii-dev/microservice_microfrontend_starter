// options — parse argv tự viết (0 dep parser, spec engine): flag đơn giản +
// defaults + validate. `router`/`appName`/`preset` có thể undefined = CHƯA chỉ
// định → CLI flow prompt; `--yes` lấy default qua resolveOptions.
export const EXTRAS = ['chart', 'carousel', 'schedule', 'editor'] as const;
export type Extra = (typeof EXTRAS)[number];
export type Lang = 'ts' | 'js';

/** 4 preset scaffold: demo (mặc định — demo page + router + extras),
 * minimal (trắng, không data layer), product (TanStack Query + zod + MSW +
 * feature mẫu), admin (product + overlay layout admin). */
export const PRESETS = ['demo', 'minimal', 'product', 'admin'] as const;
export type Preset = (typeof PRESETS)[number];

/** Framework template của preset demo: vite (mặc định) | next (App Router) | astro (React island). */
export const VARIANTS = ['vite', 'next', 'astro'] as const;
export type Variant = (typeof VARIANTS)[number];

export interface CliOptions {
  /** Positional đầu tiên — undefined → CLI prompt (default 'my-wakii-app'). */
  appName?: string;
  lang: Lang;
  /** undefined = chưa chỉ định (prompt); true/false = --router/--no-router. */
  router?: boolean;
  extras: Extra[];
  /** undefined = chưa chỉ định (prompt); default 'demo' qua resolveOptions. */
  preset?: Preset;
  /** undefined = chưa chỉ định (prompt khi demo); default 'vite'. Chỉ áp preset demo. */
  variant?: Variant;
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
  preset: Preset;
  variant: Variant;
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
    } else if (arg === '--preset') {
      const value = argv[i + 1];
      i += 1;
      if (!value) return { ok: false, message: `--preset cần giá trị: ${PRESETS.join('|')}` };
      if (!(PRESETS as readonly string[]).includes(value)) {
        return { ok: false, message: `--preset chỉ nhận: ${PRESETS.join(' | ')} — nhận: ${value}` };
      }
      options.preset = value as Preset;
    } else if (arg?.startsWith('--preset=')) {
      const value = arg.slice('--preset='.length);
      if (!(PRESETS as readonly string[]).includes(value)) {
        return { ok: false, message: `--preset chỉ nhận: ${PRESETS.join(' | ')} — nhận: ${value}` };
      }
      options.preset = value as Preset;
    } else if (arg === '--variant') {
      const value = argv[i + 1];
      i += 1;
      if (!value) return { ok: false, message: `--variant cần giá trị: ${VARIANTS.join('|')}` };
      if (!(VARIANTS as readonly string[]).includes(value)) {
        return { ok: false, message: `--variant chỉ nhận: ${VARIANTS.join(' | ')} — nhận: ${value}` };
      }
      options.variant = value as Variant;
    } else if (arg?.startsWith('--variant=')) {
      const value = arg.slice('--variant='.length);
      if (!(VARIANTS as readonly string[]).includes(value)) {
        return { ok: false, message: `--variant chỉ nhận: ${VARIANTS.join(' | ')} — nhận: ${value}` };
      }
      options.variant = value as Variant;
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
 * có extras mà router bị TẮT TƯỜNG MINH → lỗi rõ cho user bỏ một trong hai.
 * Preset khác demo: luôn có router (template đóng gói sẵn), KHÔNG nhận extras
 * (demo-only) và KHÔNG nhận lang js (chỉ sinh bản ts). */
export function resolveOptions(options: CliOptions): ScaffoldPlan {
  const preset = options.preset ?? 'demo';
  const variant = options.variant ?? 'vite';
  if (options.extras.length > 0 && options.router === false) {
    throw new Error('--no-router mâu thuẫn với --extras (demo subpath cần route để mở) — bỏ --no-router hoặc bỏ extras');
  }
  if (preset !== 'demo' && options.extras.length > 0) {
    throw new Error(`--extras chỉ dành cho preset demo (preset '${preset}' có cấu trúc riêng) — bỏ --extras hoặc dùng --preset demo`);
  }
  if (preset !== 'demo' && options.lang === 'js') {
    throw new Error(`Preset '${preset}' hiện chỉ hỗ trợ TypeScript — bỏ --lang js (hoặc dùng --preset demo)`);
  }
  if (variant !== 'vite' && preset !== 'demo') {
    throw new Error(`--variant ${variant} chỉ dành cho preset demo (template framework khác) — bỏ --variant hoặc dùng --preset demo`);
  }
  if (variant !== 'vite' && options.lang === 'js') {
    throw new Error(`--variant ${variant} hiện chỉ hỗ trợ TypeScript — bỏ --lang js`);
  }
  if (variant !== 'vite' && options.extras.length > 0) {
    throw new Error(`--extras chỉ dành cho variant vite (overlay demo chưa hỗ trợ ${variant}) — bỏ --extras`);
  }
  return {
    appName: options.appName ?? 'my-wakii-app',
    lang: options.lang,
    router: variant !== 'vite' || preset !== 'demo' ? true : options.extras.length > 0 ? true : (options.router ?? true),
    extras: options.extras,
    preset,
    variant,
    skipInstall: options.skipInstall,
  };
}
