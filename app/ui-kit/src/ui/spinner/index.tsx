// Spinner — 3 variants chọn được (motion identity — user chọn style):
// ring (mặc định, viền quay) · dots (3 chấm pulse) · bars (4 vạch scaleY).
// Mỗi variant đủ size sm/md/lg + màu accent/muted/inverse qua text-*
// (border-current/bg-current kế màu). Label = aria-label BẮT BUỘC.
// Customize pass (slots wave 3): classNames slots (root/indicator) + style
// passthrough — default path (không truyền) giữ nguyên DOM/GUI. Không có slot
// "label" vì label chỉ là aria-label trên root (không element riêng).
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes kiểu antd v5 — merge sau class mặc định (consumer append). */
export interface SpinnerClassNames {
  /** Span gốc role="status" (nơi className prop cũng dính). */
  root?: string;
  /** Node hiển thị variant bên trong (span quay / flex chấm / flex vạch). */
  indicator?: string;
}

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
  /** Inline style — passthrough lên span gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 — merge sau class mặc định. */
  classNames?: SpinnerClassNames;
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

export function Spinner(props: SpinnerProps) {
  const { label, variant = 'ring', size = 'default', color = 'accent', className, style } = props;
  const colorCls = COLOR[color];
  const box = SIZE[size];
  let node: ReactNode;

  if (variant === 'dots') {
    node = (
      <span className={classNames('inline-flex items-center gap-[0.2em]', props.classNames?.indicator)}>
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
      <span
        className={classNames('inline-flex items-center gap-[2px]', props.classNames?.indicator)}
        style={{ height: '1em' }}
      >
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
        className={classNames(
          'inline-block animate-spin rounded-pill border-2 border-current border-t-transparent',
          box,
          colorCls,
          props.classNames?.indicator,
        )}
      />
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={classNames('inline-flex items-center', colorCls, props.classNames?.root, className)}
      style={style}
    >
      {node}
    </span>
  );
}
