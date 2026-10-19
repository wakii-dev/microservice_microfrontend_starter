// UiKitProvider — theming layer (Phase theming, roadmap 2026-10-17):
// - theme 'dark' → data-bp-theme="dark" (themes/dark.css — palette direction B archive)
// - accent override → set --accent/--accent-hi trên scope (CSS vars cascade — con ghi đè
//   cha tự nhiên; scaffold project mới đổi brand 1 dòng)
// - theme OBJECT (batch F 2026-10-18) → runtime token overrides: set cặp --var/value
//   tương ứng trên wrapping div (canvas/s1/s2/s3/accent/accentHi/ink/ink2/ink3/line/
//   done/doing/fail → --c-canvas/--c-s1/…/--st-fail). Con cháu subtree ăn theo cascade —
//   CÙNG cơ chế với dark theme (attr + CSS vars, KHÔNG React context — tokens = nguồn).
//   Không truyền theme → không style attr, behavior cũ giữ nguyên.
import type { ReactNode } from 'react';

/** Runtime-overridable token keys → CSS var names (map đủ bộ màu chính). */
export type ThemeTokens = Partial<
  Record<
    'canvas' | 's1' | 's2' | 's3' | 'accent' | 'accentHi' | 'ink' | 'ink2' | 'ink3' | 'line' | 'done' | 'doing' | 'fail',
    string
  >
>;

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
};

export interface UiKitProviderProps {
  children: ReactNode;
  /**
   * 'light' (mặc định — antd look) | 'dark' (direction B archive) | object runtime
   * tokens (vd `{ accent: '#7c3aed', canvas: '#fdf6e3' }` — render CSS vars trên
   * scope, cascade xuống subtree).
   */
  theme?: 'light' | 'dark' | ThemeTokens;
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
  const style: Record<string, string> = {};
  if (accent) style['--accent'] = accent;
  if (accentHover) style['--accent-hi'] = accentHover;
  // Theme object áp SAU legacy accent props — key trùng thì object thắng.
  if (theme && typeof theme === 'object') {
    for (const [key, value] of Object.entries(theme)) {
      if (value) style[TOKEN_VAR[key as keyof typeof TOKEN_VAR]] = value;
    }
  }

  return (
    <div
      data-bp-theme={theme === 'dark' ? 'dark' : undefined}
      style={Object.keys(style).length ? (style as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
