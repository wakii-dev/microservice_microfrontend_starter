// BlockUI — overlay chặn tương tác (antd lite).
import type { ReactNode } from 'react';

export interface BlockUIProps {
  blocked: boolean;
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
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[inherit] bg-[rgba(255,255,255,0.6)]">
          {message && <span className="text-body font-medium text-ink2">{message}</span>}
        </div>
      )}
    </div>
  );
}
