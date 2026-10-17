// Space — gap flex (antd): small 8 / middle 16 (default? antd default small=8 qua
// size='small' là mặc định component) — ở đây default 'small' = 8px khớp antd.
import type { ReactNode } from 'react';

export interface SpaceProps {
  size?: 'small' | 'middle' | 'large' | number;
  direction?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end' | 'baseline';
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}

const SIZE: Record<string, number> = { small: 8, middle: 16, large: 24 };

export function Space({
  size = 'small',
  direction = 'horizontal',
  align = 'center',
  wrap = false,
  children,
  className,
}: SpaceProps) {
  const gap = typeof size === 'number' ? size : SIZE[size];
  return (
    <div
      className={`flex${direction === 'vertical' ? ' flex-col' : ' flex-row'}${wrap ? ' flex-wrap' : ''}${className ? ` ${className}` : ''}`}
      style={{ gap, alignItems: direction === 'vertical' ? align : undefined }}
    >
      {children}
    </div>
  );
}
