// BlockUI — overlay chặn tương tác (antd lite: mask scrim var(--mask), z theo thang --z-*).
import type { ReactNode } from 'react';

export interface BlockUIProps {
  /** true = phủ overlay chặn tương tác lên children. */
  blocked: boolean;
  /** Nội dung bị khoá. */
  children: ReactNode;
  /** Message hiển thị giữa overlay. */
  message?: string;
  className?: string;
}

export function BlockUI({ blocked, children, message, className }: BlockUIProps) {
  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      {children}
      {blocked && (
        <div className="absolute inset-0 z-[var(--z-popover)] flex items-center justify-center rounded-[inherit] bg-[var(--mask)]">
          {message && <span className="text-body font-medium text-white">{message}</span>}
        </div>
      )}
    </div>
  );
}
