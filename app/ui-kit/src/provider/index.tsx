// UiKitProvider — theming layer (Phase theming, roadmap 2026-10-17):
// - theme 'dark' → data-bp-theme="dark" (themes/dark.css — palette direction B archive)
// - accent override → set --accent/--accent-hi trên scope (CSS vars cascade — con ghi đè
//   cha tự nhiên; scaffold project mới đổi brand 1 dòng)
// - theme OBJECT (batch F 2026-10-18) → runtime token overrides: set cặp --var/value
//   tương ứng trên wrapping div (canvas/s1/s2/s3/accent/accentHi/ink/ink2/ink3/line/
//   done/doing/fail → --c-canvas/--c-s1/…/--st-fail; radiusLg/radiusXl/radiusPill/font
//   → --r-lg/--r-xl/--r-pill/--f — theming 0-break 2026-10-27). Con cháu subtree ăn
//   theo cascade — CÙNG cơ chế với dark theme (attr + CSS vars, KHÔNG React context —
//   tokens = nguồn). Không truyền theme → không style attr, behavior cũ giữ nguyên.
// - theme MODES (theming 2, 2026-10-27) → { light?, dark? } token-set RIÊNG theo mode:
//   provider TỰ ĐỌC attr data-bp-theme của tổ tiên gần nhất lúc mount (mặc định 'light')
//   + MutationObserver re-read khi attr đổi (pattern useChartTheme — ui/chart). Mode
//   light → CHỈ style light-vars (không attr, nhất quán behavior cũ); mode dark → attr
//   "dark" + dark-vars. Key modes[mode] KHÔNG set → cascade tự lo (dark.css cho dark,
//   :root defaults cho light) — KHÔNG merge default vào style.
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Runtime-overridable token keys → CSS var names.
 *
 * - Màu: canvas/s1/s2/s3 (bề mặt), accent/accentHi (brand), ink/ink2/ink3 (mực),
 *   line (viền), done/doing/fail (trạng thái) → --c-canvas/--c-s1/…/--st-fail.
 * - Radius (theming 0-break 2026-10-27): radiusLg/radiusXl/radiusPill → --r-lg/--r-xl/
 *   --r-pill. --r-lg/--r-xl map Tailwind rounded-lg/xl (giá trị default TRÙNG Tailwind
 *   8px/12px — 0-break) qua @theme --radius-lg/xl → override 1 var ăn toàn bộ chỗ dùng
 *   rounded-lg/xl (462 chỗ) mà không sửa component nào.
 * - Font: font → --f — font stack toàn subtree (Tailwind --font-sans map sẵn var này);
 *   brand font project scaffolded đổi 1 dòng.
 */
export type ThemeTokens = Partial<
  Record<
    | 'canvas'
    | 's1'
    | 's2'
    | 's3'
    | 'accent'
    | 'accentHi'
    | 'ink'
    | 'ink2'
    | 'ink3'
    | 'line'
    | 'done'
    | 'doing'
    | 'fail'
    | 'radiusLg'
    | 'radiusXl'
    | 'radiusPill'
    | 'font',
    string
  >
>;

/**
 * Token sets PER-MODE (theming 2 2026-10-27) — brand/màu khác nhau theo light/dark.
 * Khi `theme` là object dạng này, UiKitProvider tự quản mode: theo attr data-bp-theme
 * của tổ tiên gần nhất (host app toggle 1 attr — provider áp đúng token set, không
 * cần prop mới). Cả 2 key đều optional: thiếu mode nào thì mode đó cascade mặc định
 * (light → :root, dark → dark.css).
 */
export type ThemeModes = { light?: ThemeTokens; dark?: ThemeTokens };

const TOKEN_VAR: Record<keyof ThemeTokens, `--${string}`> = {
  canvas: '--c-canvas',
  s1: '--c-s1',
  s2: '--c-s2',
  s3: '--c-s3',
  accent: '--accent',
  accentHi: '--accent-hi',
  ink: '--ink',
  ink2: '--ink2',
  ink3: '--ink3',
  line: '--line',
  done: '--st-done',
  doing: '--st-doing',
  fail: '--st-fail',
  radiusLg: '--r-lg',
  radiusXl: '--r-xl',
  radiusPill: '--r-pill',
  font: '--f',
};

