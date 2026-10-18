// Divider — đường kẻ phân cách (antd): horizontal margin 16px 0 / vertical 0 8px,
// dashed variant, với text (nền theo context).
import type { ReactNode } from 'react';

export interface DividerProps {
  /** horizontal (mặc định) | vertical — vertical là span inline cao 0.9em. */
  type?: 'horizontal' | 'vertical';
  /** Viền đứt (antd dashed) — mặc định liền. */
  dashed?: boolean;
  /** Text giữa đường kẻ (chỉ horizontal). */
  children?: ReactNode;
  className?: string;
}

export function Divider({ type = 'horizontal', dashed = false, children, className }: DividerProps) {
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
  if (children !== undefined) {
    return (
      <div
        role="separator"
        className={`flex items-center text-label text-ink3${className ? ` ${className}` : ''}`}
        style={{ margin: '16px 0' }}
      >
        <span className={`flex-1 border-t ${dashed ? 'border-dashed border-line' : 'border-solid border-line2'}`} />
        <span className="px-4">{children}</span>
        <span className={`flex-1 border-t ${dashed ? 'border-dashed border-line' : 'border-solid border-line2'}`} />
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
