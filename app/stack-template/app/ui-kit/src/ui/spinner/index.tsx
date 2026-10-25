// Spinner — 3 variants chọn được (motion identity — user chọn style):
// ring (mặc định, viền quay) · dots (3 chấm pulse) · bars (4 vạch scaleY).
// Mỗi variant đủ size sm/md/lg + màu accent/muted/inverse qua text-*
// (border-current/bg-current kế màu). Label = aria-label BẮT BUỘC.
import type { ReactNode } from 'react';

export interface SpinnerProps {
  /** aria-label BẮT BUỘC — màn đọc cần biết busy của cái gì. */
  label: string;
  /** ring (mặc định) / dots / bars. */
  variant?: 'ring' | 'dots' | 'bars';
  /** small / default / large. */
  size?: 'small' | 'default' | 'large';
  /** Màu: accent (mặc định) / muted (ink3) / inverse (trắng — trên nền tối). */
  color?: 'accent' | 'muted' | 'inverse';
  className?: string;
}

const SIZE: Record<string, string> = {
  small: 'size-3',
  default: 'size-3.5',
  large: 'size-5',
};

const COLOR: Record<string, string> = {
  accent: 'text-accent',
  muted: 'text-ink3',
  inverse: 'text-white',
};

export function Spinner({ label, variant = 'ring', size = 'default', color = 'accent', className }: SpinnerProps) {
  const colorCls = COLOR[color];
  const box = SIZE[size];
  let node: ReactNode;

  if (variant === 'dots') {
    node = (
      <span className="inline-flex items-center gap-[0.2em]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 140}ms` }}
            className={`size-[0.3em] animate-[bp-dots_1.2s_ease-in-out_infinite] rounded-pill bg-current ${colorCls}`}
          />
        ))}
      </span>
    );
  } else if (variant === 'bars') {
    const barH = size === 'small' ? 'h-[0.5em]' : size === 'large' ? 'h-[1em]' : 'h-[0.8em]';
    node = (
      <span className="inline-flex items-center gap-[2px]" style={{ height: '1em' }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 120}ms` }}
            className={`w-[0.15em] animate-[bp-bars_1s_ease-in-out_infinite] rounded-pill bg-current origin-bottom ${barH} ${colorCls}`}
          />
        ))}
      </span>
    );
  } else {
    node = (
      <span
        className={`inline-block animate-spin rounded-pill border-2 border-current border-t-transparent ${box} ${colorCls}`}
      />
    );
  }

  return (
    <span role="status" aria-label={label} className={`inline-flex items-center ${colorCls}${className ? ` ${className}` : ''}`}>
      {node}
    </span>
  );
}