type BpMode = 'light' | 'dark';

/** Object có key light/dark mang giá trị object → ThemeModes; còn lại → ThemeTokens. */
function isThemeModes(theme: object): theme is ThemeModes {
  const t = theme as ThemeModes;
  return (
    (t.light !== undefined && typeof t.light === 'object') ||
    (t.dark !== undefined && typeof t.dark === 'object')
  );
}

export interface UiKitProviderProps {
  children: ReactNode;
  /**
   * 'light' (mặc định — antd look) | 'dark' (direction B archive) | ThemeTokens runtime
   * tokens (vd `{ accent: '#7c3aed', canvas: '#fdf6e3' }` — render CSS vars trên
   * scope, cascade xuống subtree) | ThemeModes per-mode (vd
   * `{ light: { accent: '#7c3aed' }, dark: { accent: '#22d3ee' } }` — provider tự theo
   * attr data-bp-theme của tổ tiên, live qua MutationObserver).
   */
  theme?: 'light' | 'dark' | ThemeTokens | ThemeModes;
  /** Override màu accent — hex/rgb bất kỳ (vd brand color của project scaffolded). */
  accent?: string;
  /** Hover accent — mặc định derive không có; truyền nếu cần (vd #4096ff cho antd blue). */
  accentHover?: string;
  className?: string;
}

export function UiKitProvider({
  children,
  theme = 'light',
  accent,
  accentHover,
  className,
}: UiKitProviderProps) {
  const modes = theme !== null && typeof theme === 'object' && isThemeModes(theme) ? theme : null;
  const scopeRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<BpMode>('light');
  const modeRef = useRef<BpMode>('light');

  // Modes → provider tự quản mode: đọc attr data-bp-theme của TỔ TIÊN gần nhất
  // (closest từ parentElement — KHÔNG tính chính wrapper này, tránh tự feed mình) +
  // re-read khi attr đổi trên <html>/subtree body (cùng observer pattern useChartTheme
  // — live theo host app toggle theme). Guard modeRef: chỉ setMode khi mode ĐỔI —
  // attr dark do chính scope tự ghi cũng bắn observer này, set cùng giá trị thì
  // bỏ qua (tránh re-render + act-warning trong test). Effect chạy cả khi không dùng
  // modes — đổi theme prop sang modes lúc runtime vẫn live.
  useLayoutEffect(() => {
    const readMode = () => {
      const ancestor = scopeRef.current?.parentElement?.closest('[data-bp-theme]');
      const next: BpMode = ancestor?.getAttribute('data-bp-theme') === 'dark' ? 'dark' : 'light';
      if (modeRef.current !== next) {
        modeRef.current = next;
        setMode(next);
      }
    };
    readMode();
    if (typeof MutationObserver === 'undefined') return undefined;
    const filter = ['data-bp-theme'];
    const mo = new MutationObserver(readMode);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: filter });
    mo.observe(document.body, { attributes: true, attributeFilter: filter, subtree: true });
    return () => mo.disconnect();
  }, []);

  const style: Record<string, string> = {};
  if (accent) style['--accent'] = accent;
  if (accentHover) style['--accent-hi'] = accentHover;
  // Tokens áp SAU legacy accent props — key trùng thì theme thắng.
  // Modes: CHỈ modes[mode] (không merge defaults/mode kia — key thiếu cascade tự lo).
  const tokens: ThemeTokens | undefined = modes
    ? modes[mode]
    : typeof theme === 'object'
      ? (theme as ThemeTokens)
      : undefined;
  if (tokens) {
    for (const [key, value] of Object.entries(tokens)) {
      if (value) style[TOKEN_VAR[key as keyof typeof TOKEN_VAR]] = value;
    }
  }

  // Attr dark: theme 'dark' trực tiếp, hoặc modes đang chạy mode dark (dark.css vẫn
  // ăn cascade cho key modes.dark không set). Light → không attr (nhất quán behavior cũ).
  const themeAttr = modes
    ? mode === 'dark'
      ? 'dark'
      : undefined
    : theme === 'dark'
      ? 'dark'
      : undefined;

  return (
    <div
      ref={scopeRef}
      data-bp-theme={themeAttr}
      style={Object.keys(style).length ? (style as CSSProperties) : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
