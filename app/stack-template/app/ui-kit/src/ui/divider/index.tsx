// Divider — đường kẻ phân cách (antd): horizontal margin 16px 0 / vertical 0 8px,
// dashed variant, với text (nền theo context).
import type { ReactNode } from 'react';

export interface DividerProps {
  /** horizontal (mặc định) | vertical — vertical là span inline cao 0.9em. */
  type?: 'horizontal' | 'vertical';
  /** Viền đứt (antd dashed) — mặc định liền. */
  dashed?: boolean;
  /** Vị trí text: 'left' | 'center' (mặc định) | 'right' (antd orientation). */
  orientation?: 'left' | 'center' | 'right';
  /** Text trên đường kẻ (chỉ horizontal). */
  children?: ReactNode;
  className?: string;
}

export function Divider({ type = 'horizontal', dashed = false, orientation = 'center', children, className }: DividerProps) {
  if (type === 'vertical') {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={`inline-block h-[0.9em] w-px align-middle${dashed ? ' border-l border-dashed border-line' : ' bg-line'}${className ? ` ${className}` : ''}`}
        style={{ margin: '0 8px' }}
      />
    );
  }
  const line = `border-t ${dashed ? 'border-dashed border-line' : 'border-solid border-line2'}`;
  if (children !== undefined) {
    if (orientation === 'left') {
      return (
        <div role="separator" className={`flex items-center text-label text-ink3${className ? ` ${className}` : ''}`} style={{ margin: '16px 0' }}>
          <span className="mr-4">{children}</span>
          <span className={`flex-1 ${line}`} />
        </div>
      );
    }
    if (orientation === 'right') {
      return (
        <div role="separator" className={`flex items-center text-label text-ink3${className ? ` ${className}` : ''}`} style={{ margin: '16px 0' }}>
          <span className={`flex-1 ${line}`} />
          <span className="ml-4">{children}</span>
        </div>
      );
    }
    return (
      <div
        role="separator"
        className={`flex items-center text-label text-ink3${className ? ` ${className}` : ''}`}
        style={{ margin: '16px 0' }}
      >
        <span className={`flex-1 ${line}`} />
        <span className="px-4">{children}</span>
        <span className={`flex-1 ${line}`} />
      </div>
    );
  }
  return (
    <div
      role="separator"
      className={`border-t ${dashed ? 'border-dashed border-line' : 'border-solid border-line2'}${className ? ` ${className}` : ''}`}
      style={{ margin: '16px 0' }}
    />
  );
}
