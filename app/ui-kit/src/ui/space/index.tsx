// Space — gap flex (antd): small 8 / middle 16 / large 24 (default 'small').
// slots-wave: classNames {root} + style passthrough — default path giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface SpaceClassNames {
  /** Div flex gốc. */
  root?: string;
}

export interface SpaceProps {
  size?: 'small' | 'middle' | 'large' | number;
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end' | 'baseline';
  wrap?: boolean;
  children: ReactNode;
  className?: string;
  /** Inline style — merge SAU gap/align (consumer override được). */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: SpaceClassNames;
}

const SIZE: Record<string, number> = { small: 8, middle: 16, large: 24 };

export function Space(props: SpaceProps) {
  const {
    size = 'small',
    direction = 'horizontal',
    align = 'center',
    wrap = false,
    children,
    className,
    style,
  } = props;
  const slots = props.classNames;
  const gap = typeof size === 'number' ? size : SIZE[size];
  return (
    <div
      className={classNames(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        wrap && 'flex-wrap',
        slots?.root,
        className,
      )}
      style={{ gap, alignItems: direction === 'vertical' ? align : undefined, ...style }}
    >
      {children}
    </div>
  );
}
