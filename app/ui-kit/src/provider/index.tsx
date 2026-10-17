// UiKitProvider — theming layer (Phase theming, roadmap 2026-10-17):
// - theme 'dark' → data-bp-theme="dark" (themes/dark.css — palette direction B archive)
// - accent override → set --accent/--accent-hi trên scope (CSS vars cascade — con ghi đè
//   cha tự nhiên; scaffold project mới đổi brand 1 dòng)
// KHÔNG dùng React context — attr + CSS vars là cơ chế nguồn-dính-thật (tokens = nguồn).
import type { ReactNode } from 'react';

export interface UiKitProviderProps {
  children: ReactNode;
  /** 'light' (mặc định — antd look) | 'dark' (direction B archive). */
  theme?: 'light' | 'dark';
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
